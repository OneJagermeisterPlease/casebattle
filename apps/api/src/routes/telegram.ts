import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { signToken } from '../auth';
import { prisma } from '../db';
import { httpError } from '../errors';
import { meDTO } from '../serialize';
import {
  botUsername,
  createLoginRequest,
  findOrCreateTelegramUser,
  pollLoginRequest,
  telegramEnabled,
  verifyWidget,
} from '../telegram';

export async function telegramRoutes(app: FastifyInstance) {
  app.get('/auth/telegram/config', async () => ({ enabled: telegramEnabled(), botUsername: botUsername() || null }));

  app.post('/auth/telegram/start', async () => {
    if (!telegramEnabled()) throw httpError(400, 'Вход через Telegram не настроен');
    return createLoginRequest();
  });

  app.get('/auth/telegram/status', async (req) => {
    const { token } = z.object({ token: z.string() }).parse(req.query);
    const res = pollLoginRequest(token);
    if (typeof res === 'string') return { status: res };
    const user = await prisma.user.findUniqueOrThrow({ where: { id: res.userId } });
    if (user.isBanned) throw httpError(403, 'Аккаунт заблокирован');
    return { status: 'done', token: signToken(user.id), user: meDTO(user) };
  });

  app.post('/auth/telegram/widget', async (req) => {
    const data = z.record(z.union([z.string(), z.number()])).parse(req.body);
    const fields = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)]));
    if (!verifyWidget(fields)) throw httpError(401, 'Подпись Telegram не прошла проверку');
    const user = await findOrCreateTelegramUser({ id: fields.id!, username: fields.username, first_name: fields.first_name });
    if (user.isBanned) throw httpError(403, 'Аккаунт заблокирован');
    return { token: signToken(user.id), user: meDTO(user) };
  });
}
