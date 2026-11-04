'use client';

import type { CaseDetailDTO, InventoryItemDTO } from '@casebattle/shared';
import { CASE_MAX_OPEN, RARITY_META } from '@casebattle/shared';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Burst } from '@/components/Burst';
import { CaseArt } from '@/components/CaseArt';
import { Price } from '@/components/Coin';
import { Icon } from '@/components/Icon';
import { ItemCard } from '@/components/ItemCard';
import { Roulette } from '@/components/Roulette';
import { SoundToggle } from '@/components/SoundToggle';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { pct } from '@/lib/format';
import { whoosh, win as winSound } from '@/lib/sfx';
import { errText, useToast } from '@/lib/toast';

const SLOW_MS = 6500;
const FAST_MS = 1200;

type Phase = 'idle' | 'spinning' | 'result';
type Sort = 'price-desc' | 'price-asc' | 'chance';

function useFastMode(): [boolean, (v: boolean) => void] {
  const [fast, setFast] = useState(false);
  useEffect(() => {
    try {
      setFast(localStorage.getItem('cc_fast') === '1');
    } catch {
      // нет доступа к localStorage
    }
  }, []);
  return [
    fast,
    (v) => {
      setFast(v);
      try {
        localStorage.setItem('cc_fast', v ? '1' : '0');
      } catch {
        // ignore
      }
    },
  ];
}

