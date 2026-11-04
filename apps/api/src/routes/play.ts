import {
  CASE_MAX_OPEN,
  CONTRACT_MAX_ITEMS,
  CONTRACT_MIN_ITEMS,
  UPGRADE_MAX_ITEMS,
  contractRange,
  contractTargetPrice,
  pickByWeight,
  upgradeChance,
} from '@casebattle/shared';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireUser } from '../auth';
import { prisma, type Tx } from '../db';
import { httpError } from '../errors';
import { takeRolls } from '../fairness';
import { emitDrops } from '../realtime';
import { inventoryDTO } from '../serialize';
import { credit, debit } from '../wallet';

/** Забирает предметы игрока со статусом owned и меняет статус; падает, если хоть один уже недоступен. */
async function consumeItems(tx: Tx, userId: string, ids: string[], status: string) {
  const unique = [...new Set(ids)];
  if (unique.length !== ids.length) throw httpError(400, 'Предметы повторяются');
  const rows = await tx.inventoryItem.findMany({ where: { id: { in: unique }, userId, status: 'owned' } });
  if (rows.length !== unique.length) throw httpError(400, 'Некоторые предметы недоступны');
  const res = await tx.inventoryItem.updateMany({ where: { id: { in: unique }, status: 'owned' }, data: { status } });
  if (res.count !== unique.length) throw httpError(409, 'Предметы уже использованы');
  return rows;
}

const balanceOf = (tx: Tx, id: string) =>
  tx.user.findUniqueOrThrow({ where: { id }, select: { balance: true } }).then((u) => u.balance);

