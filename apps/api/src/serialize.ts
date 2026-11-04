import type {
  BattleDTO,
  BattleMode,
  CaseDTO,
  DropDTO,
  InventoryItemDTO,
  ItemDTO,
  MeDTO,
  Pattern,
  PublicUserDTO,
  Rarity,
  WeaponKind,
} from '@casebattle/shared';
import type { Battle, BattleDrop, BattlePlayer, Case, InventoryItem, Item, User } from '@prisma/client';
import { env } from './env';

export const DAY_MS = 24 * 60 * 60 * 1000;

export const itemDTO = (i: Item): ItemDTO => ({
  id: i.id,
  weapon: i.weapon,
  finish: i.finish,
  kind: i.kind as WeaponKind,
  rarity: i.rarity as Rarity,
  price: i.price,
  hue: i.hue,
  pattern: i.pattern as Pattern,
  imageUrl: i.imageUrl,
});

type CaseWithCover = Case & { _count?: { items: number }; items?: { item: Item }[] };

function coverOf(c: CaseWithCover): CaseDTO['cover'] {
  const top = c.items?.reduce<Item | null>((best, ci) => (!best || ci.item.price > best.price ? ci.item : best), null);
  return top ? { imageUrl: top.imageUrl, rarity: top.rarity as Rarity, kind: top.kind as WeaponKind, hue: top.hue } : null;
}

export const caseDTO = (c: CaseWithCover): CaseDTO => ({
  id: c.id,
  slug: c.slug,
  name: c.name,
  category: c.category,
  price: c.price,
  hue: c.hue,
  icon: c.icon,
  imageUrl: c.imageUrl,
  cover: coverOf(c),
  itemCount: c._count?.items ?? 0,
  limitTotal: c.limitTotal,
  limitOpened: c.limitOpened,
});

export const publicUser = (u: Pick<User, 'id' | 'nickname' | 'isBot'>): PublicUserDTO => ({
  id: u.id,
  nickname: u.nickname,
  isBot: u.isBot,
});

export const meDTO = (u: User): MeDTO & { isAdmin: boolean } => ({
  ...publicUser(u),
  isAdmin: u.isAdmin,
  balance: u.balance,
  serverSeedHash: u.serverSeedHash,
  clientSeed: u.clientSeed,
  nonce: u.nonce,
  prevServerSeed: u.prevServerSeed,
  prevServerSeedHash: u.prevServerSeedHash,
  dailyAvailableAt: new Date(u.lastDailyAt ? u.lastDailyAt.getTime() + DAY_MS : 0).toISOString(),
});

export const inventoryDTO = (inv: InventoryItem & { item: Item }): InventoryItemDTO => ({
  id: inv.id,
  item: itemDTO(inv.item),
  price: inv.price,
  status: inv.status as InventoryItemDTO['status'],
  source: inv.source as InventoryItemDTO['source'],
  createdAt: inv.createdAt.toISOString(),
});

export const dropDTO = (inv: InventoryItem & { item: Item; user: User; case: Case | null }): DropDTO => ({
  id: inv.id,
  item: itemDTO(inv.item),
  user: publicUser(inv.user),
  source: inv.source as DropDTO['source'],
  caseSlug: inv.case?.slug ?? null,
  caseName: inv.case?.name ?? null,
  createdAt: inv.createdAt.toISOString(),
});

export const battleDTO = (
  b: Battle & {
    players: (BattlePlayer & { user: User })[];
    drops: (BattleDrop & { item: Item })[];
  },
  casesById: Map<string, Case & { _count?: { items: number } }>,
): BattleDTO => ({
  id: b.id,
  mode: b.mode as BattleMode,
  crazy: b.crazy,
  status: b.status as BattleDTO['status'],
  cost: b.cost,
  cases: (JSON.parse(b.caseIds) as string[]).map((id) => caseDTO(casesById.get(id)!)),
  players: b.players
    .sort((x, y) => x.slot - y.slot)
    .map((p) => ({ slot: p.slot, team: p.team, total: p.total, user: publicUser(p.user) })),
  drops: b.drops
    .sort((x, y) => x.round - y.round || x.slot - y.slot)
    .map((d) => ({ round: d.round, slot: d.slot, item: itemDTO(d.item) })),
  currentRound: b.currentRound,
  winnerTeam: b.winnerTeam,
  createdBy: b.createdById,
  serverSeedHash: b.serverSeedHash,
  serverSeed: b.status === 'finished' ? b.serverSeed : null,
  createdAt: b.createdAt.toISOString(),
  roundMs: env.battleRoundMs,
});
