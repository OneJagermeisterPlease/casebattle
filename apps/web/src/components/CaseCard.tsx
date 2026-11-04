import type { CaseDTO } from '@casebattle/shared';
import Link from 'next/link';
import { CaseArt } from './CaseArt';
import { Price } from './Coin';

function itemsWord(n: number) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return 'предмет';
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'предмета';
  return 'предметов';
}

export function CaseCard({ c }: { c: CaseDTO }) {
  const soldOut = c.limitTotal !== null && c.limitOpened >= c.limitTotal;
  return (
    <Link href={`/case/${c.slug}`} className="case-card" style={soldOut ? { opacity: 0.5 } : undefined}>
      {c.limitTotal !== null && <span className="case-badge">LIMIT</span>}
      <CaseArt c={c} />
      <div className="case-card-name">{c.name}</div>
      <div className="case-card-count">
        {c.itemCount} {itemsWord(c.itemCount)}
      </div>
      {c.limitTotal !== null && (
        <div className="limit-bar">
          {c.limitTotal - c.limitOpened} из {c.limitTotal}
          <div>
            <i style={{ width: `${(100 * (c.limitTotal - c.limitOpened)) / c.limitTotal}%` }} />
          </div>
        </div>
      )}
      <span className="price-tag">
        <Price value={c.price} />
      </span>
    </Link>
  );
}
