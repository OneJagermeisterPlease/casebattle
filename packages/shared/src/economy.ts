/** Доля «дома» в апгрейде и контрактах — чтобы матожидание было чуть меньше ставки, как в реальных играх. */
export const HOUSE_EDGE = 0.05;
export const UPGRADE_MIN_CHANCE = 0.01;
export const UPGRADE_MAX_CHANCE = 0.75;
export const UPGRADE_MAX_ITEMS = 6;
export const CONTRACT_MIN_ITEMS = 3;
export const CONTRACT_MAX_ITEMS = 10;
export const CONTRACT_MIN_MULT = 0.25;
export const CONTRACT_MAX_MULT = 3;
export const CASE_MAX_OPEN = 5;

export function upgradeChance(stake: number, targetPrice: number): number {
  if (stake <= 0 || targetPrice <= 0) return 0;
  const raw = (stake / targetPrice) * (1 - HOUSE_EDGE);
  return Math.min(UPGRADE_MAX_CHANCE, Math.max(UPGRADE_MIN_CHANCE, raw));
}

/** Цена цели, при которой шанс апгрейда равен `chance`. */
export function upgradeTargetForChance(stake: number, chance: number): number {
  return Math.round((stake * (1 - HOUSE_EDGE)) / chance);
}

export function contractRange(sum: number): { min: number; max: number } {
  return { min: Math.round(sum * CONTRACT_MIN_MULT), max: Math.round(sum * CONTRACT_MAX_MULT) };
}

/**
 * Цена предмета из контракта: множитель 0.25 + 2.75·r³ (r ∈ [0,1)).
 * E[r³] = 1/4 → среднее ≈ 0.94 от суммы контракта, чаще дешевле, иногда до x3.
 */
export function contractTargetPrice(sum: number, roll: number): number {
  return Math.round(sum * (CONTRACT_MIN_MULT + (CONTRACT_MAX_MULT - CONTRACT_MIN_MULT) * roll ** 3));
}

export function formatCoins(cents: number): string {
  return (cents / 100).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
