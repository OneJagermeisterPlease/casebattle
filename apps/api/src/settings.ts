import { DEFAULT_UPGRADE_RULES, type GameConfig, type UpgradeRules } from '@casebattle/shared';
import { prisma } from './db';
import { env } from './env';

export const SETTING_DEFAULTS: GameConfig = {
  startingBalance: env.startingBalance,
  dailyBonus: env.dailyBonus,
  upgradeEdge: DEFAULT_UPGRADE_RULES.edge,
  upgradeMaxChance: DEFAULT_UPGRADE_RULES.max,
};

let cache: { at: number; value: GameConfig } | null = null;

/** Настройки из БД поверх значений по умолчанию; кэш на 5 секунд. */
export async function getSettings(): Promise<GameConfig> {
  if (cache && Date.now() - cache.at < 5000) return cache.value;
  const rows = await prisma.setting.findMany();
  const value = { ...SETTING_DEFAULTS };
  for (const r of rows) {
    if (r.key in value) (value as Record<string, number>)[r.key] = Number(JSON.parse(r.value));
  }
  cache = { at: Date.now(), value };
  return value;
}

export async function saveSettings(patch: Partial<GameConfig>) {
  for (const [key, v] of Object.entries(patch)) {
    if (v === undefined || !(key in SETTING_DEFAULTS)) continue;
    await prisma.setting.upsert({ where: { key }, create: { key, value: JSON.stringify(v) }, update: { value: JSON.stringify(v) } });
  }
  cache = null;
  return getSettings();
}

export const upgradeRules = (s: GameConfig): UpgradeRules => ({ edge: s.upgradeEdge, max: s.upgradeMaxChance });
