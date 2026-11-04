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
