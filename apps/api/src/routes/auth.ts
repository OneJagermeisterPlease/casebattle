import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireUser, signToken } from '../auth';
import { prisma } from '../db';
import { env } from '../env';
import { httpError } from '../errors';
import { newClientSeed, newServerSeed } from '../fairness';
import { DAY_MS, meDTO } from '../serialize';
import { credit } from '../wallet';

const credentials = z.object({
  nickname: z
    .string()
    .trim()
    .min(3, 'Ник от 3 символов')
    .max(20, 'Ник до 20 символов')
    .regex(/^[\p{L}\p{N}_ .-]+$/u, 'Ник: буквы, цифры, пробел, _ . -'),
  password: z.string().min(6, 'Пароль от 6 символов').max(100),
});

export async function createUser(
  nickname: string,
  password: string | null,
  extra: { telegramId?: string; telegramUsername?: string | null } = {},
) {
  if (await prisma.user.findUnique({ where: { nickname } })) throw httpError(409, 'Такой ник уже занят');
  const seeds = await newServerSeed();
  // '!' — не bcrypt-хеш, так что вход по паролю для таких аккаунтов невозможен.
  const passwordHash = password ? await bcrypt.hash(password, 10) : '!';
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { nickname, passwordHash, clientSeed: newClientSeed(), ...seeds, ...extra },
    });
    await credit(tx, user.id, env.startingBalance, 'signup_bonus');
    return tx.user.findUniqueOrThrow({ where: { id: user.id } });
  });
}

export async function authRoutes(app: FastifyInstance) {
  app.post('/auth/register', async (req) => {
    const { nickname, password } = credentials.parse(req.body);
    const user = await createUser(nickname, password);
    return { token: signToken(user.id), user: meDTO(user) };
  });

  app.post('/auth/login', async (req) => {
    const { nickname, password } = z.object({ nickname: z.string().trim(), password: z.string() }).parse(req.body);
    const user = await prisma.user.findUnique({ where: { nickname } });
    if (!user || user.isBot || user.passwordHash === '!' || !(await bcrypt.compare(password, user.passwordHash))) {
      throw httpError(401, 'Неверный ник или пароль');
    }
    if (user.isBanned) throw httpError(403, 'Аккаунт заблокирован');
    return { token: signToken(user.id), user: meDTO(user) };
  });

  app.post('/auth/guest', async () => {
    const user = await createUser(`Гость${randomBytes(3).readUIntBE(0, 3) % 1_000_000}`, randomBytes(16).toString('hex'));
    return { token: signToken(user.id), user: meDTO(user) };
  });

  app.get('/me', async (req) => meDTO(await requireUser(req)));

  app.post('/me/daily', async (req) => {
    const user = await requireUser(req);
    const now = Date.now();
    const user2 = await prisma.$transaction(async (tx) => {
      // Условие в where защищает от двойного получения бонуса параллельными запросами.
      const res = await tx.user.updateMany({
        where: { id: user.id, OR: [{ lastDailyAt: null }, { lastDailyAt: { lte: new Date(now - DAY_MS) } }] },
        data: { lastDailyAt: new Date(now) },
      });
      if (res.count === 0) throw httpError(400, 'Бонус уже получен, приходите позже');
      await credit(tx, user.id, env.dailyBonus, 'daily_bonus');
      return tx.user.findUniqueOrThrow({ where: { id: user.id } });
    });
    return meDTO(user2);
  });

  app.post('/me/promo', async (req) => {
    const user = await requireUser(req);
    const { code } = z.object({ code: z.string().trim().toUpperCase() }).parse(req.body);
    const updated = await prisma.$transaction(async (tx) => {
      const promo = await tx.promoCode.findUnique({ where: { code } });
      if (!promo) throw httpError(404, 'Промокод не найден');
      if (promo.maxUses !== null && promo.uses >= promo.maxUses) throw httpError(400, 'Промокод закончился');
      if (await tx.promoUse.findUnique({ where: { userId_code: { userId: user.id, code } } })) {
        throw httpError(400, 'Вы уже активировали этот промокод');
      }
      await tx.promoUse.create({ data: { userId: user.id, code } });
      await tx.promoCode.update({ where: { code }, data: { uses: { increment: 1 } } });
      await credit(tx, user.id, promo.amount, `promo:${code}`);
      return tx.user.findUniqueOrThrow({ where: { id: user.id } });
    });
    return meDTO(updated);
  });

  app.post('/me/client-seed', async (req) => {
    const user = await requireUser(req);
    const { clientSeed } = z.object({ clientSeed: z.string().trim().min(1).max(64) }).parse(req.body);
    return meDTO(await prisma.user.update({ where: { id: user.id }, data: { clientSeed } }));
  });

  app.post('/me/rotate-seed', async (req) => {
    const user = await requireUser(req);
    const next = await newServerSeed();
    return meDTO(
      await prisma.user.update({
        where: { id: user.id },
        data: { prevServerSeed: user.serverSeed, prevServerSeedHash: user.serverSeedHash, nonce: 0, ...next },
      }),
    );
  });

  app.get('/me/transactions', async (req) => {
    const user = await requireUser(req);
    return prisma.transaction.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 100 });
  });
}
