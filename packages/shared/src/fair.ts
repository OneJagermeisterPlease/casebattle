import type { CaseItem } from './types';

/**
 * Provably fair: результат = HMAC-SHA256(serverSeed, `${clientSeed}:${nonce}:${cursor}`).
 * Хеш serverSeed показывается игроку заранее, сам seed раскрывается после ротации,
 * и любой может пересчитать результат.
 */
export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return toHex(digest);
}

export async function rollFloat(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  cursor = 0,
): Promise<number> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(serverSeed),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`${clientSeed}:${nonce}:${cursor}`));
  // 52 бита -> равномерное число в [0, 1)
  return parseInt(toHex(sig).slice(0, 13), 16) / 2 ** 52;
}

export function pickByWeight<T extends Pick<CaseItem, 'weight'>>(entries: T[], roll: number): T {
  if (entries.length === 0) throw new Error('empty case');
  const total = entries.reduce((sum, e) => sum + e.weight, 0);
  let target = roll * total;
  for (const entry of entries) {
    target -= entry.weight;
    if (target < 0) return entry;
  }
  return entries[entries.length - 1]!;
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}
