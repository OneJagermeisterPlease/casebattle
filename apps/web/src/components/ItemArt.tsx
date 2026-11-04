import { RARITY_META, type ItemDTO, type WeaponKind } from '@casebattle/shared';

// Стилизованные силуэты для предметов без картинки (viewBox 200×120).
const SILHOUETTE: Record<WeaponKind, string> = {
  rifle:
    'M8 60 L58 56 L60 50 L118 50 L122 46 L150 46 L152 50 L192 50 L192 56 L152 58 L148 62 L128 62 L120 68 L114 94 L100 94 L104 70 L92 68 L86 90 L72 90 L76 66 L44 68 L14 80 L6 76 Z',
  sniper:
    'M4 62 L46 58 L48 52 L80 52 L80 40 L134 40 L134 52 L196 52 L196 57 L134 60 L118 62 L112 82 L98 82 L102 64 L60 66 L28 74 L6 74 Z',
  pistol: 'M40 42 L162 42 L164 58 L100 60 L96 66 L86 66 L84 62 L78 62 L70 100 L46 100 L56 62 L40 60 Z',
  smg: 'M18 54 L150 50 L152 44 L176 44 L176 54 L150 58 L118 60 L112 94 L98 94 L102 62 L82 64 L78 86 L62 86 L66 64 L40 64 L20 74 Z',
  shotgun: 'M8 60 L58 56 L64 52 L192 52 L192 60 L124 62 L124 70 L72 70 L64 66 L40 68 L18 78 L6 74 Z',
  mg: 'M8 60 L58 56 L60 50 L170 50 L172 46 L194 46 L194 56 L150 60 L130 62 L128 86 L92 86 L90 66 L76 66 L72 88 L58 88 L62 68 L40 70 L14 80 L6 76 Z',
  knife: 'M14 70 L72 66 L78 62 L118 60 Q162 56 194 38 Q182 70 132 78 L80 78 L74 74 L14 80 Z',
  gloves:
    'M66 104 L64 62 Q62 50 72 48 L74 26 Q80 18 87 26 L88 46 L90 18 Q97 10 104 18 L104 46 L107 22 Q114 14 121 22 L120 50 L124 34 Q131 28 137 36 L134 74 Q132 100 110 106 Z',
};

function PatternDefs({ id, pattern, hue }: { id: string; pattern: ItemDTO['pattern']; hue: number }) {
  const c1 = `hsl(${hue} 70% 55%)`;
  const c2 = `hsl(${(hue + 40) % 360} 75% 35%)`;
  const c3 = `hsl(${(hue + 180) % 360} 60% 50%)`;
  return (
    <defs>
      <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={c1} />
        <stop offset="1" stopColor={pattern === 'fade' ? c3 : c2} />
      </linearGradient>
      <pattern id={`${id}-p`} width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
        {pattern === 'stripes' && <rect width="5" height="14" fill="rgba(0,0,0,.28)" />}
        {pattern === 'dots' && <circle cx="7" cy="7" r="2.5" fill="rgba(255,255,255,.3)" />}
        {pattern === 'camo' && (
          <>
            <ellipse cx="4" cy="4" rx="5" ry="3" fill={`hsl(${hue} 30% 25% / .7)`} />
            <ellipse cx="11" cy="10" rx="4" ry="3" fill={`hsl(${hue + 60} 30% 70% / .5)`} />
          </>
        )}
        {pattern === 'waves' && <path d="M0 7 Q3.5 3 7 7 T14 7" stroke="rgba(255,255,255,.35)" fill="none" strokeWidth="2" />}
        {pattern === 'hex' && <path d="M7 1 L13 4.5 L13 10.5 L7 14 L1 10.5 L1 4.5 Z" stroke="rgba(0,0,0,.35)" fill="none" />}
      </pattern>
    </defs>
  );
}

export function ItemArt({ item, className = '' }: { item: ItemDTO; className?: string }) {
  if (item.imageUrl) {
    return <img className={`item-art ${className}`} src={item.imageUrl} alt={`${item.weapon} | ${item.finish}`} loading="lazy" draggable={false} />;
  }
  const id = `i${item.id}`;
  return (
    <svg className={`item-art ${className}`} viewBox="0 0 200 120" role="img" aria-label={`${item.weapon} | ${item.finish}`}>
      <PatternDefs id={id} pattern={item.pattern} hue={item.hue} />
      <path d={SILHOUETTE[item.kind]} fill={`url(#${id}-g)`} stroke="rgba(0,0,0,.55)" strokeWidth="2" strokeLinejoin="round" />
      {item.pattern !== 'solid' && item.pattern !== 'fade' && <path d={SILHOUETTE[item.kind]} fill={`url(#${id}-p)`} />}
    </svg>
  );
}

export const rarityColor = (item: ItemDTO) => RARITY_META[item.rarity].color;
