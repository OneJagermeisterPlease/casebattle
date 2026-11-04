// Вход через Telegram двумя способами:
// 1) deep link на бота (/start <token>) — работает локально, без домена: бот читает getUpdates;
// 2) Telegram Login Widget — для деплоя на домен, привязанный к боту через @BotFather (/setdomain).
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { User } from '@prisma/client';
import { prisma } from './db';
import { createUser } from './routes/auth';

const token = () => process.env.TELEGRAM_BOT_TOKEN ?? '';
export const botUsername = () => process.env.TELEGRAM_BOT_USERNAME ?? '';
export const telegramEnabled = () => Boolean(token() && botUsername());

const LOGIN_TTL_MS = 5 * 60 * 1000;
const pending = new Map<string, { createdAt: number; userId: string | null }>();

export function createLoginRequest() {
  const id = randomBytes(12).toString('hex');
  pending.set(id, { createdAt: Date.now(), userId: null });
  for (const [k, v] of pending) if (Date.now() - v.createdAt > LOGIN_TTL_MS) pending.delete(k);
  return { token: id, url: `https://t.me/${botUsername()}?start=${id}` };
}

/** Возвращает id пользователя один раз, после чего запрос удаляется. */
export function pollLoginRequest(id: string): 'pending' | 'expired' | { userId: string } {
  const req = pending.get(id);
  if (!req || Date.now() - req.createdAt > LOGIN_TTL_MS) {
    pending.delete(id);
    return 'expired';
  }
  if (!req.userId) return 'pending';
  pending.delete(id);
  return { userId: req.userId };
}

interface TgUser {
  id: number | string;
  username?: string;
  first_name?: string;
}

export async function findOrCreateTelegramUser(tg: TgUser): Promise<User> {
  const telegramId = String(tg.id);
  const existing = await prisma.user.findUnique({ where: { telegramId } });
  if (existing) {
    if (tg.username && existing.telegramUsername !== tg.username) {
      return prisma.user.update({ where: { id: existing.id }, data: { telegramUsername: tg.username } });
    }
    return existing;
  }
  const base = (tg.username || tg.first_name || `tg${telegramId}`).replace(/[^\p{L}\p{N}_ .-]/gu, '').slice(0, 16) || `tg${telegramId}`;
  let nickname = base.length >= 3 ? base : `${base}_tg`;
  for (let i = 2; await prisma.user.findUnique({ where: { nickname } }); i++) nickname = `${base.slice(0, 14)}${i}`;
  return createUser(nickname, null, { telegramId, telegramUsername: tg.username ?? null });
}

export function verifyWidget(data: Record<string, string>): boolean {
  const { hash, ...fields } = data;
  if (!hash || !token()) return false;
  const check = Object.keys(fields)
    .sort()
    .map((k) => `${k}=${fields[k]}`)
    .join('\n');
  const secret = createHash('sha256').update(token()).digest();
  const expected = createHmac('sha256', secret).update(check).digest();
  const given = Buffer.from(hash, 'hex');
  const fresh = Date.now() / 1000 - Number(fields.auth_date) < 24 * 60 * 60;
  return fresh && given.length === expected.length && timingSafeEqual(given, expected);
}

async function api<T>(method: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`https://api.telegram.org/bot${token()}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as { ok: boolean; result: T; description?: string };
  if (!json.ok) throw new Error(`Telegram ${method}: ${json.description}`);
  return json.result;
}

interface Update {
  update_id: number;
  message?: { chat: { id: number }; from?: TgUser; text?: string };
}

let stopped = false;

export function stopTelegramBot() {
  stopped = true;
}

/** Long polling getUpdates: не нужен ни публичный адрес, ни вебхук. */
export async function startTelegramBot(log: (msg: string) => void) {
  if (!telegramEnabled()) {
    log('Telegram-вход выключен: задайте TELEGRAM_BOT_TOKEN и TELEGRAM_BOT_USERNAME в apps/api/.env');
    return;
  }
  await api('deleteWebhook', {}).catch(() => undefined);
  log(`Telegram-бот @${botUsername()} слушает входы`);
  let offset = 0;
  while (!stopped) {
    try {
      const updates = await api<Update[]>('getUpdates', { offset, timeout: 30, allowed_updates: ['message'] });
      for (const u of updates) {
        offset = u.update_id + 1;
        await handle(u).catch((err) => log(`telegram: ${(err as Error).message}`));
      }
    } catch (err) {
      log(`telegram: ${(err as Error).message}`);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

async function handle(u: Update) {
  const msg = u.message;
  if (!msg?.from || !msg.text) return;
  const [cmd, arg] = msg.text.trim().split(/\s+/, 2);
  if (cmd !== '/start') return;
  const req = arg ? pending.get(arg) : undefined;
  if (!req || Date.now() - req.createdAt > LOGIN_TTL_MS) {
    await api('sendMessage', {
      chat_id: msg.chat.id,
      text: 'Чтобы войти, нажмите «Войти через Telegram» на сайте — ссылка действует 5 минут.',
    });
    return;
  }
  const user = await findOrCreateTelegramUser(msg.from);
  req.userId = user.id;
  await api('sendMessage', {
    chat_id: msg.chat.id,
    text: `✅ Вы вошли как ${user.nickname}. Возвращайтесь на сайт — вкладка обновится сама.`,
  });
}
