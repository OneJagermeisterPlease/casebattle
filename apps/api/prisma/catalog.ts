// Детерминированный генератор демо-каталога: все предметы, названия расцветок и кейсы — выдуманные.
import type { Pattern, Rarity, WeaponKind } from '@casebattle/shared';
import { PATTERNS } from '@casebattle/shared';

export interface CatalogItem {
  id: string;
  weapon: string;
  finish: string;
  kind: WeaponKind;
  rarity: Rarity;
  price: number;
  hue: number;
  pattern: Pattern;
  imageUrl?: string | null;
}

export interface CatalogCase {
  id: string;
  slug: string;
  name: string;
  category: string;
  sortOrder: number;
  price: number;
  hue: number;
  icon: string;
  imageUrl: string | null;
  limitTotal: number | null;
  items: { itemId: string; weight: number }[];
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const WEAPONS: { name: string; kind: WeaponKind; mult: number }[] = [
  { name: 'Glock-18', kind: 'pistol', mult: 1 },
  { name: 'USP-S', kind: 'pistol', mult: 1.2 },
  { name: 'Desert Eagle', kind: 'pistol', mult: 1.4 },
  { name: 'P250', kind: 'pistol', mult: 0.8 },
  { name: 'Five-SeveN', kind: 'pistol', mult: 0.8 },
  { name: 'Tec-9', kind: 'pistol', mult: 0.7 },
  { name: 'CZ75-Auto', kind: 'pistol', mult: 0.7 },
  { name: 'R8 Revolver', kind: 'pistol', mult: 0.7 },
  { name: 'Dual Berettas', kind: 'pistol', mult: 0.6 },
  { name: 'P2000', kind: 'pistol', mult: 0.7 },
  { name: 'MP7', kind: 'smg', mult: 0.8 },
  { name: 'MAC-10', kind: 'smg', mult: 0.8 },
  { name: 'UMP-45', kind: 'smg', mult: 0.8 },
  { name: 'P90', kind: 'smg', mult: 1 },
  { name: 'MP9', kind: 'smg', mult: 0.8 },
  { name: 'PP-Bizon', kind: 'smg', mult: 0.6 },
  { name: 'AK-47', kind: 'rifle', mult: 1.8 },
  { name: 'M4A4', kind: 'rifle', mult: 1.5 },
  { name: 'M4A1-S', kind: 'rifle', mult: 1.5 },
  { name: 'FAMAS', kind: 'rifle', mult: 0.9 },
  { name: 'Galil AR', kind: 'rifle', mult: 0.9 },
  { name: 'SG 553', kind: 'rifle', mult: 0.8 },
  { name: 'AUG', kind: 'rifle', mult: 0.9 },
  { name: 'AWP', kind: 'sniper', mult: 2 },
  { name: 'SSG 08', kind: 'sniper', mult: 1 },
  { name: 'SCAR-20', kind: 'sniper', mult: 0.7 },
  { name: 'G3SG1', kind: 'sniper', mult: 0.7 },
  { name: 'Nova', kind: 'shotgun', mult: 0.6 },
  { name: 'XM1014', kind: 'shotgun', mult: 0.7 },
  { name: 'MAG-7', kind: 'shotgun', mult: 0.6 },
  { name: 'Sawed-Off', kind: 'shotgun', mult: 0.6 },
  { name: 'Negev', kind: 'mg', mult: 0.6 },
  { name: 'M249', kind: 'mg', mult: 0.6 },
];

const KNIVES = [
  'Штык-нож', 'Штык-нож M9', 'Керамбит', 'Нож-бабочка', 'Фальшион', 'Тычковые ножи', 'Охотничий нож',
  'Складной нож', 'Нож Боуи', 'Стилет', 'Наваха', 'Коготь', 'Кукри', 'Скелетный нож', 'Нож выживания',
  'Паракорд-нож', 'Бродяга', 'Нож с крюком',
];
const GLOVES = [
  'Спортивные перчатки', 'Водительские перчатки', 'Мотоперчатки', 'Перчатки специалиста',
  'Тактические перчатки', 'Обмотки рук', 'Кровавые перчатки',
];

const FINISHES = [
  'Неоновый шторм', 'Пепельный волк', 'Кобальтовая буря', 'Медный дракон', 'Ледяной контур', 'Ночной прилив',
  'Розовый туман', 'Красный сигнал', 'Тихая гавань', 'Песчаная дюна', 'Лесной дозор', 'Стальной улей',
  'Цифровой шум', 'Северное сияние', 'Лавовый поток', 'Ржавый якорь', 'Бумажный тигр', 'Карбоновая сетка',
  'Полночный экспресс', 'Электрик', 'Мятный лёд', 'Золотая пыль', 'Чёрный оникс', 'Фиолетовый закат',
  'Солнечный удар', 'Глубокий космос', 'Кислотный дождь', 'Пиксельный камуфляж', 'Городской патруль',
  'Морская волна', 'Багровый рассвет', 'Тёмный лабиринт', 'Призрачный огонь', 'Хромовый блик',
  'Королевская кобра', 'Янтарный жук', 'Нефритовый змей', 'Сапфировая грань', 'Рубиновый пульс',
  'Изумрудный лес', 'Арктический лис', 'Пустынный скорпион', 'Гроза над городом', 'Тайфун', 'Бетонный блок',
  'Уличное граффити', 'Оригами', 'Мозаика', 'Сакура', 'Кибер-волк', 'Ретровейв', 'Голограмма', 'Квант',
  'Магма', 'Иней', 'Пульсар', 'Комета', 'Орбита', 'Туманность', 'Метеор', 'Полярная ночь',
  'Охотник за головами', 'Красный волк', 'Синий кит', 'Белый медведь', 'Шахматная доска', 'Зебра',
  'Тигровая полоса', 'Леопард', 'Феникс', 'Грифон', 'Химера', 'Левиафан', 'Кракен', 'Оракул', 'Сфинкс',
  'Минотавр', 'Василиск', 'Цербер', 'Пегас',
];

// Цены в сотых долях монеты: [мин, макс]
const RARITY_PRICE: Record<Rarity, [number, number]> = {
  consumer: [10, 80],
  industrial: [60, 350],
  milspec: [250, 1500],
  restricted: [1200, 6000],
  classified: [5000, 25000],
  covert: [20000, 120000],
  gold: [150000, 2500000],
};

const GUN_RARITIES: [Rarity, number][] = [
  ['consumer', 18],
  ['industrial', 22],
  ['milspec', 24],
  ['restricted', 17],
  ['classified', 12],
  ['covert', 7],
];

function weighted<T>(rnd: () => number, entries: [T, number][]): T {
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let t = rnd() * total;
  for (const [v, w] of entries) {
    t -= w;
    if (t < 0) return v;
  }
  return entries[entries.length - 1]![0];
}

function priceFor(rnd: () => number, rarity: Rarity, mult: number): number {
  const [lo, hi] = RARITY_PRICE[rarity];
  return Math.max(5, Math.round(lo * (hi / lo) ** rnd() * mult));
}

export function buildItems(): CatalogItem[] {
  const rnd = mulberry32(20261105);
  const items: CatalogItem[] = [];
  const add = (weapon: string, kind: WeaponKind, rarity: Rarity, mult: number) => {
    const used = new Set(items.filter((i) => i.weapon === weapon).map((i) => i.finish));
    let finish: string;
    do finish = FINISHES[Math.floor(rnd() * FINISHES.length)]!;
    while (used.has(finish));
    items.push({
      id: `it${String(items.length + 1).padStart(3, '0')}`,
      weapon,
      finish,
      kind,
      rarity,
      price: priceFor(rnd, rarity, mult),
      hue: Math.floor(rnd() * 360),
      pattern: PATTERNS[Math.floor(rnd() * PATTERNS.length)]!,
    });
  };
  for (const w of WEAPONS) {
    // У популярного оружия больше расцветок и гарантированно есть «Тайное».
    const n = w.mult >= 1.4 ? 14 : w.mult >= 0.9 ? 10 : 8;
    for (let i = 0; i < n; i++) {
      const rarity = i === 0 && w.mult >= 1.4 ? 'covert' : weighted(rnd, GUN_RARITIES);
      add(w.name, w.kind, rarity, w.mult);
    }
  }
  for (const k of KNIVES) for (let i = 0; i < 12; i++) add(`★ ${k}`, 'knife', 'gold', 0.3 + rnd() * 1.2);
  for (const g of GLOVES) for (let i = 0; i < 9; i++) add(`★ ${g}`, 'gloves', 'gold', 0.3 + rnd() * 1.1);
  return items;
}

export interface CaseSpec {
  name: string;
  slug: string;
  category: string;
  /** Цена в монетах; если не задана — подбирается по содержимому. */
  price?: number;
  hue: number;
  icon: string;
  imageUrl?: string | null;
  size?: number;
  limitTotal?: number;
  pool: (i: CatalogItem) => boolean;
  rtp?: number;
}

const hueOf = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/★/g, '')
    .replace(/[^a-z0-9а-яё]+/gi, '-')
    .replace(/^-|-$/g, '');

