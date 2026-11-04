import { describe, expect, it } from 'vitest';
import { pickByWeight, rollFloat } from './fair';

describe('provably fair', () => {
  it('is deterministic for the same seeds', async () => {
    const a = await rollFloat('server', 'client', 1);
    const b = await rollFloat('server', 'client', 1);
    expect(a).toBe(b);
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThan(1);
  });

  it('changes with nonce', async () => {
    expect(await rollFloat('server', 'client', 1)).not.toBe(await rollFloat('server', 'client', 2));
  });

  it('picks by weight', () => {
    const entries = [{ weight: 90 }, { weight: 10 }];
    expect(pickByWeight(entries, 0.5)).toBe(entries[0]);
    expect(pickByWeight(entries, 0.95)).toBe(entries[1]);
  });
});
