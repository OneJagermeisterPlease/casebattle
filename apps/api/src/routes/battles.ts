import { BATTLE_SLOTS, type BattleMode } from '@casebattle/shared';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireUser } from '../auth';
import { prisma } from '../db';
import { httpError } from '../errors';
import { newServerSeed } from '../fairness';
import { battleView, startBattle, teamFor } from '../battles/runner';
import { emitBattle } from '../realtime';
import { credit, debit } from '../wallet';

const MAX_ROUNDS = 25;

async function startIfFull(id: string) {
  const b = await prisma.battle.findUniqueOrThrow({ where: { id }, include: { _count: { select: { players: true } } } });
  if (b.status === 'waiting' && b._count.players >= BATTLE_SLOTS[b.mode as BattleMode]) {
    const res = await prisma.battle.updateMany({ where: { id, status: 'waiting' }, data: { status: 'running' } });
    if (res.count === 1) void startBattle(id);
  }
}

async function publish(id: string) {
  const view = await battleView(id);
  if (view) emitBattle('battle:update', view);
  return view;
}

export async function battleRoutes(app: FastifyInstance) {
  app.get('/battles', async () => {
    const [active, finished] = await Promise.all([
      prisma.battle.findMany({ where: { status: { in: ['waiting', 'running'] } }, orderBy: { createdAt: 'desc' }, take: 50 }),
      prisma.battle.findMany({ where: { status: 'finished' }, orderBy: { finishedAt: 'desc' }, take: 20 }),
    ]);
    const views = await Promise.all([...active, ...finished].map((b) => battleView(b.id)));
    return views.filter(Boolean);
  });

  app.get('/battles/:id', async (req) => {
    const view = await battleView((req.params as { id: string }).id);
    if (!view) throw httpError(404, 'Батл не найден');
    return view;
  });

  app.post('/battles', async (req) => {
    const user = await requireUser(req);
    const body = z
      .object({
        mode: z.enum(['1v1', '1v1v1', '1v1v1v1', '2v2']),
        caseSlugs: z.array(z.string()).min(1).max(MAX_ROUNDS),
        crazy: z.boolean().default(false),
      })
      .parse(req.body);
    const cases = await prisma.case.findMany({ where: { slug: { in: body.caseSlugs }, isActive: true } });
    const bySlug = new Map(cases.map((c) => [c.slug, c]));
    const ordered = body.caseSlugs.map((s) => {
      const c = bySlug.get(s);
      if (!c) throw httpError(400, `Кейс ${s} недоступен`);
      if (c.limitTotal !== null) throw httpError(400, 'Лимитированные кейсы нельзя использовать в батлах');
      return c;
    });
    const cost = ordered.reduce((s, c) => s + c.price, 0);
    const seeds = await newServerSeed();
    const battle = await prisma.$transaction(async (tx) => {
      await debit(tx, user.id, cost, 'battle_join');
      return tx.battle.create({
        data: {
          mode: body.mode,
          crazy: body.crazy,
          caseIds: JSON.stringify(ordered.map((c) => c.id)),
          cost,
          createdById: user.id,
          ...seeds,
          players: { create: { slot: 0, team: teamFor(body.mode, 0), userId: user.id } },
        },
      });
    });
    return publish(battle.id);
  });

  app.post('/battles/:id/join', async (req) => {
    const user = await requireUser(req);
    const { id } = req.params as { id: string };
    const { slot } = z.object({ slot: z.number().int().min(0).max(3).optional() }).parse(req.body ?? {});
    await prisma.$transaction(async (tx) => {
      const b = await tx.battle.findUnique({ where: { id }, include: { players: true } });
      if (!b || b.status !== 'waiting') throw httpError(400, 'К батлу нельзя присоединиться');
      if (b.players.some((p) => p.userId === user.id)) throw httpError(400, 'Вы уже в этом батле');
      const slots = BATTLE_SLOTS[b.mode as BattleMode];
      const taken = new Set(b.players.map((p) => p.slot));
      const target = slot ?? [...Array(slots).keys()].find((s) => !taken.has(s));
      if (target === undefined || target >= slots || taken.has(target)) throw httpError(409, 'Место занято');
      await debit(tx, user.id, b.cost, 'battle_join');
      await tx.battlePlayer.create({ data: { battleId: id, slot: target, team: teamFor(b.mode, target), userId: user.id } });
    });
    const view = await publish(id);
    await startIfFull(id);
    return view;
  });

  app.post('/battles/:id/bots', async (req) => {
    const user = await requireUser(req);
    const { id } = req.params as { id: string };
    await prisma.$transaction(async (tx) => {
      const b = await tx.battle.findUnique({ where: { id }, include: { players: true } });
      if (!b || b.status !== 'waiting') throw httpError(400, 'Батл уже начался');
      if (b.createdById !== user.id) throw httpError(403, 'Ботов может позвать только создатель');
      const slots = BATTLE_SLOTS[b.mode as BattleMode];
      const taken = new Set(b.players.map((p) => p.slot));
      const free = [...Array(slots).keys()].filter((s) => !taken.has(s));
      const bots = await tx.user.findMany({ where: { isBot: true }, take: 20 });
      const shuffled = bots.sort(() => Math.random() - 0.5);
      if (shuffled.length < free.length) throw httpError(500, 'Не хватает ботов');
      for (const [i, s] of free.entries()) {
        await tx.battlePlayer.create({ data: { battleId: id, slot: s, team: teamFor(b.mode, s), userId: shuffled[i]!.id } });
      }
    });
    const view = await publish(id);
    await startIfFull(id);
    return view;
  });

  app.post('/battles/:id/cancel', async (req) => {
    const user = await requireUser(req);
    const { id } = req.params as { id: string };
    await prisma.$transaction(async (tx) => {
      const b = await tx.battle.findUnique({ where: { id }, include: { players: { include: { user: true } } } });
      if (!b || b.status !== 'waiting') throw httpError(400, 'Батл нельзя отменить');
      if (b.createdById !== user.id && !user.isAdmin) throw httpError(403, 'Отменить может только создатель');
      const res = await tx.battle.updateMany({ where: { id, status: 'waiting' }, data: { status: 'cancelled' } });
      if (res.count === 0) throw httpError(409, 'Батл уже начался');
      for (const p of b.players) if (!p.user.isBot) await credit(tx, p.userId, b.cost, 'battle_refund');
    });
    return publish(id);
  });
}
