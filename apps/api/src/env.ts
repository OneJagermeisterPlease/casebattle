import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Минимальный загрузчик .env, чтобы не тянуть лишнюю зависимость.
try {
  const file = fileURLToPath(new URL('../.env', import.meta.url));
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]!] === undefined) process.env[m[1]!] = m[2]!.replace(/^["']|["']$/g, '');
  }
} catch {
  // .env не обязателен
}

const num = (name: string, def: number) => Number(process.env[name] ?? def);

export const env = {
  port: num('API_PORT', 4000),
  webOrigin: process.env.WEB_ORIGIN ?? 'http://localhost:3000',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret',
  startingBalance: num('STARTING_BALANCE', 100000),
  dailyBonus: num('DAILY_BONUS', 25000),
  battleRoundMs: num('BATTLE_ROUND_MS', 5500),
  battleStartDelayMs: num('BATTLE_START_DELAY_MS', 3000),
};
