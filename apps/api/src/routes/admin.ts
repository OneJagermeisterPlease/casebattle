import { PATTERNS, RARITIES, WEAPON_KINDS } from '@casebattle/shared';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAdmin } from '../auth';
import { prisma } from '../db';
import { httpError } from '../errors';
import { caseDTO, inventoryDTO, itemDTO, publicUser } from '../serialize';
import { credit } from '../wallet';

const itemInput = z.object({
  id: z.string().min(1).optional(),
  weapon: z.string().min(1),
  finish: z.string().min(1),
  kind: z.enum(WEAPON_KINDS),
  rarity: z.enum(RARITIES),
  price: z.number().int().min(1),
  hue: z.number().int().min(0).max(359).default(200),
  pattern: z.enum(PATTERNS).default('solid'),
  imageUrl: z.string().url().nullable().optional(),
});

const caseInput = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, 'slug: латиница, цифры, дефис'),
  name: z.string().min(1),
  category: z.string().min(1),
  sortOrder: z.number().int().default(0),
  price: z.number().int().min(1),
  hue: z.number().int().min(0).max(359).default(200),
  icon: z.string().default('star'),
  imageUrl: z.string().url().nullable().optional(),
  limitTotal: z.number().int().min(1).nullable().optional(),
  isActive: z.boolean().default(true),
  items: z.array(z.object({ itemId: z.string(), weight: z.number().int().min(1) })).min(2),
});

async function saveCase(id: string, data: z.infer<typeof caseInput>) {
  const { items, ...fields } = data;
  const found = await prisma.item.count({ where: { id: { in: items.map((i) => i.itemId) } } });
  if (found !== new Set(items.map((i) => i.itemId)).size) throw httpError(400, 'В кейсе есть несуществующие предметы');
  await prisma.$transaction([
    prisma.case.upsert({ where: { id }, create: { id, ...fields }, update: fields }),
    prisma.caseItem.deleteMany({ where: { caseId: id } }),
    prisma.caseItem.createMany({ data: items.map((i) => ({ caseId: id, ...i })) }),
  ]);
}

