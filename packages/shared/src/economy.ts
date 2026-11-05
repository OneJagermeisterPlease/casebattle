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

export interface UpgradeRules {
  /** Комиссия «дома», 0..0.5 */
  edge: number;
  /** Максимальный шанс, 0..0.95 */
  max: number;
}

export const DEFAULT_UPGRADE_RULES: UpgradeRules = { edge: HOUSE_EDGE, max: UPGRADE_MAX_CHANCE };

export function upgradeChance(stake: number, targetPrice: number, rules: UpgradeRules = DEFAULT_UPGRADE_RULES): number {
  if (stake <= 0 || targetPrice <= 0) return 0;
  const raw = (stake / targetPrice) * (1 - rules.edge);
  return Math.min(rules.max, Math.max(UPGRADE_MIN_CHANCE, raw));
}

/** Цена цели, при которой шанс апгрейда равен `chance`. */
export function upgradeTargetForChance(stake: number, chance: number, rules: UpgradeRules = DEFAULT_UPGRADE_RULES): number {
  return Math.round((stake * (1 - rules.edge)) / chance);
}

/** Публичные настройки игры (GET /config). */
export interface GameConfig {
  startingBalance: number;
  dailyBonus: number;
  upgradeEdge: number;
  upgradeMaxChance: number;
}

/**
 * «Удача» от -100 до 100 наклоняет веса предметов: w' = w · (цена / цена кейса)^(удача / 50).
 * +100 — дорогие предметы выпадают заметно чаще, -100 — почти всегда дешёвые.
 */
export function tiltWeights<T extends { weight: number; price: number }>(entries: T[], casePrice: number, luck: number): T[] {
  if (!luck) return entries;
  const k = luck / 50;
  return entries.map((e) => ({ ...e, weight: e.weight * Math.pow(Math.max(1, e.price) / Math.max(1, casePrice), k) }));
}

/** Удача для броска 0..1 (контракты): +100 сдвигает бросок вверх, -100 — вниз. */
export function luckRoll(roll: number, luck: number): number {
  if (!luck) return roll;
  const m = Math.pow(2, luck / 50);
  return Math.pow(roll, 1 / m);
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

/** 3900 → «39», 134 → «1,34», 150000 → «1 500». Копейки показываем, только если они есть. */
export function formatCoins(cents: number): string {
  const whole = Math.round(cents) % 100 === 0;
  return (cents / 100).toLocaleString('ru-RU', { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2 });
}
