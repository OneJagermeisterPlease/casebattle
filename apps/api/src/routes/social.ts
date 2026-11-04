import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db';
import { httpError } from '../errors';
import { dropDTO, inventoryDTO, publicUser } from '../serialize';

export async function socialRoutes(app: FastifyInstance) {
  app.get('/feed', async (req) => {
    const { limit, top } = z
      .object({ limit: z.coerce.number().int().min(1).max(50).default(30), top: z.coerce.boolean().default(false) })
      .parse(req.query);
    const rows = await prisma.inventoryItem.findMany({
      where: top ? { price: { gte: 100000 } } : {},
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { item: true, user: true, case: true },
    });
    return rows.map(dropDTO);
  });

  app.get('/stats', async () => {
    const [totalDrops, users, battles, opened] = await Promise.all([
      prisma.inventoryItem.count(),
      prisma.user.count({ where: { isBot: false } }),
      prisma.battle.count({ where: { status: 'finished' } }),
      prisma.inventoryItem.count({ where: { source: 'case' } }),
    ]);
    return { totalDrops, users, battles, opened };
  });

  app.get('/leaderboard', async () => {
    const top = await prisma.inventoryItem.groupBy({
      by: ['userId'],
      _sum: { price: true },
      _count: { _all: true },
      orderBy: { _sum: { price: 'desc' } },
      take: 50,
    });
    const users = await prisma.user.findMany({ where: { id: { in: top.map((t) => t.userId) } } });
    const byId = new Map(users.map((u) => [u.id, u]));
    return top.map((t, i) => ({
      place: i + 1,
      user: publicUser(byId.get(t.userId)!),
      totalWon: t._sum.price ?? 0,
      drops: t._count._all,
    }));
  });

  app.get('/users/:id', async (req) => {
    const { id } = req.params as { id: string };
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw httpError(404, 'Пользователь не найден');
    const [agg, opened, best, inventory, battles] = await Promise.all([
      prisma.inventoryItem.aggregate({ where: { userId: id }, _sum: { price: true } }),
      prisma.inventoryItem.count({ where: { userId: id, source: 'case' } }),
      prisma.inventoryItem.findFirst({ where: { userId: id }, orderBy: { price: 'desc' }, include: { item: true } }),
      prisma.inventoryItem.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        take: 120,
        include: { item: true },
      }),
      prisma.battlePlayer.count({ where: { userId: id } }),
    ]);
    return {
      user: publicUser(user),
      createdAt: user.createdAt.toISOString(),
      stats: { totalWon: agg._sum.price ?? 0, opened, battles },
      best: best && inventoryDTO(best),
      inventory: inventory.map(inventoryDTO),
    };
  });
}