export default function CasePage() {
  const { slug } = useParams<{ slug: string }>();
  const { me, openAuth, setBalance } = useAuth();
  const toast = useToast();
  const [c, setCase] = useState<CaseDetailDTO | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [count, setCount] = useState(1);
  const [fast, setFast] = useFastMode();
  const [phase, setPhase] = useState<Phase>('idle');
  const [results, setResults] = useState<InventoryItemDTO[]>([]);
  const [sold, setSold] = useState<Set<string>>(new Set());
  const [spinId, setSpinId] = useState(0);
  const [pendingBalance, setPendingBalance] = useState<number | null>(null);
  const [sort, setSort] = useState<Sort>('price-desc');

  const load = useCallback(() => {
    api<CaseDetailDTO>(`/cases/${slug}`)
      .then(setCase)
      .catch(() => setNotFound(true));
  }, [slug]);
  useEffect(load, [load]);

  const sorted = useMemo(() => {
    const items = [...(c?.items ?? [])];
    if (sort === 'price-asc') items.sort((a, b) => a.price - b.price);
    else if (sort === 'chance') items.sort((a, b) => b.chance - a.chance);
    else items.sort((a, b) => b.price - a.price);
    return items;
  }, [c, sort]);

  if (notFound)
    return (
      <div className="empty">
        Кейс не найден. <Link href="/">К списку кейсов</Link>
      </div>
    );
  if (!c) return <div className="loader">Загрузка…</div>;

  const limitLeft = c.limitTotal !== null ? c.limitTotal - c.limitOpened : null;
  const total = c.price * count;

  async function open() {
    if (!me) return openAuth();
    try {
      const res = await api<{ items: InventoryItemDTO[]; balance: number }>(`/cases/${slug}/open`, { body: { count } });
      setResults(res.items);
      setSold(new Set());
      setPendingBalance(res.balance);
      // Списание показываем сразу, выигрыш — после остановки рулетки.
      setBalance(res.balance);
      setPhase('spinning');
      setSpinId((x) => x + 1);
      whoosh(fast ? 0.25 : 0.5);
    } catch (e) {
      toast(errText(e), 'err');
    }
  }

  function done() {
    setPhase('result');
    if (profit >= 0 && results.length > 0) setTimeout(() => winSound(profit > c!.price * results.length), 380);
    if (pendingBalance !== null) setBalance(pendingBalance);
    load();
  }

  async function sell(ids: string[]) {
    try {
      const res = await api<{ balance: number; amount: number }>('/inventory/sell', { body: { ids } });
      setBalance(res.balance);
      setSold((s) => new Set([...s, ...ids]));
      toast(`Продано: +${(res.amount / 100).toLocaleString('ru-RU')} монет`, 'ok');
    } catch (e) {
      toast(errText(e), 'err');
    }
  }

  const unsold = results.filter((r) => !sold.has(r.id));
  const unsoldSum = unsold.reduce((s, r) => s + r.price, 0);
  const wonSum = results.reduce((s, r) => s + r.price, 0);
  const profit = wonSum - c.price * results.length;

  return (
    <div>
      <div className="case-hero">
        <div className="crumbs">
          <Link href="/">Кейсы</Link>
          <span>/</span>
          {c.category}
        </div>
        <h1>{c.name}</h1>

        {phase === 'idle' && (
          <div className="case-stage">
            <span className="case-stage-halo" aria-hidden />
            <CaseArt c={c} />
            <span className="case-stage-floor" aria-hidden />
          </div>
        )}

        {phase !== 'idle' && (
          <div className={`rolls${results.length > 1 ? ' multi' : ''}`} style={{ width: '100%' }}>
            {results.map((r, i) => (
              <Roulette
                key={`${spinId}-${i}`}
                pool={c.items}
                winner={r.item}
                spinId={spinId}
                duration={fast ? FAST_MS : SLOW_MS + i * 250}
                onDone={i === results.length - 1 ? done : undefined}
              />
            ))}
          </div>
        )}

        {phase === 'result' && (
          <>
            <div className={`result-banner ${profit >= 0 ? 'profit' : 'loss'}`}>
              {profit >= 0 && <Burst color="var(--accent)" size="lg" rays={false} />}
              <span className="result-icon">
                <Icon name={profit >= 0 ? 'trend' : 'trend-down'} size={26} stroke={2} />
              </span>
              <div className="result-text">
                <h2>{profit >= 0 ? 'Окупилось!' : 'В этот раз не повезло'}</h2>
                <div className="muted">
                  Выпало на <Price value={wonSum} /> при цене <Price value={c.price * results.length} />
                </div>
              </div>
              <b className="result-mult">x{(wonSum / (c.price * results.length)).toFixed(2)}</b>
            </div>
            <div className="win-row">
              {results.map((r, i) => (
                <div key={r.id} className="win-card" style={{ ['--i' as string]: i }}>
                  <Burst color={RARITY_META[r.item.rarity].color} size={results.length > 1 ? 'md' : 'lg'} />
                  <ItemCard
                    item={r.item}
                    price={r.price}
                    dim={sold.has(r.id)}
                    footer={
                      <button className="btn btn-sm btn-green btn-block" disabled={sold.has(r.id)} onClick={() => sell([r.id])}>
                        {sold.has(r.id) ? 'Продано' : 'Продать'}
                      </button>
                    }
                  />
                </div>
              ))}
            </div>
            <div className="win-actions">
              {unsold.length > 1 && (
                <button className="btn btn-green" onClick={() => sell(unsold.map((r) => r.id))}>
                  Продать всё за <Price value={unsoldSum} />
                </button>
              )}
              <button className="btn btn-primary" onClick={open}>
                Открыть ещё за <Price value={total} />
              </button>
              <button className="btn" onClick={() => setPhase('idle')}>
                Закрыть
              </button>
              <Link className="btn btn-ghost" href="/upgrade">
                В апгрейд <Icon name="arrow-right" size={16} />
              </Link>
            </div>
          </>
        )}

        {phase === 'idle' && (
          <div className="open-controls">
            <div className="count-picker" aria-label="Сколько открыть">
              {Array.from({ length: CASE_MAX_OPEN }, (_, i) => i + 1).map((n) => (
                <button key={n} className={count === n ? 'active' : ''} onClick={() => setCount(n)}>
                  x{n}
                </button>
              ))}
            </div>
            <label className="toggle" title="Короткая анимация вместо медленной прокрутки">
              <input type="checkbox" checked={fast} onChange={(e) => setFast(e.target.checked)} />
              <i />
              <Icon name="bolt" size={16} className="toggle-icon" />
              Быстрое открытие
            </label>
            <SoundToggle />
            {me ? (
              <button className="btn btn-primary btn-lg" onClick={open} disabled={me.balance < total || limitLeft === 0}>
                {limitLeft === 0 ? (
                  'Лимит исчерпан'
                ) : me.balance < total ? (
                  'Недостаточно монет'
                ) : (
                  <>
                    Открыть за <Price value={total} size={16} />
                  </>
                )}
              </button>
            ) : (
              <button className="btn btn-primary btn-lg" onClick={openAuth}>
                Войдите, чтобы открыть
              </button>
            )}
          </div>
        )}
        {phase === 'spinning' && (
          <div className="spin-hint">
            <span className="spin-dot" />
            Крутим{fast ? '…' : '… можно включить «Быстрое открытие»'}
          </div>
        )}
        {limitLeft !== null && (
          <div className="muted small">
            Осталось {limitLeft} из {c.limitTotal}
          </div>
        )}
      </div>

      <div className="picker-head" style={{ marginTop: 30 }}>
        <h3>Содержимое кейса · {c.items.length}</h3>
        <select className="select" style={{ maxWidth: 220 }} value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
          <option value="price-desc">Сначала дорогие</option>
          <option value="price-asc">Сначала дешёвые</option>
          <option value="chance">По шансу</option>
        </select>
      </div>
      <div className="grid-items">
        {sorted.map((it) => (
          <ItemCard key={it.id} item={it} top={<span className="chance-badge">{pct(it.chance)}</span>} />
        ))}
      </div>
    </div>
  );
}
