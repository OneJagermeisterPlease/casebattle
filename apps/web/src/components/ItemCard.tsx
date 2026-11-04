import type { ItemDTO } from '@casebattle/shared';
import { RARITY_META } from '@casebattle/shared';
import type { ReactNode } from 'react';
import { shortName } from '@/lib/format';
import { Price } from './Coin';
import { ItemArt } from './ItemArt';

export function ItemCard({
  item,
  price,
  top,
  footer,
  selected,
  dim,
  onClick,
  compact,
}: {
  item: ItemDTO;
  price?: number;
  top?: ReactNode;
  footer?: ReactNode;
  selected?: boolean;
  dim?: boolean;
  onClick?: () => void;
  compact?: boolean;
}) {
  const color = RARITY_META[item.rarity].color;
  return (
    <div
      className={`item-card r-${item.rarity}${selected ? ' selected' : ''}${dim ? ' dim' : ''}${onClick ? ' clickable' : ''}${compact ? ' compact' : ''}`}
      style={{ ['--rarity' as string]: color }}
      onClick={onClick}
      title={`${item.weapon} | ${item.finish}`}
    >
      <span className="item-card-sheen" aria-hidden />
      <div className="item-card-top">
        <Price value={price ?? item.price} size={12} />
        {top}
      </div>
      <div className="item-card-art">
        <ItemArt item={item} />
      </div>
      <div className="item-card-name">
        <div className="item-weapon">{shortName(item.weapon)}</div>
        <div className="item-finish">{item.finish}</div>
      </div>
      {footer}
    </div>
  );
}