export async function playRoutes(app: FastifyInstance) {
  app.post('/cases/:slug/open', async (req) => {
    const user = await requireUser(req);
    const { slug } = req.params as { slug: string };
    const { count } = z.object({ count: z.number().int().min(1).max(CASE_MAX_OPEN).default(1) }).parse(req.body ?? {});
    const result = await prisma.$transaction(async (tx) => {
      const c = await tx.case.findUnique({
        where: { slug },
        include: { items: { include: { item: true }, orderBy: { itemId: 'asc' } } },
      });
      if (!c || !c.isActive) throw httpError(404, 'Кейс не найден');
      if (c.limitTotal !== null) {
        const res = await tx.case.updateMany({
          where: { id: c.id, limitOpened: { lte: c.limitTotal - count } },
          data: { limitOpened: { increment: count } },
        });
        if (res.count === 0) throw httpError(400, 'Лимит кейса исчерпан');
      }
      await debit(tx, user.id, c.price * count, `case:${c.slug}`);
      const { rolls, nonce } = await takeRolls(tx, user.id, count);
      const created = [];
      for (const roll of rolls) {
        const { item } = pickByWeight(c.items, roll);
        created.push(
          await tx.inventoryItem.create({
            data: { userId: user.id, itemId: item.id, price: item.price, source: 'case', caseId: c.id },
            include: { item: true },
          }),
        );
      }
      return { items: created.map(inventoryDTO), nonce, rolls, balance: await balanceOf(tx, user.id) };
    });
    void emitDrops(result.items.map((i) => i.id));
    return result;
  });

  app.get('/me/inventory', async (req) => {
    const user = await requireUser(req);
    const rows = await prisma.inventoryItem.findMany({
      where: { userId: user.id, status: 'owned' },
      include: { item: true },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(inventoryDTO);
  });

  app.post('/inventory/sell', async (req) => {
    const user = await requireUser(req);
    const { ids } = z.object({ ids: z.array(z.string()).min(1).max(500) }).parse(req.body);
    return prisma.$transaction(async (tx) => {
      const rows = await consumeItems(tx, user.id, ids, 'sold');
      const sum = rows.reduce((s, r) => s + r.price, 0);
      await credit(tx, user.id, sum, 'sell');
      return { sold: rows.length, amount: sum, balance: await balanceOf(tx, user.id) };
    });
  });

  app.post('/inventory/sell-all', async (req) => {
    const user = await requireUser(req);
    return prisma.$transaction(async (tx) => {
      const rows = await tx.inventoryItem.findMany({ where: { userId: user.id, status: 'owned' }, select: { id: true } });
      if (rows.length === 0) return { sold: 0, amount: 0, balance: await balanceOf(tx, user.id) };
      const consumed = await consumeItems(tx, user.id, rows.map((r) => r.id), 'sold');
      const sum = consumed.reduce((s, r) => s + r.price, 0);
      await credit(tx, user.id, sum, 'sell');
      return { sold: consumed.length, amount: sum, balance: await balanceOf(tx, user.id) };
    });
  });

  app.post('/upgrade', async (req) => {
    const user = await requireUser(req);
    const body = z
      .object({
        inventoryIds: z.array(z.string()).max(UPGRADE_MAX_ITEMS).default([]),
        balance: z.number().int().min(0).default(0),
        targetItemId: z.string(),
      })
      .parse(req.body);
    const result = await prisma.$transaction(async (tx) => {
      const target = await tx.item.findUnique({ where: { id: body.targetItemId } });
      if (!target) throw httpError(404, 'Предмет не найден');
      const rows = body.inventoryIds.length ? await consumeItems(tx, user.id, body.inventoryIds, 'upgraded') : [];
      const stake = rows.reduce((s, r) => s + r.price, 0) + body.balance;
      if (stake <= 0) throw httpError(400, 'Выберите предметы или добавьте баланс');
      if (target.price <= stake) throw httpError(400, 'Желаемый предмет должен быть дороже ставки');
      await debit(tx, user.id, body.balance, 'upgrade');
      const chance = upgradeChance(stake, target.price);
      const { rolls, nonce } = await takeRolls(tx, user.id, 1);
      const roll = rolls[0]!;
      const win = roll < chance;
      const won = win
        ? await tx.inventoryItem.create({
            data: { userId: user.id, itemId: target.id, price: target.price, source: 'upgrade' },
            include: { item: true },
          })
        : null;
      return { win, chance, roll, nonce, stake, item: won && inventoryDTO(won), balance: await balanceOf(tx, user.id) };
    });
    if (result.item) void emitDrops([result.item.id]);
    return result;
  });

  app.post('/contract', async (req) => {
    const user = await requireUser(req);
    const { inventoryIds } = z
      .object({ inventoryIds: z.array(z.string()).min(CONTRACT_MIN_ITEMS).max(CONTRACT_MAX_ITEMS) })
      .parse(req.body);
    const result = await prisma.$transaction(async (tx) => {
      const rows = await consumeItems(tx, user.id, inventoryIds, 'contracted');
      const sum = rows.reduce((s, r) => s + r.price, 0);
      const { min, max } = contractRange(sum);
      const { rolls, nonce } = await takeRolls(tx, user.id, 1);
      const targetPrice = contractTargetPrice(sum, rolls[0]!);
      const [above, below] = await Promise.all([
        tx.item.findFirst({ where: { price: { gte: targetPrice, lte: max } }, orderBy: { price: 'asc' } }),
        tx.item.findFirst({ where: { price: { lte: targetPrice, gte: min } }, orderBy: { price: 'desc' } }),
      ]);
      const pick =
        above && below
          ? above.price - targetPrice < targetPrice - below.price
            ? above
            : below
          : (above ?? below ?? (await tx.item.findFirst({ where: { price: { gte: min } }, orderBy: { price: 'asc' } })));
      if (!pick) throw httpError(500, 'Не удалось подобрать предмет');
      const won = await tx.inventoryItem.create({
        data: { userId: user.id, itemId: pick.id, price: pick.price, source: 'contract' },
        include: { item: true },
      });
      return { item: inventoryDTO(won), sum, min, max, roll: rolls[0], nonce, balance: await balanceOf(tx, user.id) };
    });
    void emitDrops([result.item.id]);
    return result;
  });
}
