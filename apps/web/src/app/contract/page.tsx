'use client';

import type { InventoryItemDTO } from '@casebattle/shared';
import { CONTRACT_MAX_ITEMS, CONTRACT_MIN_ITEMS, contractRange, RARITY_META } from '@casebattle/shared';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Burst } from '@/components/Burst';
import { Price } from '@/components/Coin';
import { Icon } from '@/components/Icon';
import { ItemCard } from '@/components/ItemCard';
import { Modal } from '@/components/Modal';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { land, lose as loseSound, RARITY_LEVEL, win as winSound } from '@/lib/sfx';
import { errText, useToast } from '@/lib/toast';

type Result = { item: InventoryItemDTO; sum: number; balance: number };

export default function ContractPage() {
  const { me, openAuth, setBalance } = useAuth();
  const toast = useToast();
  const [inventory, setInventory] = useState<InventoryItemDTO[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [reveal, setReveal] = useState(false);
  const [rules, setRules] = useState(false);

  const load = useCallback(() => {
    if (me)
      api<InventoryItemDTO[]>('/me/inventory')
        .then(setInventory)
        .catch(() => undefined);
  }, [me?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(load, [load]);

  const sel = useMemo(() => selected.map((id) => inventory.find((i) => i.id === id)!).filter(Boolean), [selected, inventory]);
  const sum = sel.reduce((s, i) => s + i.price, 0);
  const range = contractRange(sum);
  const need = Math.max(0, CONTRACT_MIN_ITEMS - sel.length);

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length >= CONTRACT_MAX_ITEMS ? s : [...s, id]));
  }

  async function sign() {
    if (!me) return openAuth();
    setBusy(true);
    try {
      const res = await api<Result>('/contract', {
        body: { inventoryIds: selected },
      });
      setResult(res);
      setReveal(false);
      setTimeout(() => {
        setReveal(true);
        land(RARITY_LEVEL[res.item.item.rarity]);
        setTimeout(() => (res.item.price >= res.sum ? winSound(res.item.price >= res.sum * 1.5) : loseSound()), 250);
      }, 1600);
      setBalance(res.balance);
      setSelected([]);
      load();
    } catch (e) {
      toast(errText(e), 'err');
    } finally {
      setBusy(false);
    }
  }

  async function sellResult() {
    if (!result) return;
    try {
      const r = await api<{ balance: number }>('/inventory/sell', {
        body: { ids: [result.item.id] },
      });
      setBalance(r.balance);
      setResult(null);
      load();
    } catch (e) {
      toast(errText(e), 'err');
    }
  }

  return (
    <div>
      <div className="row">
        <h1 className="section-title" style={{ margin: 0, flex: 1 }}>
          Контракты
        </h1>
        <button className="btn btn-sm" onClick={() => setRules(true)}>
          <Icon name="info" size={16} />
          Правила игры
        </button>
      </div>

      <div className="contract-top" style={{ marginTop: 18 }}>
        <div className="panel">
          <div className="contract-slots">
            {Array.from({ length: CONTRACT_MAX_ITEMS }, (_, i) =>
              sel[i] ? (
                <ItemCard key={sel[i]!.id} item={sel[i]!.item} price={sel[i]!.price} compact onClick={() => toggle(sel[i]!.id)} />
              ) : (
                <div key={i} className="contract-slot">
                  <Icon name="plus" size={22} stroke={1.5} />
                </div>
              ),
            )}
          </div>
        </div>
        <div className="panel contract-summary">
          <b style={{ textTransform: 'uppercase' }}>{need > 0 ? `Положите ещё минимум ${need} ${need === 1 ? 'предмет' : 'предмета'}` : 'Контракт готов'}</b>
          <div className="stat-line">
            <span className="muted">Сумма контракта</span>
            <Price value={sum} />
          </div>
          <div className="stat-line">
            <span className="muted">Вы получите предмет</span>
            <span>
              от <Price value={range.min} /> до <Price value={range.max} />
            </span>
          </div>
          {me ? (
            <button className="btn btn-primary btn-lg" disabled={need > 0 || busy} onClick={sign}>
              <Icon name="pen" size={18} stroke={2} />
              Подписать!
            </button>
          ) : (
            <button className="btn btn-primary btn-lg" onClick={openAuth}>
              Войдите, чтобы подписать
            </button>
          )}
        </div>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <div className="picker-head">
          <h3>
            Мои предметы ({selected.length}/{CONTRACT_MAX_ITEMS})
          </h3>
        </div>
        {me && inventory.length === 0 && <div className="empty">У вас нет предметов — откройте любой кейс</div>}
        {!me && <div className="empty">Войдите, чтобы увидеть инвентарь</div>}
        <div className="grid-items small">
          {inventory.map((i) => (
            <ItemCard
              key={i.id}
              item={i.item}
              price={i.price}
              compact
              selected={selected.includes(i.id)}
              dim={!selected.includes(i.id) && selected.length >= CONTRACT_MAX_ITEMS}
              onClick={() => toggle(i.id)}
            />
          ))}
        </div>
      </div>

      <Modal open={!!result} onClose={() => setResult(null)} title="Результат контракта">
        {result && !reveal && (
          <div className="contract-signing">
            <svg className="contract-doc" viewBox="0 0 120 140" aria-hidden>
              <defs>
                <linearGradient id="doc-g" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#232a3b" />
                  <stop offset="1" stopColor="#141924" />
                </linearGradient>
              </defs>
              <path
                d="M22 8h54l26 26v90a8 8 0 0 1-8 8H22a8 8 0 0 1-8-8V16a8 8 0 0 1 8-8Z"
                fill="url(#doc-g)"
                stroke="rgba(255,255,255,.18)"
                strokeWidth="1.5"
              />
              <path d="M76 8v20a6 6 0 0 0 6 6h20" fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="1.5" />
              <path d="M30 50h46M30 62h56M30 74h40" stroke="rgba(255,255,255,.14)" strokeWidth="4" strokeLinecap="round" />
              <path
                className="contract-sign"
                d="M30 108c8-14 12-16 14-8s-2 14 4 8 8-16 12-10 2 12 8 8 10-10 14-6 6 6 10 4"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M28 118h66" stroke="rgba(255,255,255,.2)" strokeWidth="1.5" strokeDasharray="3 4" />
            </svg>
            <span className="contract-signing-text">Подписываем контракт…</span>
          </div>
        )}
        {result && reveal && (
          <div className={`contract-result ${result.item.price >= result.sum ? 'profit' : 'loss'}`}>
            <div className="win-card" style={{ margin: '0 auto' }}>
              <Burst color={RARITY_META[result.item.item.rarity].color} size="lg" />
              <ItemCard item={result.item.item} price={result.item.price} />
            </div>
            <div className="contract-outcome">
              <span className="muted">Вложено</span>
              <Price value={result.sum} />
              <Icon name="arrow-right" size={16} className="muted" />
              <b className={result.item.price >= result.sum ? 'green' : 'red'}>x{(result.item.price / result.sum).toFixed(2)}</b>
            </div>
            <div className="win-actions">
              <button className="btn btn-green" onClick={sellResult}>
                Продать за <Price value={result.item.price} />
              </button>
              <button className="btn" onClick={() => setResult(null)}>
                Забрать
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={rules} onClose={() => setRules(false)} title="Правила контракта">
        <ol className="muted" style={{ paddingLeft: 18, lineHeight: 1.6 }}>
          <li>
            Положите от {CONTRACT_MIN_ITEMS} до {CONTRACT_MAX_ITEMS} предметов из инвентаря.
          </li>
          <li>Вы получите один случайный предмет стоимостью от 25% до 300% суммы контракта.</li>
          <li>Чаще выпадают предметы дешевле суммы, реже — дороже. В среднем возвращается ~94% стоимости.</li>
          <li>Результат определяется provably fair-броском — его можно проверить на странице «Честность».</li>
        </ol>
      </Modal>
    </div>
  );
}
