export { formatCoins } from '@casebattle/shared';

export const pct = (x: number) =>
  x >= 0.1 ? `${(x * 100).toFixed(1)}%` : x >= 0.001 ? `${(x * 100).toFixed(2)}%` : `${(x * 100).toFixed(3)}%`;

export function shortName(weapon: string) {
  return weapon.replace('★ ', '');
}
