'use client';

import type { CaseItemDTO, ItemDTO } from '@casebattle/shared';
import { RARITY_META } from '@casebattle/shared';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { shortName } from '@/lib/format';
import { land, RARITY_LEVEL, tick } from '@/lib/sfx';
import { Burst } from './Burst';
import { ItemArt } from './ItemArt';

const STRIP = 60;
const WIN_INDEX = 52;
/** Доля длительности, за которую лента доезжает до точки «перелёта»; остаток — плавный откат назад. */
const MAIN_SHARE = 0.9;
const SETTLE_MS = 420;
const MAX_BLUR = 12;

/** Случайный «наполнитель» ленты с учётом реальных шансов кейса — как выглядела бы честная прокрутка. */
function filler(pool: CaseItemDTO[], n: number): ItemDTO[] {
  const out: ItemDTO[] = [];
  // Немного «подкручиваем» визуал: редкие предметы чаще мелькают в ленте, чтобы прокрутка была интереснее.
  const weights = pool.map((p) => Math.pow(p.chance, 0.55));
  const total = weights.reduce((s, w) => s + w, 0);
  for (let i = 0; i < n; i++) {
    let r = Math.random() * total;
    let k = 0;
    while (k < pool.length - 1 && (r -= weights[k]!) > 0) k++;
    out.push(pool[k]!);
  }
  return out;
}

const easeOut = (u: number) => 1 - Math.pow(1 - u, 4);
const easeInOut = (u: number) => 0.5 - Math.cos(Math.PI * u) / 2;

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

