'use client';

import type { BattleDTO } from '@casebattle/shared';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BattleRow } from '@/components/BattleRow';
import { Icon } from '@/components/Icon';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';

export default function BattlesPage() {
  const [battles, setBattles] = useState<BattleDTO[] | null>(null);

  useEffect(() => {
    api<BattleDTO[]>('/battles').then(setBattles).catch(() => setBattles([]));
    const s = getSocket();
    s.emit('lobby:watch');
    const onUpdate = (b: BattleDTO) =>
      setBattles((list) => {
        const rest = (list ?? []).filter((x) => x.id !== b.id);
        return b.status === 'cancelled' ? rest : [b, ...rest];
      });
    s.on('lobby:update', onUpdate);
    return () => {
      s.emit('lobby:unwatch');
      s.off('lobby:update', onUpdate);
    };
  }, []);

  const active = (battles ?? []).filter((b) => b.status === 'waiting' || b.status === 'running');
  const finished = (battles ?? []).filter((b) => b.status === 'finished');

  return (
    <div>
      <div className="row">
        <h1 className="section-title" style={{ margin: 0, flex: 1 }}>
          Кейс-батлы
        </h1>
        <Link href="/battles/create" className="btn btn-primary btn-lg">
          <Icon name="plus" size={18} stroke={2.2} /> Создать батл
        </Link>
      </div>
      <p className="muted">
        Открывайте кейсы против других игроков или ботов. Кто выбил больше — забирает всё. В безумном режиме побеждает меньший дроп.
      </p>
      {battles === null && <div className="loader">Загрузка…</div>}
      <h2 className="section-title">Активные · {active.length}</h2>
      {battles && active.length === 0 && <div className="empty">Активных батлов нет — создайте первый!</div>}
      <div className="battle-list">
        {active.map((b) => (
          <BattleRow key={b.id} b={b} />
        ))}
      </div>
      {finished.length > 0 && (
        <>
          <h2 className="section-title">Недавние</h2>
          <div className="battle-list">
            {finished.map((b) => (
              <BattleRow key={b.id} b={b} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
