'use client';

import type { InventoryItemDTO, PublicUserDTO } from '@casebattle/shared';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Avatar } from '@/components/Avatar';
import { Price } from '@/components/Coin';
import { ItemCard } from '@/components/ItemCard';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { errText, useToast } from '@/lib/toast';

interface Profile {
  user: PublicUserDTO;
  createdAt: string;
  stats: { totalWon: number; opened: number; battles: number };
  best: InventoryItemDTO | null;
  inventory: InventoryItemDTO[];
}

const STATUS_LABEL: Record<InventoryItemDTO['status'], string> = {
  owned: '',
  sold: 'Продан',
  upgraded: 'В апгрейде',
  contracted: 'В контракте',
};

export default function UserPage() {
  const { id } = useParams<{ id: string }>();
  const { me, setBalance } = useAuth();
  const toast = useToast();
  const [p, setP] = useState<Profile | null>(null);
  const [filter, setFilter] = useState<'owned' | 'all'>('owned');
  const own = me?.id === id;

  const load = useCallback(() => {
    api<Profile>(`/users/${id}`).then(setP).catch(() => setP(null));
  }, [id]);
  useEffect(load, [load]);

  const items = useMemo(() => (p?.inventory ?? []).filter((i) => filter === 'all' || i.status === 'owned'), [p, filter]);
  const ownedSum = (p?.inventory ?? []).filter((i) => i.status === 'owned').reduce((s, i) => s + i.price, 0);

  async function sell(ids: string[] | 'all') {
    try {
      const r = await api<{ balance: number; amount: number }>(ids === 'all' ? '/inventory/sell-all' : '/inventory/sell', {
        body: ids === 'all' ? {} : { ids },
      });
      setBalance(r.balance);
      toast(`Продано на ${(r.amount / 100).toLocaleString('ru-RU')} монет`, 'ok');
      load();
    } catch (e) {
      toast(errText(e), 'err');
    }
  }

  if (!p) return <div className="loader">Загрузка профиля…</div>;

  return (
    <div>
      <div className="panel profile-head">
        <Avatar name={p.user.nickname} size={72} bot={p.user.isBot} />
        <div>
          <h1>{p.user.nickname}</h1>
          <div className="muted small">На сайте с {new Date(p.createdAt).toLocaleDateString('ru-RU')}</div>
        </div>
        <div className="spacer" />
        <div className="kpis" style={{ flex: 2 }}>
          <div className="kpi">
            <small>Выиграно всего</small>
            <b>
              <Price value={p.stats.totalWon} size={18} />
            </b>
          </div>
          <div className="kpi">
            <small>Открыто кейсов</small>
            <b>{p.stats.opened}</b>
          </div>
          <div className="kpi">
            <small>Батлов</small>
            <b>{p.stats.battles}</b>
          </div>
        </div>
        {p.best && (
          <div style={{ width: 170 }}>
            <div className="muted small">Лучший дроп</div>
            <ItemCard item={p.best.item} price={p.best.price} compact />
          </div>
        )}
      </div>

      <div className="picker-head" style={{ marginTop: 22 }}>
        <h3>Инвентарь</h3>
        <div className="row">
          <button className={`chip${filter === 'owned' ? ' active' : ''}`} onClick={() => setFilter('owned')}>
            В наличии
          </button>
          <button className={`chip${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}>
            История
          </button>
          {own && ownedSum > 0 && (
            <button className="btn btn-green btn-sm" onClick={() => sell('all')}>
              Продать всё за <Price value={ownedSum} size={12} />
            </button>
          )}
        </div>
      </div>
      {items.length === 0 && <div className="empty">Здесь пока пусто</div>}
      <div className="grid-items">
        {items.map((i) => (
          <ItemCard
            key={i.id}
            item={i.item}
            price={i.price}
            dim={i.status !== 'owned'}
            top={i.status !== 'owned' ? <span className="chance-badge">{STATUS_LABEL[i.status]}</span> : undefined}
            footer={
              own && i.status === 'owned' ? (
                <button className="btn btn-sm btn-green btn-block" onClick={() => sell([i.id])}>
                  Продать
                </button>
              ) : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}
