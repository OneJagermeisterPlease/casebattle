import type { Tx } from './db';
import { prisma } from './db';

type Db = Tx | typeof prisma;

/** Удача игрока в кейсе: сначала настройка для этого кейса, потом «все кейсы», иначе 0. */
export async function caseLuck(db: Db, userId: string, caseId: string): Promise<number> {
  const rows = await db.userLuck.findMany({ where: { userId, kind: 'case', OR: [{ caseId }, { caseId: null }] } });
  return (rows.find((r) => r.caseId === caseId) ?? rows.find((r) => r.caseId === null))?.value ?? 0;
}

export async function upgradeMultiplier(db: Db, userId: string): Promise<number> {
  const row = await db.userLuck.findFirst({ where: { userId, kind: 'upgrade' } });
  return row?.value ?? 1;
}

export async function contractLuck(db: Db, userId: string): Promise<number> {
  const row = await db.userLuck.findFirst({ where: { userId, kind: 'contract' } });
  return row?.value ?? 0;
}
