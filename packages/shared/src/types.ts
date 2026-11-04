export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface Item {
  id: string;
  name: string;
  rarity: Rarity;
  /** Цена в демо-монетах */
  price: number;
  imageUrl: string;
}

export interface CaseItem {
  item: Item;
  /** Относительный вес выпадения */
  weight: number;
}

export type BattleMode = '1v1' | '1v1v1' | '1v1v1v1' | '2v2';

export const BATTLE_SLOTS: Record<BattleMode, number> = {
  '1v1': 2,
  '1v1v1': 3,
  '1v1v1v1': 4,
  '2v2': 4,
};

export type BattleStatus = 'waiting' | 'running' | 'finished' | 'cancelled';
