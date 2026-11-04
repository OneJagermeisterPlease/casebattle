import bcrypt from 'bcryptjs';
import { prisma } from '../src/db';
import { newClientSeed, newServerSeed } from '../src/fairness';
import { BOT_NAMES, PROMO_CODES, buildCases, buildItems, caseSpecs } from './catalog';
import { loadCs2 } from './cs2';

// CATALOG=generated — выдуманный каталог без сети; по умолчанию — реальные скины CS2.
async function loadCatalog() {
  if (process.env.CATALOG !== 'generated') {
    try {
      return await loadCs2();
    } catch (err) {
      console.warn('Не удалось загрузить скины CS2, использую выдуманный каталог:', (err as Error).message);
    }
  }
  return { items: buildItems(), crates: [] };
}

// Каталог заливаем только в пустую базу (или с SEED_FORCE=1), чтобы не затирать правки из админки.
const force = process.env.SEED_FORCE === '1';
const hasCatalog = (await prisma.item.count()) > 0;
const catalog = force || !hasCatalog ? await loadCatalog() : { items: [], crates: [] };
const items = catalog.items;
const cases = items.length ? buildCases(items, caseSpecs(items, catalog.crates)) : [];
if (!items.length) console.log('Каталог уже есть — пропускаю (SEED_FORCE=1 чтобы перезалить)');

for (let i = 0; i < items.length; i += 200) {
  await prisma.$transaction(
    items.slice(i, i + 200).map(({ id, ...data }) => prisma.item.upsert({ where: { id }, create: { id, ...data }, update: data })),
  );
}
// Кейсы, которых больше нет в каталоге, выключаем (история открытий сохраняется).
if (cases.length) await prisma.case.updateMany({ where: { id: { notIn: cases.map((c) => c.id) } }, data: { isActive: false } });
for (const { items: caseItems, ...c } of cases) {
  const { id, limitTotal, ...rest } = c;
  await prisma.case.upsert({ where: { id }, create: { id, limitTotal, ...rest }, update: { limitTotal, ...rest } });
  await prisma.caseItem.deleteMany({ where: { caseId: id } });
  await prisma.caseItem.createMany({ data: caseItems.map((ci) => ({ caseId: id, ...ci })) });
}

for (const nickname of BOT_NAMES) {
  if (await prisma.user.findUnique({ where: { nickname } })) continue;
  await prisma.user.create({
    data: { nickname, isBot: true, passwordHash: '!', clientSeed: newClientSeed(), ...(await newServerSeed()) },
  });
}

for (const p of PROMO_CODES) {
  await prisma.promoCode.upsert({ where: { code: p.code }, create: p, update: { amount: p.amount, maxUses: p.maxUses } });
}

const adminNick = process.env.ADMIN_NICKNAME;
const adminPass = process.env.ADMIN_PASSWORD;
if (adminNick && adminPass) {
  const existing = await prisma.user.findUnique({ where: { nickname: adminNick } });
  if (existing) await prisma.user.update({ where: { id: existing.id }, data: { isAdmin: true } });
  else {
    await prisma.user.create({
      data: {
        nickname: adminNick,
        isAdmin: true,
        balance: 10_000_000,
        passwordHash: await bcrypt.hash(adminPass, 10),
        clientSeed: newClientSeed(),
        ...(await newServerSeed()),
      },
    });
  }
}

const knives = items.filter((i) => i.kind === 'knife').length;
const byCat = cases.reduce<Record<string, number>>((m, c) => ((m[c.category] = (m[c.category] ?? 0) + 1), m), {});
console.log(`Seeded ${items.length} items (${knives} knives), ${cases.length} cases, ${BOT_NAMES.length} bots`);
console.log(byCat);
await prisma.$disconnect();
