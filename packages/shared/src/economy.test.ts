import { describe, expect, it } from 'vitest';
import { contractRange, contractTargetPrice, upgradeChance, upgradeTargetForChance } from './economy';

describe('upgrade', () => {
  it('scales with stake/target and keeps the house edge', () => {
    expect(upgradeChance(100, 200)).toBeCloseTo(0.475);
  });
  it('is clamped', () => {
    expect(upgradeChance(100, 101)).toBe(0.75);
    expect(upgradeChance(1, 100000)).toBe(0.01);
  });
  it('inverts', () => {
    expect(upgradeChance(1000, upgradeTargetForChance(1000, 0.3))).toBeCloseTo(0.3, 3);
  });
});

describe('contract', () => {
  it('stays inside the advertised range', () => {
    const { min, max } = contractRange(1000);
    for (const r of [0, 0.3, 0.6, 0.999]) {
      const p = contractTargetPrice(1000, r);
      expect(p).toBeGreaterThanOrEqual(min);
      expect(p).toBeLessThanOrEqual(max);
    }
  });
});

describe('luck', () => {
  it('tilts weights toward expensive items for positive luck', async () => {
    const { tiltWeights, luckRoll } = await import('./economy');
    const entries = [
      { weight: 90, price: 100 },
      { weight: 10, price: 10000 },
    ];
    const share = (e: { weight: number }[]) => e[1]!.weight / (e[0]!.weight + e[1]!.weight);
    expect(share(tiltWeights(entries, 1000, 100))).toBeGreaterThan(share(entries));
    expect(share(tiltWeights(entries, 1000, -100))).toBeLessThan(share(entries));
    expect(tiltWeights(entries, 1000, 0)).toBe(entries);
    expect(luckRoll(0.25, 100)).toBeGreaterThan(0.25);
    expect(luckRoll(0.25, -100)).toBeLessThan(0.25);
  });
});
