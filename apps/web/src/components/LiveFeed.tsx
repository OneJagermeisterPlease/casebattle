'use client';

import type { DropDTO } from '@casebattle/shared';
import { RARITY_META } from '@casebattle/shared';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { shortName } from '@/lib/format';
import { getSocket } from '@/lib/socket';
import { ItemArt } from './ItemArt';

const SOURCE_LABEL: Record<DropDTO['source'], string> = {
  case: '',
  upgrade: 'Апгрейд',
  contract: 'Контракт',
  battle: 'Батл',
};

export function LiveFeed() {
  const [mode, setMode] = useState<'all' | 'top'>('all');
  const [drops, setDrops] = useState<DropDTO[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  /** Дропы, пришедшие по сокету, — только они анимируются «въездом». */
  const fresh = useRef(new Set<string>());

  useEffect(() => {
    api<DropDTO[]>(`/feed?limit=30${mode === 'top' ? '&top=true' : ''}`).then(setDrops).catch(() => undefined);
    api<{ totalDrops: number }>('/stats').then((s) => setTotal(s.totalDrops)).catch(() => undefined);
  }, [mode]);

  useEffect(() => {
    const s = getSocket();
    const onDrop = (d: DropDTO) => {
      setTotal((t) => (t ?? 0) + 1);
      if (mode === 'top' && d.item.price < 100000) return;
      fresh.current.add(d.id);
      if (fresh.current.size > 60) fresh.current = new Set([...fresh.current].slice(-30));
      setDrops((list) => [d, ...list.filter((x) => x.id !== d.id)].slice(0, 30));
    };
    const onStats = (st: { totalDrops: number }) => setTotal(st.totalDrops);
    s.on('drop', onDrop);
    s.on('stats', onStats);
    return () => {
      s.off('drop', onDrop);
      s.off('stats', onStats);
    };
  }, [mode]);

  return (
    <aside className="feed">
      <div className="feed-head">
        <div className="feed-counter">
          <small>Выпало предметов</small>
          <b>{total?.toLocaleString('ru-RU') ?? '—'}</b>
        </div>
        <div className="feed-tabs">
          <button className={mode === 'all' ? 'active' : ''} onClick={() => setMode('all')}>
            Все
          </button>
          <button className={mode === 'top' ? 'active' : ''} onClick={() => setMode('top')}>
            Топ
          </button>
        </div>
      </div>
      <div className="feed-list">
        {drops.map((d) => (
          <Link
            key={d.id}
            href={d.caseSlug ? `/case/${d.caseSlug}` : `/user/${d.user.id}`}
            className={`feed-item${fresh.current.has(d.id) ? ' fresh' : ''} r-${d.item.rarity}`}
            style={{ ['--rarity' as string]: RARITY_META[d.item.rarity].color }}
          >
            <span className="feed-flash" aria-hidden />
            <ItemArt item={d.item} />
            <div className="feed-info">
              <span className="feed-weapon">{shortName(d.item.weapon)}</span>
              <span className="feed-finish">{d.item.finish}</span>
            </div>
            <div className="feed-hover">
              <b>{d.user.nickname}</b>
              <span>{d.caseName ?? SOURCE_LABEL[d.source]}</span>
            </div>
          </Link>
        ))}
        {drops.length === 0 && <p className="muted small center">Пока пусто — откройте первый кейс!</p>}
      </div>
    </aside>
  );
}