/** «Красивая» цена кейса: две значащие цифры с девяткой на конце (139, 1 490, 29). */
function nicePrice(cents: number): number {
  const coins = cents / 100;
  if (coins < 10) return Math.max(1, Math.round(coins)) * 100;
  const mag = 10 ** Math.floor(Math.log10(coins) - 1);
  return (Math.round(coins / mag) * mag - (mag >= 10 ? mag / 10 : 1)) * 100;
}

const RTP = 0.9;
const NO_RARE = (i: CatalogItem) => i.kind !== 'knife' && i.kind !== 'gloves';

export function caseSpecs(items: CatalogItem[], crates: { id: string; name: string; image: string | null; itemIds: string[] }[] = []): CaseSpec[] {
  const specs: CaseSpec[] = [
    { name: 'Новичок', slug: 'rookie', category: 'Стартовые', price: 5, hue: 200, icon: 'leaf', pool: NO_RARE },
    { name: 'Патруль', slug: 'patrol', category: 'Стартовые', price: 15, hue: 160, icon: 'shield', pool: NO_RARE },
    { name: 'Арсенал', slug: 'arsenal', category: 'Стартовые', price: 39, hue: 30, icon: 'target', pool: () => true },
    { name: 'Штурм', slug: 'assault', category: 'Стартовые', price: 99, hue: 0, icon: 'bolt', pool: () => true },
    { name: 'Ветеран', slug: 'veteran', category: 'Стартовые', price: 249, hue: 270, icon: 'star', pool: () => true },
    { name: 'Всё или ничего', slug: 'all-or-nothing', category: 'Стартовые', price: 499, hue: 0, icon: 'skull', pool: (i) => i.kind === 'knife' || i.rarity === 'consumer' || i.rarity === 'industrial', rtp: 0.85 },
  ];

  const colors: [string, string, number, number, Rarity[]][] = [
    ['Серые скины', 'grey', 1, 210, ['consumer', 'industrial']],
    ['Голубые скины', 'light-blue', 3, 205, ['consumer', 'industrial', 'milspec']],
    ['Синие скины', 'blue', 9, 230, ['industrial', 'milspec', 'restricted']],
    ['Фиолетовые скины', 'purple', 35, 265, ['milspec', 'restricted', 'classified']],
    ['Розовые скины', 'pink', 120, 300, ['restricted', 'classified', 'covert']],
    ['Красные скины', 'red', 450, 355, ['classified', 'covert', 'gold']],
    ['Золотые скины', 'gold', 4999, 45, ['covert', 'gold']],
  ];
  for (const [name, slug, price, hue, rar] of colors) {
    specs.push({ name, slug, category: 'Цвета', price, hue, icon: 'gem', pool: (i) => rar.includes(i.rarity) });
  }

  const gems: [string, number, number][] = [
    ['Янтарный', 20, 35], ['Ониксовый', 50, 260], ['Гранатовый', 100, 345], ['Аметистовый', 250, 285],
    ['Изумрудный', 500, 145], ['Турмалиновый', 750, 320], ['Сапфировый', 1000, 215], ['Рубиновый', 2500, 350],
    ['Опаловый', 5000, 175], ['Бриллиантовый', 10000, 190], ['Чёрный бриллиант', 20000, 250],
  ];
  for (const [name, price, hue] of gems) {
    specs.push({ name, slug: `gem-${slugify(name)}`, category: 'Премиум', price, hue, icon: price >= 5000 ? 'crown' : 'gem', pool: () => true, rtp: 0.92 });
  }

  // По каждому оружию: «X для всех» — все его расцветки плюс немного ножей для мечты.
  const weapons = [...new Set(items.filter(NO_RARE).map((i) => i.weapon))].sort();
  for (const w of weapons) {
    const own = items.filter((i) => i.weapon === w);
    if (own.length < 6) continue;
    specs.push({
      name: `${w} для всех`,
      slug: `weapon-${slugify(w)}`,
      category: 'Оружейные',
      hue: hueOf(w),
      icon: 'target',
      pool: (i) => i.weapon === w || (i.kind === 'knife' && hueOf(i.id) < 8),
    });
  }

  // По каждому ножу и перчаткам: сам нож + «Тайные» скины как утешение.
  for (const kind of ['knife', 'gloves'] as const) {
    const types = [...new Set(items.filter((i) => i.kind === kind).map((i) => i.weapon))].sort();
    for (const t of types) {
      const own = items.filter((i) => i.weapon === t).map((i) => i.price).sort((a, b) => a - b);
      specs.push({
        price: nicePrice(own[Math.floor(own.length / 2)]! * 0.3) / 100,
        name: t.replace('★ ', ''),
        slug: `${kind}-${slugify(t)}`,
        category: kind === 'knife' ? 'Ножевые' : 'Перчаточные',
        hue: hueOf(t),
        icon: kind === 'knife' ? 'knife' : 'glove',
        pool: (i) => i.weapon === t || i.rarity === 'covert' || i.rarity === 'classified',
        rtp: 0.88,
      });
    }
  }

  const themes: [string, RegExp, number][] = [
    ['Градиенты', /Fade|Gradient/i, 50], ['Допплер', /Doppler|Gamma/i, 280], ['Драконы', /Dragon|Wyvern|Hydra/i, 10],
    ['Неон', /Neon|Neo-Noir|Cyber/i, 300], ['Хищники', /Tiger|Wolf|Panther|Lion|Leopard|Hyper Beast|Beast/i, 30],
    ['Океан', /Ocean|Water|Wave|Sea|Aqua|Coral|Shark/i, 195], ['Пламя', /Fire|Flame|Blaze|Inferno|Heat|Burn/i, 15],
    ['Камуфляж', /Camo|DDPAT|Forest|Desert|Sand|Jungle|Urban/i, 90], ['Космос', /Space|Galaxy|Nebula|Asiimov|Orbit|Moon|Star/i, 240],
    ['Ядовитые', /Toxic|Poison|Acid|Venom|Virus|Bio/i, 110], ['Призраки', /Ghost|Phantom|Spirit|Haunt|Skull|Death/i, 0],
    ['Мрамор', /Marble|Damascus|Case Hardened|Crimson Web/i, 340],
  ];
  for (const [name, re, hue] of themes) {
    specs.push({ name, slug: `theme-${slugify(name)}`, category: 'Тематические', hue, icon: 'star', pool: (i) => re.test(i.finish) });
  }

  // Праздники и жанры кино/игр: оформление обложки задаётся иконкой-темой.
  const occasions: [string, string, string, number, number, RegExp][] = [
    ['Хэллоуин', 'Праздничные', 'pumpkin', 30, 199, /Blood|Death|Skull|Ghost|Haunt|Night|Bone|Witch|Orange|Pumpkin|Spider/i],
    ['Новый год', 'Праздничные', 'snowflake', 200, 299, /Ice|Frost|Snow|Winter|Cold|Arctic|Gold|Star|Light/i],
    ['14 февраля', 'Праздничные', 'heart', 340, 99, /Pink|Rose|Heart|Love|Red|Crimson|Cherry|Bloom|Flower/i],
    ['8 марта', 'Праздничные', 'flower', 320, 149, /Flower|Bloom|Petal|Rose|Lily|Garden|Pink|Sakura|Spring/i],
    ['23 февраля', 'Праздничные', 'medal', 120, 230, /Army|Camo|DDPAT|Military|Tank|Soldier|Forest|Olive|Tactical|Guard/i],
    ['День рождения', 'Праздничные', 'gift', 280, 500, /Candy|Party|Gift|Gold|Neon|Rainbow|Fade|Hyper/i],
    ['Хоррор', 'Кино и игры', 'skull', 0, 349, /Blood|Death|Skull|Ghost|Haunt|Demon|Bone|Grave|Curse|Evil/i],
    ['Зомби-апокалипсис', 'Кино и игры', 'biohazard', 95, 129, /Zombie|Toxic|Poison|Acid|Virus|Bio|Rot|Plague|Decay/i],
    ['Космическая одиссея', 'Кино и игры', 'rocket', 240, 499, /Space|Galaxy|Nebula|Asiimov|Orbit|Moon|Star|Planet|Cosmo|Astro/i],
    ['Киберпанк', 'Кино и игры', 'chip', 300, 699, /Cyber|Neon|Digital|Circuit|Code|Tech|Hyper|Synth|Electric|Glitch/i],
    ['Дикий Запад', 'Кино и игры', 'cowboy', 30, 89, /Desert|Sand|Copper|Rust|Wood|Western|Bandit|Outlaw|Sunset|Gold/i],
    ['Пираты', 'Кино и игры', 'anchor', 200, 159, /Ocean|Sea|Water|Wave|Coral|Shark|Anchor|Pirate|Kraken|Treasure/i],
    ['Самурай', 'Кино и игры', 'katana', 355, 999, /Dragon|Samurai|Katana|Sakura|Oni|Bamboo|Koi|Shogun|Ninja|Ronin/i],
    ['Фэнтези', 'Кино и игры', 'dragon', 150, 399, /Dragon|Wyvern|Hydra|Griffin|Phoenix|Magic|Spell|Rune|Myth|Legend/i],
    ['Нуар', 'Кино и игры', 'fedora', 220, 249, /Noir|Black|Shadow|Dark|Night|Smoke|Ash|Grey|Graphite|Midnight/i],
    ['Постапокалипсис', 'Кино и игры', 'gasmask', 40, 119, /Rust|Wasteland|Scorch|Burn|Ash|Nuclear|Radiation|Hazard|Scrap|Decay/i],
    ['Гонки', 'Кино и игры', 'flag', 15, 179, /Speed|Racing|Race|Turbo|Nitro|Fuel|Engine|Stripe|Velocity|Rally/i],
  ];
  for (const [name, category, icon, hue, price, re] of occasions) {
    specs.push({ name, slug: `theme-${slugify(name)}`, category, price, hue, icon, pool: (i) => re.test(i.finish) || re.test(i.weapon) || i.rarity === 'consumer' || i.kind === 'knife' });
  }

  const limited: [string, number, number, number, RegExp | null][] = [
    ['Полночь', 75, 245, 1000, /Night|Dark|Black|Shadow|Midnight/i], ['Кибер', 149, 180, 700, null],
    ['Ретро', 99, 30, 800, null], ['Самурай', 249, 355, 600, /Dragon|Samurai|Katana|Sakura|Oni/i],
    ['Арктика', 59, 195, 900, /Ice|Frost|Snow|Arctic|Winter|Cold/i], ['Джекпот', 999, 50, 300, null],
  ];
  for (const [name, price, hue, limit, re] of limited) {
    specs.push({ name, slug: `limited-${slugify(name)}`, category: 'Лимитированные', price, hue, icon: 'moon', limitTotal: limit, pool: re ? (i) => re.test(i.finish) || i.kind === 'knife' : () => true });
  }

  // Официальные кейсы CS2 с реальным содержимым (если каталог импортирован из CS2).
  const byId = new Map(items.map((i) => [i.id, i]));
  for (const c of crates.filter((c) => c.itemIds.length >= 8 && !c.name.includes('Souvenir')).sort((a, b) => a.name.localeCompare(b.name))) {
    const ids = new Set(c.itemIds);
    specs.push({
      name: c.name,
      slug: `cs2-${slugify(c.name)}`,
      category: 'Кейсы CS2',
      hue: hueOf(c.name),
      icon: 'box',
      imageUrl: c.image,
      size: 60,
      pool: (i) => ids.has(i.id) && byId.has(i.id),
    });
  }
  return specs;
}

