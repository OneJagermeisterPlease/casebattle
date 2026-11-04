'use client';

import type { InventoryItemDTO, ItemDTO } from '@casebattle/shared';
import { UPGRADE_MAX_ITEMS, upgradeChance, upgradeTargetForChance } from '@casebattle/shared';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Burst } from '@/components/Burst';
import { Price } from '@/components/Coin';
import { Icon } from '@/components/Icon';
import { rarityColor } from '@/components/ItemArt';
import { ItemCard } from '@/components/ItemCard';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatCoins } from '@/lib/format';
import { lose as loseSound, tick, whoosh, win as winSound } from '@/lib/sfx';
import { errText, useToast } from '@/lib/toast';

const SPIN_SLOW_MS = 6000;
const SPIN_FAST_MS = 2000;
const TURNS = 6;
const TICKS = 60;
const SHARDS = 14;

/** Плавное замедление стрелки (≈ cubic-bezier(0.1, 0.7, 0.1, 1)). */
const spinEase = (u: number) => 1 - Math.pow(1 - u, 4.2);

/** Угол стрелки (по часовой от верха) для броска: зона выигрыша — дуга шириной chance·360° с центром внизу. */
const pointerAngle = (roll: number, chance: number) => 180 - 180 * chance + 360 * roll;
/** Деление на угле deg подсвечено, если попадает в дугу шанса. */
const inArc = (deg: number, chance: number) => Math.abs(deg - 180) <= 180 * chance;

type Result = {
  win: boolean;
  chance: number;
  roll: number;
  item: InventoryItemDTO | null;
  balance: number;
};

