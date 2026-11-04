export const RARITIES = ['consumer', 'industrial', 'milspec', 'restricted', 'classified', 'covert', 'gold'] as const;
export type Rarity = (typeof RARITIES)[number];

export const RARITY_META: Record<Rarity, { label: string; color: string }> = {
  consumer: { label: 'Ширпотреб', color: '#b0c3d9' },
  industrial: { label: 'Промышленное', color: '#5e98d9' },
  milspec: { label: 'Армейское', color: '#4b69ff' },
  restricted: { label: 'Запрещённое', color: '#8847ff' },
  classified: { label: 'Засекреченное', color: '#d32ce6' },
  covert: { label: 'Тайное', color: '#eb4b4b' },
  gold: { label: 'Редкое ★', color: '#e4ae39' },
};

export const WEAPON_KINDS = ['pistol', 'smg', 'rifle', 'sniper', 'shotgun', 'mg', 'knife', 'gloves'] as const;
export type WeaponKind = (typeof WEAPON_KINDS)[number];

export const PATTERNS = ['solid', 'stripes', 'camo', 'dots', 'waves', 'hex', 'fade'] as const;
export type Pattern = (typeof PATTERNS)[number];

export type BattleMode = '1v1' | '1v1v1' | '1v1v1v1' | '2v2';

export const BATTLE_SLOTS: Record<BattleMode, number> = {
  '1v1': 2,
  '1v1v1': 3,
  '1v1v1v1': 4,
  '2v2': 4,
};

export function battleTeam(mode: BattleMode, slot: number): number {
  return mode === '2v2' ? (slot < 2 ? 0 : 1) : slot;
}

export type BattleStatus = 'waiting' | 'running' | 'finished' | 'cancelled';

export type ItemSource = 'case' | 'upgrade' | 'contract' | 'battle';
export type InventoryStatus = 'owned' | 'sold' | 'upgraded' | 'contracted';

/** Все суммы — демо-монеты в сотых долях (1 coin = 100). */
export interface ItemDTO {
  id: string;
  weapon: string;
  finish: string;
  kind: WeaponKind;
  rarity: Rarity;
  price: number;
  hue: number;
  pattern: Pattern;
  imageUrl: string | null;
}

export interface CaseDTO {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  hue: number;
  icon: string;
  imageUrl: string | null;
  /** Самый дорогой предмет кейса — для обложки. */
  cover: { imageUrl: string | null; rarity: Rarity; kind: WeaponKind; hue: number } | null;
  itemCount: number;
  limitTotal: number | null;
  limitOpened: number;
}

export interface CaseItemDTO extends ItemDTO {
  /** Шанс выпадения 0..1 */
  chance: number;
}

export interface CaseDetailDTO extends CaseDTO {
  items: CaseItemDTO[];
}

export interface InventoryItemDTO {
  id: string;
  item: ItemDTO;
  price: number;
  status: InventoryStatus;
  source: ItemSource;
  createdAt: string;
}

export interface PublicUserDTO {
  id: string;
  nickname: string;
  isBot: boolean;
}

export interface MeDTO extends PublicUserDTO {
  balance: number;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  prevServerSeed: string | null;
  prevServerSeedHash: string | null;
  dailyAvailableAt: string;
}

export interface DropDTO {
  id: string;
  item: ItemDTO;
  user: PublicUserDTO;
  source: ItemSource;
  caseSlug: string | null;
  caseName: string | null;
  createdAt: string;
}

export interface BattlePlayerDTO {
  slot: number;
  team: number;
  total: number;
  user: PublicUserDTO;
}

export interface BattleDropDTO {
  round: number;
  slot: number;
  item: ItemDTO;
}

export interface BattleDTO {
  id: string;
  mode: BattleMode;
  crazy: boolean;
  status: BattleStatus;
  cost: number;
  cases: CaseDTO[];
  players: BattlePlayerDTO[];
  drops: BattleDropDTO[];
  currentRound: number;
  winnerTeam: number | null;
  createdBy: string;
  serverSeedHash: string;
  serverSeed: string | null;
  createdAt: string;
  roundMs: number;
}
