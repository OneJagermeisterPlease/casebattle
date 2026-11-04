import { battleTeam, pickByWeight, rollFloat, type BattleMode } from '@casebattle/shared';
import type { BattleDTO } from '@casebattle/shared';
import { prisma } from '../db';
import { env } from '../env';
import { emitBattle, emitDrops } from '../realtime';
import { battleDTO } from '../serialize';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const running = new Set<string>();

/** Курсор для броска тай-брейка — вне диапазона номеров слотов. */
const TIEBREAK_ROUND = 9999;

export async function battleView(id: string): Promise<BattleDTO | null> {
  const b = await prisma.battle.findUnique({
    where: { id },
    include: { players: { include: { user: true } }, drops: { include: { item: true } } },
  });
  if (!b) return null;
  const ids = JSON.parse(b.caseIds) as string[];
  const cases = await prisma.case.findMany({
    where: { id: { in: ids } },
    include: { _count: { select: { items: true } }, items: { include: { item: true } } },
  });
  return battleDTO(b, new Map(cases.map((c) => [c.id, c])));
}

async function broadcast(id: string, event: string, extra: Record<string, unknown> = {}) {
  const view = await battleView(id);
  if (view) emitBattle(event, view, extra);
}

export function startBattle(id: string): Promise<void> {
  if (running.has(id)) return Promise.resolve();
  running.add(id);
  return run(id)
    .catch((err) => console.error(`battle ${id} failed`, err))
    .finally(() => running.delete(id));
}

/** Продолжает батлы, прерванные перезапуском сервера. */
export async function resumeBattles() {
  const list = await prisma.battle.findMany({ where: { status: 'running' }, select: { id: true } });
  for (const b of list) void startBattle(b.id);
}

async function run(id: string) {
  const battle = await prisma.battle.findUniqueOrThrow({ where: { id }, include: { players: true } });
  const caseIds = JSON.parse(battle.caseIds) as string[];
  const cases = await prisma.case.findMany({
    where: { id: { in: caseIds } },
    include: { items: { include: { item: true }, orderBy: { itemId: 'asc' } } },
  });
  const caseById = new Map(cases.map((c) => [c.id, c]));

  if (battle.currentRound === 0) {
    await broadcast(id, 'battle:started', { startsInMs: env.battleStartDelayMs });
    await sleep(env.battleStartDelayMs);
  }

  for (let round = battle.currentRound; round < caseIds.length; round++) {
    const c = caseById.get(caseIds[round]!)!;
    const drops = await Promise.all(
      battle.players.map(async (p) => {
        const roll = await rollFloat(battle.serverSeed, battle.id, round, p.slot);
        return { slot: p.slot, item: pickByWeight(c.items, roll).item };
      }),
    );
    await prisma.$transaction([
      prisma.battleDrop.createMany({
        data: drops.map((d) => ({ battleId: id, round, slot: d.slot, itemId: d.item.id })),
      }),
      ...drops.map((d) =>
        prisma.battlePlayer.update({
          where: { battleId_slot: { battleId: id, slot: d.slot } },
          data: { total: { increment: d.item.price } },
        }),
      ),
      prisma.battle.update({ where: { id }, data: { currentRound: round + 1 } }),
    ]);
    await broadcast(id, 'battle:round', { round });
    await sleep(env.battleRoundMs);
  }

  await finish(id);
}

async function finish(id: string) {
  const b = await prisma.battle.findUniqueOrThrow({
    where: { id },
    include: { players: { include: { user: true } }, drops: { include: { item: true } } },
  });
  const teamTotals = new Map<number, number>();
  for (const p of b.players) teamTotals.set(p.team, (teamTotals.get(p.team) ?? 0) + p.total);
  const values = [...teamTotals.values()];
  const best = b.crazy ? Math.min(...values) : Math.max(...values);
  const contenders = [...teamTotals.entries()].filter(([, v]) => v === best).map(([t]) => t).sort();
  const tie = await rollFloat(b.serverSeed, b.id, TIEBREAK_ROUND, 0);
  const winnerTeam = contenders[Math.floor(tie * contenders.length)]!;

  // Победители забирают все предметы батла; внутри команды делим по очереди от самых дорогих.
  const winners = b.players.filter((p) => p.team === winnerTeam).sort((x, y) => x.slot - y.slot);
  const loot = [...b.drops].sort((x, y) => y.item.price - x.item.price);
  const createdIds: string[] = [];
  await prisma.$transaction(async (tx) => {
    for (const [i, drop] of loot.entries()) {
      const owner = winners[i % winners.length]!;
      if (owner.user.isBot) continue;
      const inv = await tx.inventoryItem.create({
        data: { userId: owner.userId, itemId: drop.itemId, price: drop.item.price, source: 'battle' },
      });
      createdIds.push(inv.id);
    }
    await tx.battle.update({ where: { id }, data: { status: 'finished', winnerTeam, finishedAt: new Date() } });
  });
  await broadcast(id, 'battle:finished');
  void emitDrops(createdIds);
}

export const teamFor = (mode: string, slot: number) => battleTeam(mode as BattleMode, slot);
