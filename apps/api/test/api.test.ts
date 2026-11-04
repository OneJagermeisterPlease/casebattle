import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app';
import { prisma } from '../src/db';

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp();
});
afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

async function call(method: 'GET' | 'POST' | 'PUT' | 'PATCH', url: string, token?: string, payload?: unknown) {
  const res = await app.inject({
    method,
    url,
    payload: payload as object,
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
  return { status: res.statusCode, body: res.json() };
}

async function register(nickname: string) {
  const res = await call('POST', '/auth/register', undefined, { nickname, password: 'secret123' });
  expect(res.status).toBe(200);
  return res.body.token as string;
}

describe('cases and inventory', () => {
  it('opens a case, debits the price and sells the drop', async () => {
    const token = await register('opener');
    const { body: cases } = await call('GET', '/cases');
    const cheap = cases.find((c: { price: number }) => c.price <= 2000);
    const open = await call('POST', `/cases/${cheap.slug}/open`, token, { count: 3 });
    expect(open.status).toBe(200);
    expect(open.body.items).toHaveLength(3);
    expect(open.body.balance).toBe(100000 - cheap.price * 3);

    const sell = await call('POST', '/inventory/sell', token, { ids: [open.body.items[0].id] });
    expect(sell.status).toBe(200);
    expect(sell.body.balance).toBe(open.body.balance + open.body.items[0].price);
    // Повторная продажа того же предмета невозможна.
    expect((await call('POST', '/inventory/sell', token, { ids: [open.body.items[0].id] })).status).toBe(400);
  });

  it('rejects opening without enough coins', async () => {
    const token = await register('poor');
    const { body: cases } = await call('GET', '/cases');
    const pricey = cases.reduce((a: { price: number }, b: { price: number }) => (a.price > b.price ? a : b));
    expect((await call('POST', `/cases/${pricey.slug}/open`, token, { count: 5 })).status).toBe(400);
  });
});

describe('upgrade and contract', () => {
  it('upgrades with balance only and reports a provably fair roll', async () => {
    const token = await register('upgrader');
    const { body } = await call('GET', '/items?minPrice=20000&limit=1', token);
    const res = await call('POST', '/upgrade', token, { balance: 10000, targetItemId: body.items[0].id });
    expect(res.status).toBe(200);
    expect(res.body.win).toBe(res.body.roll < res.body.chance);
    expect(res.body.balance).toBe(90000);
  });

  it('signs a contract from 3 items', async () => {
    const token = await register('contractor');
    const { body: cases } = await call('GET', '/cases');
    const open = await call('POST', `/cases/${cases[0].slug}/open`, token, { count: 3 });
    const res = await call('POST', '/contract', token, { inventoryIds: open.body.items.map((i: { id: string }) => i.id) });
    expect(res.status).toBe(200);
    expect(res.body.item.price).toBeGreaterThanOrEqual(res.body.min);
    expect(res.body.item.price).toBeLessThanOrEqual(res.body.max);
  });
});

describe('battles', () => {
  it('runs a battle against bots to the end', async () => {
    const token = await register('fighter');
    const { body: cases } = await call('GET', '/cases');
    const slugs = cases.filter((c: { limitTotal: number | null }) => c.limitTotal === null).slice(0, 2).map((c: { slug: string }) => c.slug);
    const created = await call('POST', '/battles', token, { mode: '2v2', caseSlugs: slugs, crazy: false });
    expect(created.status).toBe(200);
    expect((await call('POST', `/battles/${created.body.id}/bots`, token)).status).toBe(200);

    let battle = created.body;
    for (let i = 0; i < 100 && battle.status !== 'finished'; i++) {
      await new Promise((r) => setTimeout(r, 20));
      battle = (await call('GET', `/battles/${battle.id}`)).body;
    }
    expect(battle.status).toBe('finished');
    expect(battle.drops).toHaveLength(slugs.length * 4);
    expect(battle.serverSeed).toBeTruthy();
  });
});

describe('multiplayer', () => {
  it('starts a 1v1 when a second player joins and pays the winner', async () => {
    const alice = await register('alice');
    const bob = await register('bob');
    const { body: cases } = await call('GET', '/cases');
    const slug = cases.find((c: { limitTotal: number | null; price: number }) => c.limitTotal === null && c.price <= 2000).slug;
    const created = await call('POST', '/battles', alice, { mode: '1v1', caseSlugs: [slug, slug], crazy: false });
    // Нельзя занять место дважды и нельзя войти в свой же батл.
    expect((await call('POST', `/battles/${created.body.id}/join`, alice, {})).status).toBe(400);
    const joined = await call('POST', `/battles/${created.body.id}/join`, bob, {});
    expect(joined.status).toBe(200);

    let battle = joined.body;
    for (let i = 0; i < 100 && battle.status !== 'finished'; i++) {
      await new Promise((r) => setTimeout(r, 20));
      battle = (await call('GET', `/battles/${battle.id}`)).body;
    }
    expect(battle.status).toBe('finished');
    const winner = battle.players.find((p: { team: number }) => p.team === battle.winnerTeam);
    const winnerToken = winner.user.nickname === 'alice' ? alice : bob;
    const inv = await call('GET', '/me/inventory', winnerToken);
    expect(inv.body.filter((i: { source: string }) => i.source === 'battle')).toHaveLength(4);
  });
});

describe('admin', () => {
  it('is closed for regular users and open for admins', async () => {
    const token = await register('regular');
    expect((await call('GET', '/admin/users', token)).status).toBe(403);
    const login = await call('POST', '/auth/login', undefined, { nickname: 'testadmin', password: 'testadmin-pass' });
    const users = await call('GET', '/admin/users', login.body.token);
    expect(users.status).toBe(200);
    expect(users.body.users.some((u: { nickname: string }) => u.nickname === 'regular')).toBe(true);
  });

  it('daily bonus can be claimed once', async () => {
    const token = await register('daily');
    expect((await call('POST', '/me/daily', token)).status).toBe(200);
    expect((await call('POST', '/me/daily', token)).status).toBe(400);
  });
});