export default function UpgradePage() {
  const { me, openAuth, setBalance } = useAuth();
  const toast = useToast();
  const [inventory, setInventory] = useState<InventoryItemDTO[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [extra, setExtra] = useState('');
  const [target, setTarget] = useState<ItemDTO | null>(null);
  const [catalog, setCatalog] = useState<ItemDTO[]>([]);
  const [catalogTotal, setCatalogTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [invSearch, setInvSearch] = useState('');
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [sort, setSort] = useState<'asc' | 'desc'>('asc');
  const [spinning, setSpinning] = useState(false);
  const [fast, setFast] = useState(false);
  useEffect(() => {
    try {
      setFast(localStorage.getItem('cc_fast_upgrade') === '1');
    } catch {
      // нет доступа к localStorage
    }
  }, []);
  const spinMs = fast ? SPIN_FAST_MS : SPIN_SLOW_MS;
  const [result, setResult] = useState<Result | null>(null);
  const [angle, setAngle] = useState(0);
  const angleRef = useRef(0);
  const pointerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  /** Крутим стрелку от текущего угла до `to` через rAF: щелчки на делениях и «шлейф» по скорости. */
  function animatePointer(from: number, to: number) {
    const el = pointerRef.current;
    if (!el) return;
    cancelAnimationFrame(rafRef.current);
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const t0 = performance.now();
    let prev = from;
    let prevT = t0;
    let seg = Math.floor(from / (360 / TICKS));
    const step = (now: number) => {
      const u = Math.min(1, (now - t0) / spinMs);
      const a = from + (to - from) * spinEase(u);
      el.style.transform = `rotate(${a}deg)`;
      const v = (a - prev) / Math.max(1, now - prevT); // deg/ms
      prev = a;
      prevT = now;
      el.style.setProperty('--trail', reduced ? '0' : String(Math.min(1, v / 0.9)));
      const s = Math.floor(a / (360 / TICKS));
      if (s !== seg) {
        seg = s;
        tick(1 - Math.min(1, v / 1.2));
      }
      if (u < 1) rafRef.current = requestAnimationFrame(step);
      else el.style.setProperty('--trail', '0');
    };
    rafRef.current = requestAnimationFrame(step);
  }

  const loadInventory = useCallback(() => {
    if (!me) return;
    api<InventoryItemDTO[]>('/me/inventory')
      .then(setInventory)
      .catch(() => undefined);
  }, [me?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(loadInventory, [loadInventory]);

  const extraCents = Math.max(0, Math.round((Number(extra.replace(',', '.')) || 0) * 100));
  const selItems = useMemo(() => inventory.filter((i) => selected.includes(i.id)), [inventory, selected]);
  const stake = selItems.reduce((s, i) => s + i.price, 0) + extraCents;
  const chance = target && stake > 0 && target.price > stake ? upgradeChance(stake, target.price) : 0;

  // Каталог желаемых: только дороже ставки.
  const floor = Math.max(stake + 1, minPrice ?? 0);
  useEffect(() => {
    const q = new URLSearchParams({
      sort,
      limit: '60',
      minPrice: String(floor),
    });
    if (search) q.set('search', search);
    const t = setTimeout(() => {
      api<{ items: ItemDTO[]; total: number }>(`/items?${q}`)
        .then((r) => {
          setCatalog(r.items);
          setCatalogTotal(r.total);
        })
        .catch(() => undefined);
    }, 200);
    return () => clearTimeout(t);
  }, [floor, search, sort]);

  async function loadMore() {
    const q = new URLSearchParams({
      sort,
      limit: '60',
      offset: String(catalog.length),
      minPrice: String(floor),
    });
    if (search) q.set('search', search);
    const r = await api<{ items: ItemDTO[] }>(`/items?${q}`);
    setCatalog((c) => [...c, ...r.items]);
  }

  // Если ставка выросла и цель стала дешевле — сбрасываем цель.
  useEffect(() => {
    if (target && target.price <= stake) setTarget(null);
  }, [stake, target]);

  function toggle(id: string) {
    if (spinning) return;
    setResult(null);
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length >= UPGRADE_MAX_ITEMS ? s : [...s, id]));
  }

  /** Кнопки x2/x5/x10 и 30/50/75%: подбираем ближайший предмет к нужной цене. */
  async function quick(kind: 'mult' | 'chance', v: number) {
    if (stake <= 0) return toast('Сначала выберите предметы или добавьте баланс', 'info');
    const wanted = kind === 'mult' ? stake * v : upgradeTargetForChance(stake, v);
    setMinPrice(Math.round(wanted * 0.9));
    try {
      const r = await api<{ items: ItemDTO[] }>(`/items?minPrice=${Math.max(stake + 1, wanted)}&sort=asc&limit=1`);
      if (r.items[0]) {
        setTarget(r.items[0]);
        setResult(null);
      } else toast('Нет предметов такой цены', 'info');
    } catch (e) {
      toast(errText(e), 'err');
    }
  }

  async function go() {
    if (!me) return openAuth();
    if (!target) return;
    setSpinning(true);
    setResult(null);
    try {
      const res = await api<Result>('/upgrade', {
        body: {
          inventoryIds: selected,
          balance: extraCents,
          targetItemId: target.id,
        },
      });
      // Стрелка делает несколько полных оборотов и останавливается на угле броска.
      const base = angleRef.current - (angleRef.current % 360);
      const next = base + 360 * (fast ? 3 : TURNS) + pointerAngle(res.roll, res.chance);
      const from = angleRef.current;
      angleRef.current = next;
      animatePointer(from, next);
      whoosh(0.6);
      if (extraCents) setBalance(me.balance - extraCents);
      setTimeout(() => {
        cancelAnimationFrame(rafRef.current);
        pointerRef.current?.style.setProperty('--trail', '0');
        if (pointerRef.current) pointerRef.current.style.transform = `rotate(${next}deg)`;
        setAngle(next);
        if (res.win) winSound(true);
        else loseSound();
        setResult(res);
        setSpinning(false);
        setBalance(res.balance);
        setSelected([]);
        setExtra('');
        loadInventory();
        toast(res.win ? 'Апгрейд удался!' : 'Апгрейд не удался', res.win ? 'ok' : 'err');
      }, spinMs + 100);
    } catch (e) {
      setSpinning(false);
      toast(errText(e), 'err');
    }
  }

  const shownChance = result ? result.chance : chance;
  const wheelState = result ? (result.win ? 'win' : 'lose') : '';
  const invFiltered = inventory.filter((i) => !invSearch || `${i.item.weapon} ${i.item.finish}`.toLowerCase().includes(invSearch.toLowerCase()));

  return (
    <div>
      <h1 className="section-title" style={{ marginTop: 0 }}>
        Апгрейд
      </h1>
      <div className="upgrade-layout">
        <div className="panel upgrade-slot">
          {selItems.length === 0 && extraCents === 0 ? (
            <>
              <span className="slot-icon">
                <Icon name="bag" size={34} stroke={1.4} />
              </span>
              <b>Выберите до {UPGRADE_MAX_ITEMS} предметов</b>
              <span className="muted small">или добавьте баланс ниже</span>
            </>
          ) : (
            <>
              <div className="grid-items small">
                {selItems.map((i) => (
                  <ItemCard key={i.id} item={i.item} price={i.price} compact onClick={() => toggle(i.id)} />
                ))}
              </div>
              <div>
                Ставка: <Price value={stake} />
                {extraCents > 0 && <span className="muted small"> (в т.ч. баланс {formatCoins(extraCents)})</span>}
              </div>
            </>
          )}
        </div>

        <div className="panel upgrade-center">
          <div className={`wheel ${wheelState}${spinning ? ' spinning' : ''}`} style={{ ['--p' as string]: shownChance }}>
            <span className="wheel-aura" aria-hidden />
            <svg className="wheel-ticks" viewBox="0 0 300 300" aria-hidden>
              {Array.from({ length: TICKS }, (_, i) => {
                const major = i % 5 === 0;
                return (
                  <line
                    key={i}
                    x1="150"
                    y1={major ? 4 : 7}
                    x2="150"
                    y2="15"
                    className={inArc((i * 360) / TICKS, shownChance) ? 'lit' : ''}
                    strokeWidth={major ? 2 : 1.2}
                    transform={`rotate(${(i * 360) / TICKS} 150 150)`}
                  />
                );
              })}
            </svg>
            <span className="wheel-track" aria-hidden />
            <span className="wheel-arc-glow" aria-hidden />
            <span className="wheel-arc" aria-hidden />
            <span className="wheel-disc" aria-hidden />
            <div ref={pointerRef} className="wheel-pointer" style={{ transform: `rotate(${angle}deg)` }}>
              <span className="wheel-trail" />
              <span className="wheel-needle" />
            </div>
            <span className="wheel-hub" aria-hidden />
            <div className="wheel-center">
              <b>{(shownChance * 100).toFixed(2)}%</b>
              <small>{result ? (result.win ? 'Успех' : 'Неудача') : 'шанс'}</small>
            </div>
            {result?.win && <Burst color="var(--green)" size="xl" />}
            {result && !result.win && (
              <span className="wheel-shatter" aria-hidden>
                {Array.from({ length: SHARDS }, (_, i) => (
                  <i
                    key={i}
                    style={{
                      ['--a' as string]: `${(i * 360) / SHARDS + ((i * 37) % 17)}deg`,
                      ['--r' as string]: `${((i * 71) % 160) - 80}deg`,
                    }}
                  />
                ))}
              </span>
            )}
          </div>
          <div className="mult-row">
            {[2, 5, 10].map((m) => (
              <button key={m} className="chip" disabled={spinning} onClick={() => quick('mult', m)}>
                x{m}
              </button>
            ))}
            {[0.3, 0.5, 0.75].map((p) => (
              <button key={p} className="chip" disabled={spinning} onClick={() => quick('chance', p)}>
                {p * 100}%
              </button>
            ))}
          </div>
          <div className="row" style={{ width: '100%' }}>
            <input
              className="input"
              style={{ flex: 1 }}
              placeholder="Добавить баланс"
              inputMode="decimal"
              value={extra}
              disabled={spinning}
              onChange={(e) => {
                setExtra(e.target.value.replace(/[^\d.,]/g, ''));
                setResult(null);
              }}
            />
            <span className="muted small">
              баланс: <Price value={me?.balance ?? 0} size={12} />
            </span>
          </div>
          <label className="toggle" title="Короткая прокрутка вместо долгой">
            <input
              type="checkbox"
              checked={fast}
              disabled={spinning}
              onChange={(e) => {
                setFast(e.target.checked);
                try {
                  localStorage.setItem('cc_fast_upgrade', e.target.checked ? '1' : '0');
                } catch {
                  // ignore
                }
              }}
            />
            <i />
            Быстрый апгрейд
          </label>
          {me ? (
            <button className="btn btn-primary btn-lg btn-block" disabled={!target || stake <= 0 || spinning || extraCents > (me?.balance ?? 0)} onClick={go}>
              {spinning ? 'Крутим…' : 'Прокачать'}
            </button>
          ) : (
            <button className="btn btn-primary btn-lg btn-block" onClick={openAuth}>
              Войдите, чтобы начать апгрейд
            </button>
          )}
        </div>

        <div className="panel upgrade-slot">
          {result?.win && result.item ? (
            <>
              <div className="win-card">
                <Burst color={rarityColor(result.item.item)} size="md" />
                <ItemCard item={result.item.item} price={result.item.price} />
              </div>
              <b className="green row" style={{ justifyContent: 'center' }}>
                <Icon name="check" size={18} stroke={2.2} /> Предмет добавлен в инвентарь
              </b>
            </>
          ) : target ? (
            <>
              <div className="win-card" style={{ animation: 'none' }}>
                <ItemCard item={target} onClick={() => !spinning && setTarget(null)} />
              </div>
              {stake > 0 && <b>x{(target.price / stake).toFixed(2)}</b>}
            </>
          ) : (
            <>
              <span className="slot-icon">
                <Icon name="target" size={34} stroke={1.4} />
              </span>
              <b>Выберите оружие, которое хотите получить</b>
            </>
          )}
        </div>
      </div>

      <div className="upgrade-pickers">
        <div className="panel">
          <div className="picker-head">
            <h3>
              Мои предметы · {inventory.length} ({selected.length}/{UPGRADE_MAX_ITEMS})
            </h3>
            <input className="input" placeholder="Поиск" value={invSearch} onChange={(e) => setInvSearch(e.target.value)} />
          </div>
          <div className="scroll-box">
            {!me && <div className="empty">Войдите, чтобы увидеть инвентарь</div>}
            {me && inventory.length === 0 && <div className="empty">Инвентарь пуст — откройте любой кейс</div>}
            <div className="grid-items small">
              {invFiltered.map((i) => (
                <ItemCard
                  key={i.id}
                  item={i.item}
                  price={i.price}
                  compact
                  selected={selected.includes(i.id)}
                  dim={!selected.includes(i.id) && selected.length >= UPGRADE_MAX_ITEMS}
                  onClick={() => toggle(i.id)}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="panel">
          <div className="picker-head">
            <h3>Желаемые предметы · {catalogTotal}</h3>
            <input className="input" placeholder="Поиск" value={search} onChange={(e) => setSearch(e.target.value)} />
            <select className="select" value={sort} onChange={(e) => setSort(e.target.value as 'asc' | 'desc')}>
              <option value="asc">Дешевле</option>
              <option value="desc">Дороже</option>
            </select>
            {minPrice !== null && (
              <button className="btn btn-sm" onClick={() => setMinPrice(null)}>
                от {formatCoins(minPrice)} <Icon name="close" size={14} />
              </button>
            )}
          </div>
          <div className="scroll-box">
            <div className="grid-items small">
              {catalog.map((it) => (
                <ItemCard
                  key={it.id}
                  item={it}
                  compact
                  selected={target?.id === it.id}
                  top={stake > 0 ? <span className="chance-badge">{(upgradeChance(stake, it.price) * 100).toFixed(1)}%</span> : undefined}
                  onClick={() => {
                    if (spinning) return;
                    setTarget(it);
                    setResult(null);
                  }}
                />
              ))}
            </div>
            {catalog.length < catalogTotal && (
              <button className="btn btn-block" onClick={loadMore}>
                Показать ещё
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
