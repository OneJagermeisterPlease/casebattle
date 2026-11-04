// Импорт реальных скинов CS2 из открытого датасета ByMykel/CSGO-API.
// Картинки не копируются — у предметов хранится ссылка на Steam CDN.
// Цен в датасете нет: считаем демо-цену по редкости и популярности оружия (правится в админке).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Rarity, WeaponKind } from '@casebattle/shared';
import type { CatalogItem } from './catalog';

const SOURCE = 'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json';
const CACHE = fileURLToPath(new URL('./.cache/cs2-skins.json', import.meta.url));

interface RawSkin {
  id: string;
  name: string;
  weapon: { name: string } | null;
  category: { name: string } | null;
  pattern: { name: string } | null;
  rarity: { name: string };
  image: string | null;
  crates?: { id: string; name: string; image: string | null }[];
}

export interface Cs2Crate {
  id: string;
  name: string;
  image: string | null;
  itemIds: string[];
}

const RARITY: Record<string, Rarity> = {
  'Consumer Grade': 'consumer',
  'Industrial Grade': 'industrial',
  'Mil-Spec Grade': 'milspec',
  Restricted: 'restricted',
  Classified: 'classified',
  Covert: 'covert',
  Contraband: 'covert',
  Extraordinary: 'gold',
};

const SNIPERS = new Set(['AWP', 'SSG 08', 'SCAR-20', 'G3SG1']);
const MGS = new Set(['Negev', 'M249']);

const POPULARITY: Record<string, number> = {
  'AK-47': 2.2,
  AWP: 2.6,
  'M4A4': 1.7,
  'M4A1-S': 1.7,
  'Desert Eagle': 1.5,
  'USP-S': 1.4,
  'Glock-18': 1.3,
};

// Цены в сотых долях монеты.
const RARITY_PRICE: Record<Rarity, [number, number]> = {
  consumer: [100, 600],
  industrial: [300, 1800],
  milspec: [600, 8000],
  restricted: [3000, 40000],
  classified: [15000, 200000],
  covert: [60000, 1500000],
  gold: [700000, 25000000],
};

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967296;
}

function kindOf(raw: RawSkin): WeaponKind | null {
  const weapon = raw.weapon?.name ?? '';
  switch (raw.category?.name) {
    case 'Knives':
      return 'knife';
    case 'Gloves':
      return 'gloves';
    case 'Pistols':
      return 'pistol';
    case 'SMGs':
      return 'smg';
    case 'Rifles':
      return SNIPERS.has(weapon) ? 'sniper' : 'rifle';
    case 'Heavy':
      return MGS.has(weapon) ? 'mg' : 'shotgun';
    default:
      return null;
  }
}

async function loadRaw(): Promise<RawSkin[]> {
  if (existsSync(CACHE)) return JSON.parse(readFileSync(CACHE, 'utf8')) as RawSkin[];
  const res = await fetch(SOURCE);
  if (!res.ok) throw new Error(`CS2 dataset: HTTP ${res.status}`);
  const text = await res.text();
  mkdirSync(fileURLToPath(new URL('./.cache/', import.meta.url)), { recursive: true });
  writeFileSync(CACHE, text);
  return JSON.parse(text) as RawSkin[];
}

export async function loadCs2(): Promise<{ items: CatalogItem[]; crates: Cs2Crate[] }> {
  const raw = await loadRaw();
  const items: CatalogItem[] = [];
  const crates = new Map<string, Cs2Crate>();
  for (const s of raw) {
    const kind = kindOf(s);
    const rarity = RARITY[s.rarity.name];
    if (!kind || !rarity || !s.weapon || !s.image) continue;
    const weapon = kind === 'knife' || kind === 'gloves' ? `★ ${s.weapon.name}` : s.weapon.name;
    const tier: Rarity = kind === 'knife' ? 'gold' : rarity;
    const [lo, hi] = RARITY_PRICE[tier];
    const pop = POPULARITY[s.weapon.name] ?? (kind === 'knife' || kind === 'gloves' ? 1 : 0.8);
    const finish = s.pattern?.name ?? 'Vanilla';
    // Ванильные ножи и «дорогие» узоры чуть дороже среднего.
    const bonus = /Fade|Doppler|Lore|Howl|Case Hardened|Crimson Web|Asiimov|Gamma|Marble/i.test(finish) ? 1.6 : 1;
    const price = Math.max(5, Math.round(lo * (hi / lo) ** hash(s.id) * pop * bonus));
    items.push({
      id: s.id,
      weapon,
      finish,
      kind,
      rarity: tier,
      price,
      hue: Math.floor(hash(`${s.id}:hue`) * 360),
      pattern: 'solid',
      imageUrl: s.image,
    });
    for (const c of s.crates ?? []) {
      const crate = crates.get(c.id) ?? { id: c.id, name: c.name, image: c.image, itemIds: [] };
      crate.itemIds.push(s.id);
      crates.set(c.id, crate);
    }
  }
  return { items, crates: [...crates.values()] };
}