export function Roulette({
  pool,
  winner,
  spinId,
  duration,
  vertical,
  onDone,
}: {
  pool: CaseItemDTO[];
  winner: ItemDTO | null;
  /** Меняется при каждом новом запуске. */
  spinId: number;
  duration: number;
  vertical?: boolean;
  onDone?: () => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const blurWrapRef = useRef<HTMLDivElement>(null);
  const blurRef = useRef<SVGFEGaussianBlurElement>(null);
  const markerRef = useRef<HTMLDivElement>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const filterId = `rb${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const [landed, setLanded] = useState(false);
  const [spinning, setSpinning] = useState(false);

  const strip = useMemo(() => {
    if (pool.length === 0) return [];
    const items = filler(pool, STRIP);
    if (winner) items[WIN_INDEX] = winner;
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinId, pool]);

  useEffect(() => {
    const track = trackRef.current;
    const view = viewRef.current;
    if (!track || !view || !winner) return;
    const cells = track.children as HTMLCollectionOf<HTMLElement>;
    const winCell = cells[WIN_INDEX];
    const first = cells[0];
    const second = cells[1];
    if (!winCell || !first || !second) return;

    setLanded(false);
    setSpinning(true);
    const reduced = prefersReducedMotion();
    const axis = vertical ? 'translateY' : 'translateX';
    const cellSize = vertical ? winCell.offsetHeight : winCell.offsetWidth;
    const pitch = vertical ? second.offsetTop - first.offsetTop : second.offsetLeft - first.offsetLeft;
    const firstStart = vertical ? first.offsetTop : first.offsetLeft;
    const viewSize = vertical ? view.clientHeight : view.clientWidth;
    // Центр выигрышной карточки под маркером.
    const center = (vertical ? winCell.offsetTop : winCell.offsetLeft) + cellSize / 2 - viewSize / 2;
    // Останавливаемся в случайной точке внутри выигрышной карточки — как в настоящей рулетке…
    const jitter = (Math.random() - 0.5) * cellSize * 0.6;
    const target = center + jitter;
    // …с небольшим перелётом вперёд, который всё равно остаётся в пределах карточки (|jitter + over| < cellSize/2).
    const over = reduced ? 0 : cellSize * (0.06 + Math.random() * 0.08);

    const setPos = (p: number) => {
      track.style.transform = `${axis}(${-p}px)`;
    };
    const setBlur = (b: number) => {
      const wrap = blurWrapRef.current;
      const fe = blurRef.current;
      if (!wrap || !fe) return;
      if (b < 0.4) {
        wrap.style.filter = '';
      } else {
        fe.setAttribute('stdDeviation', vertical ? `0 ${b}` : `${b} 0`);
        wrap.style.filter = `url(#${filterId})`;
      }
    };

    track.style.transition = 'none';
    setPos(0);
    setBlur(0);
    void track.offsetWidth;

    const posAt = (u: number) => {
      if (u <= MAIN_SHARE) return easeOut(u / MAIN_SHARE) * (target + over);
      return target + over - over * easeInOut((u - MAIN_SHARE) / (1 - MAIN_SHARE));
    };

    let raf = 0;
    let lastIdx = -1;
    let lastBlur = -1;
    let lastPulse = 0;
    let hot: HTMLElement | undefined;
    const t0 = performance.now();
    let prevT = t0;
    let prevP = 0;

    const frame = (now: number) => {
      const u = Math.min(1, (now - t0) / duration);
      const p = posAt(u);
      setPos(p);
      const dt = Math.max(1, now - prevT);
      const v = Math.abs(p - prevP) / dt; // px/ms
      prevT = now;
      prevP = p;
      if (!reduced) {
        const b = Math.min(vertical ? MAX_BLUR * 0.6 : MAX_BLUR, Math.round(v * (vertical ? 1.1 : 1.6) * 2) / 2);
        if (b !== lastBlur) {
          setBlur(b);
          lastBlur = b;
        }
      }
      // Какая ячейка сейчас под маркером?
      const idx = Math.floor((p + viewSize / 2 - firstStart + (pitch - cellSize) / 2) / pitch);
      if (idx !== lastIdx) {
        if (lastIdx !== -1) {
          tick(1 - Math.min(1, v / 4));
          if (!reduced && now - lastPulse > 45 && markerRef.current?.animate) {
            lastPulse = now;
            markerRef.current.animate([{ filter: 'brightness(1.9)' }, { filter: 'brightness(1)' }], { duration: 160, easing: 'ease-out' });
          }
        }
        hot?.classList.remove('hot');
        hot = cells[idx];
        hot?.classList.add('hot');
        lastIdx = idx;
      }
      if (u < 1) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    let settle: ReturnType<typeof setTimeout> | undefined;
    const t = setTimeout(() => {
      cancelAnimationFrame(raf);
      hot?.classList.remove('hot');
      setBlur(0);
      setPos(target);
      void track.offsetWidth;
      // Доводим до центра карточки, как делают «живые» рулетки.
      track.style.transition = `transform ${SETTLE_MS}ms cubic-bezier(0.3, 0.7, 0.2, 1)`;
      setPos(center);
      setLanded(true);
      setSpinning(false);
      land(RARITY_LEVEL[winner.rarity]);
      onDoneRef.current?.();
      settle = setTimeout(() => (track.style.transition = 'none'), SETTLE_MS + 50);
    }, duration);

    return () => {
      clearTimeout(t);
      if (settle) clearTimeout(settle);
      cancelAnimationFrame(raf);
      hot?.classList.remove('hot');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinId]);

  const winColor = winner ? RARITY_META[winner.rarity].color : 'var(--accent)';

  return (
    <div
      ref={viewRef}
      className={`roulette${vertical ? ' vertical' : ''}${landed ? ' landed' : ''}${spinning ? ' spinning' : ''}`}
      style={{ ['--win' as string]: winColor }}
    >
      <svg className="roulette-defs" aria-hidden width="0" height="0">
        <filter id={filterId} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
          <feGaussianBlur ref={blurRef} stdDeviation="0 0" />
        </filter>
      </svg>
      <div className="roulette-floor" />
      <div ref={blurWrapRef} className="roulette-clip">
        <div ref={trackRef} className="roulette-track">
          {strip.map((it, i) => {
            const isWin = i === WIN_INDEX && landed;
            return (
              <div key={i} className={`roulette-cell${isWin ? ' win' : ''}`} style={{ ['--rarity' as string]: RARITY_META[it.rarity].color }}>
                {isWin && <Burst color={RARITY_META[it.rarity].color} size={vertical ? 'sm' : 'md'} />}
                <span className="cell-light" />
                <ItemArt item={it} />
                {!vertical && (
                  <div className="roulette-name">
                    <span>{shortName(it.weapon)}</span>
                    <b>{it.finish}</b>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="roulette-vignette" />
      <div className="roulette-beam" />
      <div ref={markerRef} className="roulette-marker">
        <i />
        <i />
      </div>
      <div className="roulette-glass" />
    </div>
  );
}
