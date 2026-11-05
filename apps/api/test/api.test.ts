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

async function runToEnd(id: string) {
  let battle = (await call('GET', `/battles/${id}`)).body;
  for (let i = 0; i < 200 && battle.status !== 'finished'; i++) {
    await new Promise((r) => setTimeout(r, 20));
    battle = (await call('GET', `/battles/${id}`)).body;
  }
  return battle;
}

describe('battle modes', () => {
  for (const [mode, slots, crazy] of [
    ['1v1v1', 3, false],
    ['1v1v1v1', 4, true],
    ['2v2', 4, true],
  ] as const) {
    it(`${mode}${crazy ? ' crazy' : ''} picks the right winner`, async () => {
      const token = await register(`m${mode}${crazy ? 'c' : ''}`.replace(/v/g, 'x'));
      const { body: cases } = await call('GET', '/cases');
      const slug = cases.filter((c: { limitTotal: number | null }) => c.limitTotal === null).sort((a: { price: number }, b: { price: number }) => a.price - b.price)[0].slug;
      const created = await call('POST', '/battles', token, { mode, caseSlugs: [slug, slug, slug], crazy });
      await call('POST', `/battles/${created.body.id}/bots`, token);
      const b = await runToEnd(created.body.id);
      expect(b.status).toBe('finished');
      expect(b.players).toHaveLength(slots);
      expect(b.drops).toHaveLength(slots * 3);
      const teams = new Map<number, number>();
      for (const p of b.players) teams.set(p.team, (teams.get(p.team) ?? 0) + p.total);
      const best = crazy ? Math.min(...teams.values()) : Math.max(...teams.values());
      expect(teams.get(b.winnerTeam)).toBe(best);
    });
  }

  it('refunds everyone when the creator cancels', async () => {
    const token = await register('canceller');
    const { body: cases } = await call('GET', '/cases');
    const c = cases.filter((x: { limitTotal: number | null }) => x.limitTotal === null).sort((a: { price: number }, b: { price: number }) => a.price - b.price)[0];
    const created = await call('POST', '/battles', token, { mode: '1v1', caseSlugs: [c.slug], crazy: false });
    const cancel = await call('POST', `/battles/${created.body.id}/cancel`, token);
    expect(cancel.body.status).toBe('cancelled');
    expect((await call('GET', '/me', token)).body.balance).toBe(100000);
  });
});

describe('selling and promos', () => {
  it('sells the whole inventory at item prices', async () => {
    const token = await register('seller');
    const { body: cases } = await call('GET', '/cases');
    const open = await call('POST', `/cases/${cases[0].slug}/open`, token, { count: 5 });
    const sum = open.body.items.reduce((s: number, i: { price: number }) => s + i.price, 0);
    const res = await call('POST', '/inventory/sell-all', token);
    expect(res.body.sold).toBe(5);
    expect(res.body.amount).toBe(sum);
    expect(res.body.balance).toBe(open.body.balance + sum);
    expect((await call('GET', '/me/inventory', token)).body).toHaveLength(0);
  });

  it('applies a promo code once', async () => {
    const token = await register('promo');
    const first = await call('POST', '/me/promo', token, { code: 'demo' });
    expect(first.body.balance).toBe(110000);
    expect((await call('POST', '/me/promo', token, { code: 'DEMO' })).status).toBe(400);
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

describe('admin management', () => {
  it('manages users, balances, cases, items and promos', async () => {
    const admin = (await call('POST', '/auth/login', undefined, { nickname: 'testadmin', password: 'testadmin-pass' })).body.token;
    const victimToken = await register('victim');
    const victim = (await call('GET', '/me', victimToken)).body;

    expect((await call('GET', '/admin/stats', admin)).body.users).toBeGreaterThan(0);
    const details = await call('GET', `/admin/users/${victim.id}`, admin);
    expect(details.body.transactions[0].reason).toBe('signup_bonus');

    expect((await call('POST', `/admin/users/${victim.id}/balance`, admin, { amount: 5000 })).body.balance).toBe(105000);
    expect((await call('POST', `/admin/users/${victim.id}/balance`, admin, { amount: -500000 })).body.balance).toBe(0);

    await call('PATCH', `/admin/users/${victim.id}`, admin, { isBanned: true });
    expect((await call('GET', '/me', victimToken)).status).toBe(403);

    const cases = (await call('GET', '/admin/cases', admin)).body;
    const c = cases[0];
    const update = {
      slug: c.slug,
      name: 'Переименован',
      category: c.category,
      sortOrder: c.sortOrder,
      price: c.price * 2,
      hue: c.hue,
      icon: c.icon,
      imageUrl: c.imageUrl,
      limitTotal: c.limitTotal,
      isActive: true,
      items: c.items.map((i: { item: { id: string }; weight: number }) => ({ itemId: i.item.id, weight: i.weight })),
    };
    expect((await call('PUT', `/admin/cases/${c.id}`, admin, update)).status).toBe(200);
    expect((await call('GET', `/cases/${c.slug}`)).body.name).toBe('Переименован');

    const item = (await call('GET', '/items?limit=1')).body.items[0];
    const edited = await call('PUT', `/admin/items/${item.id}`, admin, { ...item, price: 12345 });
    expect(edited.body.price).toBe(12345);

    expect((await call('POST', '/admin/promos', admin, { code: 'FRIENDS', amount: 1000, maxUses: 2 })).status).toBe(200);
    const promos = (await call('GET', '/admin/promos', admin)).body;
    expect(promos.some((p: { code: string }) => p.code === 'FRIENDS')).toBe(true);
  });
});

describe('admin luck and settings', () => {
  it('applies a per-user upgrade multiplier and global settings', async () => {
    const admin = (await call('POST', '/auth/login', undefined, { nickname: 'testadmin', password: 'testadmin-pass' })).body.token;
    const lucky = await register('lucky');
    const me = (await call('GET', '/me', lucky)).body;
    const item = (await call('GET', '/items?minPrice=50000&limit=1')).body.items[0];

    const base = await call('POST', '/upgrade', lucky, { balance: 1000, targetItemId: item.id });
    expect((await call('PUT', `/admin/users/${me.id}/luck`, admin, { kind: 'upgrade', value: 10 })).status).toBe(200);
    const boosted = await call('POST', '/upgrade', lucky, { balance: 1000, targetItemId: item.id });
    expect(boosted.body.chance).toBeCloseTo(Math.min(0.95, base.body.chance * 10), 5);

    const luck = (await call('GET', `/admin/users/${me.id}/luck`, admin)).body;
    expect(luck).toHaveLength(1);
    await call('PUT', `/admin/users/${me.id}/luck`, admin, { kind: 'upgrade', value: null });
    expect((await call('GET', `/admin/users/${me.id}/luck`, admin)).body).toHaveLength(0);

    await call('PUT', '/admin/settings', admin, { startingBalance: 40000 });
    expect((await call('GET', '/config')).body.startingBalance).toBe(40000);
    const fresh = await register('fresh400');
    expect((await call('GET', '/me', fresh)).body.balance).toBe(40000);
  });
});
