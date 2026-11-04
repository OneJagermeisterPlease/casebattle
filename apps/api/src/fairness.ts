import { randomBytes } from 'node:crypto';
import { rollFloat, sha256Hex } from '@casebattle/shared';
import type { Tx } from './db';

export async function newServerSeed() {
  const serverSeed = randomBytes(32).toString('hex');
  return { serverSeed, serverSeedHash: await sha256Hex(serverSeed) };
}

export const newClientSeed = () => randomBytes(8).toString('hex');

/** Берёт следующий nonce игрока и возвращает `count` бросков из его пары сидов. */
export async function takeRolls(tx: Tx, userId: string, count: number) {
  const u = await tx.user.update({
    where: { id: userId },
    data: { nonce: { increment: 1 } },
    select: { serverSeed: true, clientSeed: true, nonce: true },
  });
  const rolls = await Promise.all(
    Array.from({ length: count }, (_, i) => rollFloat(u.serverSeed, u.clientSeed, u.nonce, i)),
  );
  return { rolls, nonce: u.nonce, clientSeed: u.clientSeed };
}
