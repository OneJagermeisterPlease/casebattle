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
  consumer: [100, 600],
  industrial: [300, 1800],
  milspec: [600, 8000],
  restricted: [3000, 40000],
  classified: [15000, 200000],
  covert: [60000, 1500000],
  gold: [700000, 25000000],
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
const TRANSLIT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n',
  о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '',
  э: 'e', ю: 'yu', я: 'ya',
};
/** URL-slug латиницей: «Новый год» → novyy-god. */
const slugify = (s: string) =>
  [...s.toLowerCase().replace(/★/g, '')]
    .map((ch) => TRANSLIT[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** «Красивая» цена кейса: две значащие цифры с девяткой на конце (139, 1 490, 29). */
function nicePrice(cents: number): number {
  const coins = cents / 100;
  if (coins < 10) return Math.max(1, Math.round(coins)) * 100;
  const mag = 10 ** Math.floor(Math.log10(coins) - 1);
  return (Math.round(coins / mag) * mag - (mag >= 10 ? mag / 10 : 1)) * 100;
}

const RTP = 0.9;

/** Лестница цен кейсов (в монетах), как на популярных case-сайтах. */
const LADDER = [
  19, 29, 39, 45, 49, 55, 59, 69, 75, 79, 85, 89, 99, 105, 119, 129, 139, 149, 169, 185, 199, 249, 269, 299, 349, 399, 459, 499,
  599, 699, 799, 899, 999, 1299, 1499, 1999, 2999, 3499, 4999, 6999, 8999, 9999, 16999, 29999, 64999, 100000,
];
const snapToLadder = (cents: number) =>
  LADDER.reduce((best, p) => (Math.abs(p * 100 - cents) < Math.abs(best * 100 - cents) ? p : best), LADDER[0]!) * 100;
const NO_RARE = (i: CatalogItem) => i.kind !== 'knife' && i.kind !== 'gloves';

type Spec = [name: string, price: number, hue: number, icon: string, re?: RegExp | null];

/** Тематический пул: подходящие по названию скины + дешёвая «мелочь» + ножи как мечта. */
const FILLER: Rarity[] = ['consumer', 'milspec', 'restricted'];
const themed = (re?: RegExp | null) =>
  re ? (i: CatalogItem) => re.test(i.finish) || re.test(i.weapon) || FILLER.includes(i.rarity) || i.kind === 'knife' : () => true;

/**
 * Структура и цены — как на популярных case-сайтах (серийные, стиль, фирменные, оружейные, ножевые,
 * ограниченная серия, бонусные, операции, официальные CS2). Названия и темы — свои.
 */
export function caseSpecs(items: CatalogItem[], crates: { id: string; name: string; image: string | null; itemIds: string[] }[] = []): CaseSpec[] {
  const specs: CaseSpec[] = [];
  const add = (category: string, list: Spec[], extra: Partial<CaseSpec> = {}) => {
    for (const [name, price, hue, icon, re] of list) {
      specs.push({ name, slug: slugify(name), category, price, hue, icon, pool: themed(re), ...extra });
    }
  };

  add('Серийные', [
    // серия «Кошмары»
    ['Кошмар', 39, 280, 'skull', /Blood|Death|Skull|Ghost|Haunt|Demon|Bone|Grave|Curse|Evil/i],
    ['Зомби', 119, 95, 'biohazard', /Zombie|Toxic|Poison|Acid|Virus|Bio|Rot|Plague|Decay/i],
    ['Маньяк', 349, 0, 'skull', /Blood|Crimson|Red|Slaughter|Kill|Death/i],
    ['Ведьма', 699, 300, 'pumpkin', /Witch|Magic|Spell|Hex|Curse|Night/i],
    ['Демон', 1499, 350, 'flame', /Demon|Hell|Fire|Inferno|Flame|Lava/i],
    // серия «Герои жанров»
    ['Ковбой', 49, 30, 'cowboy', /Desert|Sand|Copper|Rust|Wood|Western|Bandit|Outlaw|Sunset/i],
    ['Пират', 149, 200, 'anchor', /Ocean|Sea|Water|Wave|Coral|Shark|Anchor|Pirate|Kraken|Treasure/i],
    ['Детектив', 499, 220, 'fedora', /Noir|Black|Shadow|Dark|Smoke|Ash|Grey|Graphite|Midnight/i],
    ['Самурай', 899, 355, 'katana', /Dragon|Samurai|Katana|Sakura|Oni|Bamboo|Koi|Shogun|Ninja|Ronin/i],
    ['Наёмник', 2999, 300, 'chip', /Cyber|Neon|Digital|Circuit|Code|Tech|Hyper|Synth|Electric|Glitch/i],
    // серия «Фантастика»
    ['Астронавт', 29, 240, 'rocket', /Space|Galaxy|Nebula|Asiimov|Orbit|Moon|Star|Planet|Cosmo|Astro/i],
    ['Сталкер', 99, 40, 'gasmask', /Rust|Wasteland|Scorch|Burn|Ash|Nuclear|Radiation|Hazard|Scrap|Decay/i],
    ['Гонщик', 249, 15, 'flag', /Speed|Racing|Race|Turbo|Nitro|Fuel|Engine|Stripe|Velocity|Rally/i],
    ['Андроид', 399, 185, 'chip', /Cyber|Neon|Digital|Tech|Circuit|Chrome|Mecha/i],
    ['Пришелец', 999, 120, 'rocket', /Alien|Space|Galaxy|Nebula|Toxic|Acid/i],
    // серия «Мифы»
    ['Цербер', 69, 10, 'flame', /Hound|Wolf|Fire|Hell|Beast/i],
    ['Грифон', 199, 45, 'crown', /Griffin|Eagle|Gold|Wing|Feather/i],
    ['Кракен', 499, 190, 'anchor', /Kraken|Ocean|Sea|Wave|Tentacle|Coral/i],
    ['Феникс', 1999, 25, 'flame', /Phoenix|Fire|Flame|Blaze|Sun|Ember/i],
    ['Дракон', 5999, 150, 'dragon', /Dragon|Wyvern|Hydra|Serpent|Scale/i],
  ]);

  add('Стиль', [
    ['Граффити', 75, 300, 'chip', /Graffiti|Spray|Street|Tag|Paint|Pop/i],
    ['Неон', 199, 310, 'bolt', /Neon|Glow|Light|Electric|Hyper/i],
    ['Ретро', 189, 30, 'star', /Retro|Vintage|Classic|Old|Wood|Antique/i],
    ['Камуфляж', 439, 100, 'leaf', /Camo|DDPAT|Forest|Desert|Sand|Jungle|Urban/i],
    ['Мрамор', 499, 340, 'gem', /Marble|Damascus|Case Hardened|Crimson Web/i],
    ['Допплер', 999, 280, 'gem', /Doppler|Gamma/i],
    ['Градиент', 109, 50, 'gem', /Fade|Gradient/i],
    ['Хищники', 50, 30, 'target', /Tiger|Wolf|Panther|Lion|Leopard|Hyper Beast|Beast/i],
    ['Океан', 150, 195, 'anchor', /Ocean|Water|Wave|Sea|Aqua|Coral|Shark/i],
    ['Пламя', 300, 15, 'flame', /Fire|Flame|Blaze|Inferno|Heat|Burn/i],
  ]);

  add('Фирменные', [
    ['Хэллоуин', 52, 30, 'pumpkin', /Blood|Death|Skull|Ghost|Haunt|Night|Bone|Witch|Orange|Pumpkin|Spider/i],
    ['Новый год', 55, 200, 'snowflake', /Ice|Frost|Snow|Winter|Cold|Arctic|Gold|Star|Light/i],
    ['14 февраля', 120, 340, 'heart', /Pink|Rose|Heart|Love|Red|Crimson|Cherry|Bloom|Flower/i],
    ['8 марта', 140, 320, 'flower', /Flower|Bloom|Petal|Rose|Lily|Garden|Pink|Sakura|Spring/i],
    ['23 февраля', 379, 120, 'medal', /Army|Camo|DDPAT|Military|Tank|Soldier|Forest|Olive|Tactical|Guard/i],
    ['День рождения', 499, 280, 'gift', /Candy|Party|Gift|Gold|Neon|Rainbow|Fade|Hyper/i],
    ['Турнир', 650, 45, 'medal', null],
    ['Финал', 750, 50, 'crown', null],
    ['Лига', 269, 210, 'shield', null],
    ['Кубок', 1269, 40, 'crown', null],
    ['Изумруд', 499, 145, 'gem', null],
    ['Рубин', 999, 350, 'gem', null],
    ['Сапфир', 1999, 215, 'gem', null],
    ['Алмаз', 2999, 190, 'gem', null],
    ['Слиток', 5000, 45, 'crown', null],
    ['Гранд-слэм', 10000, 280, 'crown', null],
    ['Чёрный алмаз', 20000, 250, 'gem', null],
    ['Магнат', 30000, 45, 'crown', null],
    ['Император', 50000, 0, 'crown', null],
    ['Крипта', 100000, 35, 'crown', null],
  ], { rtp: 0.92 });

  const rarity = (r: Rarity[]) => (i: CatalogItem) => r.includes(i.rarity);
  specs.push(
    ...([
      ['Сильвер', 13, 210, ['consumer', 'industrial']],
      ['Армейское оружие', 25, 230, ['milspec', 'industrial']],
      ['Камуфляжный', 29, 100, ['consumer', 'industrial', 'milspec']],
      ['Зелёные скины', 59, 130, ['industrial', 'milspec', 'restricted']],
      ['Жёлтые скины', 89, 50, ['milspec', 'restricted']],
      ['Белые скины', 99, 0, ['consumer', 'restricted', 'classified']],
      ['Запрещённое оружие', 99, 270, ['restricted', 'classified']],
      ['Синие скины', 105, 225, ['milspec', 'restricted', 'classified']],
      ['Фиолетовые скины', 129, 265, ['restricted', 'classified']],
      ['Чёрные скины', 149, 240, ['restricted', 'classified', 'covert']],
      ['Красные скины', 185, 355, ['classified', 'covert']],
      ['Инь и Ян', 494, 0, ['consumer', 'classified', 'covert', 'gold']],
      ['Засекреченное оружие', 899, 300, ['classified', 'covert']],
      ['Тайное оружие', 4999, 355, ['covert', 'gold']],
    ] as [string, number, number, Rarity[]][]).map(([name, price, hue, r]) => ({
      name,
      slug: slugify(name),
      category: 'Оружейные',
      price,
      hue,
      icon: 'gem',
      pool: rarity(r),
    })),
  );
  // «X для всех» — только самое популярное оружие.
  for (const [w, price, hue] of [
    ['Glock-18', 59, 120], ['USP-S', 69, 190], ['Desert Eagle', 69, 45], ['M4A1-S', 280, 210], ['AK-47', 355, 20], ['AWP', 369, 140],
  ] as [string, number, number][]) {
    specs.push({
      name: `${w} для всех`,
      slug: `weapon-${slugify(w)}`,
      category: 'Оружейные',
      price,
      hue,
      icon: 'target',
      pool: (i) => i.weapon === w || (i.kind === 'knife' && i.price < price * 100 * 60),
    });
  }
  add('Оружейные', [
    ['Эко-раунд', 44, 100, 'shield', /Sand|Desert|Safari|Scorch|Contractor/i],
    ['Фарм', 55, 60, 'box', null],
    ['Фулл-бай', 189, 20, 'target', null],
    ['Звёзды', 25, 50, 'star', /Star|Galaxy|Space|Moon|Night/i],
    ['Руны', 29, 280, 'moon', /Rune|Magic|Spell|Myth|Legend/i],
    ['Магия', 75, 285, 'star', /Magic|Spell|Hex|Witch|Mystic/i],
    ['Охота за тайным', 399, 355, 'target', null],
    ['Смертельное оружие', 21999, 0, 'skull', null],
  ]);
  specs.push(
    { name: 'Перчаточный бум', slug: 'gloves-boom', category: 'Оружейные', price: 599, hue: 25, icon: 'glove', pool: (i) => i.kind === 'gloves' || i.rarity === 'classified' || i.rarity === 'restricted', rtp: 0.88 },
    { name: 'Перчаточный', slug: 'gloves', category: 'Оружейные', price: 6999, hue: 45, icon: 'glove', pool: (i) => i.kind === 'gloves' || i.rarity === 'covert', rtp: 0.88 },
  );

  for (const [name, w, price, hue] of [
    ['Штык-нож', '★ Bayonet', 16999, 200], ['Скелетный нож', '★ Skeleton Knife', 18999, 0], ['Коготь', '★ Talon Knife', 29999, 60],
    ['Штык-нож M9', '★ M9 Bayonet', 36999, 230], ['Нож-бабочка', '★ Butterfly Knife', 64999, 330], ['Фальшион', '★ Falchion Knife', 11999, 100],
    ['Складной нож', '★ Flip Knife', 17999, 50], ['Кукри', '★ Kukri Knife', 9999, 160], ['Бродяга', '★ Nomad Knife', 14599, 80],
    ['Боуи', '★ Bowie Knife', 9999, 30], ['Стилет', '★ Stiletto Knife', 21999, 300], ['Нож с крюком', '★ Gut Knife', 9999, 180],
    ['Охотничий нож', '★ Huntsman Knife', 10499, 120], ['Наваха', '★ Navaja Knife', 6999, 20], ['Тычковые ножи', '★ Shadow Daggers', 8499, 270],
  ] as [string, string, number, number][]) {
    specs.push({ name, slug: `knife-${slugify(w)}`, category: 'Ножевые', price, hue, icon: 'knife', pool: (i) => i.weapon === w || i.rarity === 'covert', rtp: 0.88 });
  }

  const limited: [string, number, number, number, string, RegExp | null][] = [
    ['Гейша', 69, 340, 1999, 'flower', /Sakura|Geisha|Flower|Bloom|Pink/i], ['Сэнсэй', 75, 30, 1200, 'katana', /Dragon|Samurai|Katana|Oni/i],
    ['Ретрофутуризм', 115, 190, 950, 'rocket', /Space|Retro|Chrome|Tech/i], ['Охотник на демонов', 135, 355, 800, 'katana', /Demon|Blood|Fire/i],
    ['Снайпер', 245, 140, 700, 'target', null], ['Профи', 349, 50, 650, 'medal', null], ['Смерть близко', 499, 0, 530, 'skull', /Death|Skull|Bone|Grave/i],
    ['Ножи будущего', 799, 200, 600, 'knife', null], ['Супергерой', 125, 215, 550, 'shield', null], ['Убийца нубов', 80, 10, 750, 'skull', null],
    ['Кибер', 105, 180, 800, 'chip', /Cyber|Neon|Digital|Circuit|Tech/i], ['Бродячий кот', 199, 40, 700, 'moon', /Cat|Tiger|Panther|Night/i],
    ['Ниндзя', 89, 260, 700, 'katana', /Ninja|Shadow|Dark|Night/i], ['Легенда', 125, 45, 550, 'crown', null],
    ['Хайп', 149, 300, 800, 'bolt', /Hyper|Neon|Pop|Graffiti/i], ['Один выстрел', 699, 0, 500, 'target', null], ['Градиент лимит', 269, 330, 700, 'gem', /Fade|Gradient/i],
  ];
  for (const [name, price, hue, limit, icon, re] of limited) {
    specs.push({ name, slug: `limited-${slugify(name)}`, category: 'Ограниченная серия', price, hue, icon, limitTotal: limit, pool: themed(re) });
  }

  add('Бонусные', [
    ['Янтарный', 20, 35, 'gem'], ['Ониксовый', 50, 260, 'gem'], ['Гранатовый', 100, 345, 'gem'], ['Гессонитовый', 250, 25, 'gem'],
    ['Изумрудный', 500, 145, 'gem'], ['Турмалиновый', 750, 320, 'gem'], ['Сапфировый', 1000, 215, 'gem'], ['Аметистовый', 2500, 285, 'gem'],
    ['Рубиновый', 5000, 350, 'crown'], ['Опаловый', 10000, 175, 'crown'],
  ], { rtp: 0.92 });

  add('Операции', [
    ['Операция «Гроза»', 129, 230, 'bolt', /Storm|Thunder|Lightning|Electric/i],
    ['Операция «Прорыв»', 95, 15, 'medal', null],
    ['Операция «Шторм»', 119, 200, 'anchor', /Ocean|Sea|Wave|Water/i],
    ['Операция «Цитадель»', 399, 270, 'shield', null],
    ['Операция «Ищейка»', 549, 0, 'target', null],
  ]);

  // Официальные кейсы CS2 с реальным содержимым — 30 самых известных (больше всего предметов).
  const byId = new Map(items.map((i) => [i.id, i]));
  const official = crates
    .filter((c) => c.itemIds.length >= 8 && !c.name.includes('Souvenir'))
    .sort((a, b) => b.itemIds.length - a.itemIds.length)
    .slice(0, 30)
    .sort((a, b) => a.name.localeCompare(b.name));
  for (const c of official) {
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
      price = snapToLadder(Math.sqrt(q(0.15) * q(0.6)));
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
  { code: 'DEMO', amount: 10000, maxUses: null },
  { code: 'WELCOME', amount: 5000, maxUses: null },
  { code: 'BATTLE', amount: 30000, maxUses: 100 },
];