/** Подбирает веса так, чтобы матожидание кейса было ≈ rtp × цена. */
function fitWeights(prices: number[], casePrice: number, rtp: number): number[] {
  const target = casePrice * rtp;
  const ev = (a: number) => {
    const w = prices.map((p) => (casePrice / p) ** a);
    const sum = w.reduce((s, x) => s + x, 0);
    return w.reduce((s, x, i) => s + x * prices[i]!, 0) / sum;
  };
  let lo = -12;
  let hi = 12;
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    if (ev(mid) > target) lo = mid;
    else hi = mid;
  }
  const w = prices.map((p) => (casePrice / p) ** lo);
  const max = Math.max(...w);
  return w.map((x) => Math.max(1, Math.round((x / max) * 1_000_000)));
}

export function buildCases(items: CatalogItem[], specs: CaseSpec[]): CatalogCase[] {
  const out: CatalogCase[] = [];
  const slugs = new Set<string>();
  for (const [idx, spec] of specs.entries()) {
    if (slugs.has(spec.slug)) continue;
    let pool = items.filter(spec.pool).sort((a, b) => a.price - b.price);
    if (pool.length < 4) continue;
    let price = spec.price ? spec.price * 100 : 0;
    if (!price) {
      // Цена между дешёвой и средней частью содержимого — так кейс выглядит «выгодно» и даёт шанс на дорогое.
      const q = (f: number) => pool[Math.floor((pool.length - 1) * f)]!.price;
      price = nicePrice(Math.sqrt(q(0.15) * q(0.6)));
    }
    pool = pool.filter((i) => i.price >= price * 0.02 && i.price <= price * 60);
    const size = Math.min(spec.size ?? 32, pool.length);
    const picked = [
      ...new Map(
        Array.from({ length: size }, (_, k) => pool[Math.round((k * (pool.length - 1)) / Math.max(1, size - 1))]!).map((i) => [i.id, i]),
      ).values(),
    ];
    const target = price * (spec.rtp ?? RTP);
    if (picked.length < 4 || picked[0]!.price >= target || picked[picked.length - 1]!.price <= target) continue;
    const weights = fitWeights(picked.map((i) => i.price), price, spec.rtp ?? RTP);
    slugs.add(spec.slug);
    out.push({
      id: `case-${spec.slug}`,
      slug: spec.slug,
      name: spec.name,
      category: spec.category,
      sortOrder: idx,
      price,
      hue: spec.hue,
      icon: spec.icon,
      imageUrl: spec.imageUrl ?? null,
      limitTotal: spec.limitTotal ?? null,
      items: picked.map((i, k) => ({ itemId: i.id, weight: weights[k]! })),
    });
  }
  return out;
}

export const BOT_NAMES = ['Бот Алекс', 'Бот Вика', 'Бот Макс', 'Бот Лиса', 'Бот Тень', 'Бот Шторм', 'Бот Кира', 'Бот Гром'];

export const PROMO_CODES = [
  { code: 'DEMO', amount: 50000, maxUses: null },
  { code: 'WELCOME', amount: 25000, maxUses: null },
  { code: 'BATTLE', amount: 100000, maxUses: 100 },
];
