import type { CSSProperties } from 'react';

type Size = 'sm' | 'md' | 'lg' | 'xl';

const SPARK_COUNT: Record<Size, number> = { sm: 10, md: 16, lg: 24, xl: 30 };

/**
 * Световой «взрыв» в момент раскрытия: вращающиеся лучи, вспышка, ударная волна и искры.
 * Чисто CSS; позиционируется по центру ближайшего positioned-родителя.
 */
export function Burst({
  color,
  size = 'md',
  rays = true,
  sparks = true,
  className = '',
  style,
}: {
  color: string;
  size?: Size;
  rays?: boolean;
  sparks?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const n = sparks ? SPARK_COUNT[size] : 0;
  return (
    <span className={`burst burst-${size} ${className}`} style={{ ['--c' as string]: color, ...style }} aria-hidden>
      {rays && <span className="burst-rays" />}
      <span className="burst-glow" />
      <span className="burst-ring" />
      {n > 0 && (
        <span className="burst-sparks">
          {Array.from({ length: n }, (_, i) => (
            <i
              key={i}
              style={{
                ['--a' as string]: `${(i * 137.508) % 360}deg`,
                ['--d' as string]: 70 + ((i * 47) % 55),
                ['--s' as string]: `${2 + ((i * 7) % 3)}px`,
                ['--t' as string]: `${(i * 23) % 140}ms`,
              }}
            />
          ))}
        </span>
      )}
    </span>
  );
}