export async function adminRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async (req) => {
    await requireAdmin(req);
  });

  app.get('/admin/stats', async () => {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [users, usersDay, balance, opensDay, opens, battles, invValue, topCases] = await Promise.all([
      prisma.user.count({ where: { isBot: false } }),
      prisma.user.count({ where: { isBot: false, createdAt: { gte: dayAgo } } }),
      prisma.user.aggregate({ where: { isBot: false }, _sum: { balance: true } }),
      prisma.inventoryItem.count({ where: { source: 'case', createdAt: { gte: dayAgo } } }),
      prisma.inventoryItem.count({ where: { source: 'case' } }),
      prisma.battle.count(),
      prisma.inventoryItem.aggregate({ where: { status: 'owned' }, _sum: { price: true } }),
      prisma.inventoryItem.groupBy({
        by: ['caseId'],
        where: { source: 'case' },
        _count: { _all: true },
        orderBy: { _count: { caseId: 'desc' } },
        take: 10,
      }),
    ]);
    const caseNames = new Map(
      (await prisma.case.findMany({ where: { id: { in: topCases.map((t) => t.caseId!).filter(Boolean) } } })).map((c) => [c.id, c.name]),
    );
    return {
      users,
      usersDay,
      totalBalance: balance._sum.balance ?? 0,
      inventoryValue: invValue._sum.price ?? 0,
      opensDay,
      opens,
      battles,
      topCases: topCases.map((t) => ({ name: caseNames.get(t.caseId!) ?? '—', opens: t._count._all })),
    };
  });

  app.get('/admin/users', async (req) => {
    const q = z
      .object({
        search: z.string().trim().optional(),
        bots: z.coerce.boolean().default(false),
        limit: z.coerce.number().int().min(1).max(200).default(50),
        offset: z.coerce.number().int().min(0).default(0),
      })
      .parse(req.query);
    const where = { isBot: q.bots, ...(q.search ? { nickname: { contains: q.search } } : {}) };
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: q.limit,
        skip: q.offset,
        include: { _count: { select: { inventory: true, battleSlots: true } } },
      }),
      prisma.user.count({ where }),
    ]);
    const won = await prisma.inventoryItem.groupBy({
      by: ['userId'],
      where: { userId: { in: users.map((u) => u.id) } },
      _sum: { price: true },
    });
    const wonBy = new Map(won.map((w) => [w.userId, w._sum.price ?? 0]));
    return {
      total,
      users: users.map((u) => ({
        ...publicUser(u),
        balance: u.balance,
        isAdmin: u.isAdmin,
        isBanned: u.isBanned,
        createdAt: u.createdAt.toISOString(),
        drops: u._count.inventory,
        battles: u._count.battleSlots,
        totalWon: wonBy.get(u.id) ?? 0,
      })),
    };
  });

  app.get('/admin/users/:id', async (req) => {
    const { id } = req.params as { id: string };
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw httpError(404, 'Пользователь не найден');
    const [transactions, inventory] = await Promise.all([
      prisma.transaction.findMany({ where: { userId: id }, orderBy: { createdAt: 'desc' }, take: 200 }),
      prisma.inventoryItem.findMany({ where: { userId: id }, orderBy: { createdAt: 'desc' }, take: 200, include: { item: true } }),
    ]);
    return {
      user: {
        ...publicUser(user),
        balance: user.balance,
        isAdmin: user.isAdmin,
        isBanned: user.isBanned,
        createdAt: user.createdAt.toISOString(),
        nonce: user.nonce,
      },
      transactions,
      inventory: inventory.map(inventoryDTO),
    };
  });

  app.post('/admin/users/:id/balance', async (req) => {
    const admin = await requireAdmin(req);
    const { id } = req.params as { id: string };
    const { amount } = z.object({ amount: z.number().int().refine((n) => n !== 0) }).parse(req.body);
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id } });
      if (!user) throw httpError(404, 'Пользователь не найден');
      if (amount > 0) await credit(tx, id, amount, `admin:${admin.nickname}`);
      else {
        const take = Math.min(-amount, user.balance);
        await tx.user.update({ where: { id }, data: { balance: { decrement: take } } });
        await tx.transaction.create({ data: { userId: id, amount: -take, reason: `admin:${admin.nickname}` } });
      }
      return { balance: (await tx.user.findUniqueOrThrow({ where: { id } })).balance };
    });
  });

  app.patch('/admin/users/:id', async (req) => {
    const admin = await requireAdmin(req);
    const { id } = req.params as { id: string };
    const data = z.object({ isBanned: z.boolean().optional(), isAdmin: z.boolean().optional() }).parse(req.body);
    if (id === admin.id && (data.isBanned || data.isAdmin === false)) throw httpError(400, 'Нельзя менять свои права');
    const u = await prisma.user.update({ where: { id }, data });
    return { ...publicUser(u), isAdmin: u.isAdmin, isBanned: u.isBanned };
  });

  app.get('/admin/cases', async () => {
    const cases = await prisma.case.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { items: { include: { item: true } }, _count: { select: { items: true, drops: true } } },
    });
    return cases.map((c) => {
      const total = c.items.reduce((s, ci) => s + ci.weight, 0);
      const ev = c.items.reduce((s, ci) => s + (ci.weight / total) * ci.item.price, 0);
      return {
        ...caseDTO(c),
        sortOrder: c.sortOrder,
        isActive: c.isActive,
        opens: c._count.drops,
        rtp: c.price ? ev / c.price : 0,
        items: c.items
          .map((ci) => ({ item: itemDTO(ci.item), weight: ci.weight, chance: ci.weight / total }))
          .sort((a, b) => b.item.price - a.item.price),
      };
    });
  });

  app.post('/admin/cases', async (req) => {
    const data = caseInput.parse(req.body);
    if (await prisma.case.findUnique({ where: { slug: data.slug } })) throw httpError(409, 'Такой slug уже есть');
    await saveCase(`case-${data.slug}`, data);
    return { ok: true };
  });

  app.put('/admin/cases/:id', async (req) => {
    const { id } = req.params as { id: string };
    if (!(await prisma.case.findUnique({ where: { id } }))) throw httpError(404, 'Кейс не найден');
    await saveCase(id, caseInput.parse(req.body));
    return { ok: true };
  });

  app.post('/admin/items', async (req) => {
    const { id, ...data } = itemInput.parse(req.body);
    const item = await prisma.item.create({ data: { id: id ?? `custom-${Date.now().toString(36)}`, ...data } });
    return itemDTO(item);
  });

  app.put('/admin/items/:id', async (req) => {
    const { id } = req.params as { id: string };
    const { id: _ignored, ...data } = itemInput.parse(req.body);
    return itemDTO(await prisma.item.update({ where: { id }, data }));
  });

  /** Массовый импорт каталога: предметы и кейсы в формате тех же DTO, что и в формах. */
  app.post('/admin/import', async (req) => {
    const body = z
      .object({
        items: z.array(itemInput.required({ id: true })).default([]),
        cases: z.array(caseInput).default([]),
      })
      .parse(req.body);
    for (const { id, ...data } of body.items) {
      await prisma.item.upsert({ where: { id }, create: { id, ...data }, update: data });
    }
    for (const c of body.cases) await saveCase(`case-${c.slug}`, c);
    return { items: body.items.length, cases: body.cases.length };
  });

  app.get('/admin/promos', async () => prisma.promoCode.findMany({ orderBy: { code: 'asc' } }));

  app.post('/admin/promos', async (req) => {
    const data = z
      .object({
        code: z.string().trim().toUpperCase().min(2).max(32),
        amount: z.number().int().min(1),
        maxUses: z.number().int().min(1).nullable().default(null),
      })
      .parse(req.body);
    return prisma.promoCode.upsert({ where: { code: data.code }, create: data, update: data });
  });

  app.delete('/admin/promos/:code', async (req) => {
    const { code } = req.params as { code: string };
    await prisma.$transaction([
      prisma.promoUse.deleteMany({ where: { code } }),
      prisma.promoCode.delete({ where: { code } }),
    ]);
    return { ok: true };
  });
}
