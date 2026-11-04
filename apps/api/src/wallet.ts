import type { Tx } from './db';
import { httpError } from './errors';

export async function debit(tx: Tx, userId: string, amount: number, reason: string) {
  if (amount <= 0) return;
  const res = await tx.user.updateMany({
    where: { id: userId, balance: { gte: amount } },
    data: { balance: { decrement: amount } },
  });
  if (res.count === 0) throw httpError(400, 'Недостаточно монет');
  await tx.transaction.create({ data: { userId, amount: -amount, reason } });
}

export async function credit(tx: Tx, userId: string, amount: number, reason: string) {
  if (amount <= 0) return;
  await tx.user.update({ where: { id: userId }, data: { balance: { increment: amount } } });
  await tx.transaction.create({ data: { userId, amount, reason } });
}
