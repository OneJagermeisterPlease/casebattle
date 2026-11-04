'use client';

import type { PublicUserDTO } from '@casebattle/shared';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Avatar } from '@/components/Avatar';
import { Price } from '@/components/Coin';
import { api } from '@/lib/api';

type Row = { place: number; user: PublicUserDTO; totalWon: number; drops: number };

export default function TopPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  useEffect(() => {
    api<Row[]>('/leaderboard').then(setRows).catch(() => setRows([]));
  }, []);
  return (
    <div>
      <h1 className="section-title" style={{ marginTop: 0 }}>
        Топ игроков
      </h1>
      <div className="panel">
        {rows === null && <div className="loader">Загрузка…</div>}
        {rows?.length === 0 && <div className="empty">Пока никто ничего не выиграл</div>}
        {rows && rows.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Игрок</th>
                <th>Предметов</th>
                <th>Выиграно</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.user.id}>
                  <td>
                    <span className={`place${r.place <= 3 ? ` place-${r.place}` : ''}`}>{r.place}</span>
                  </td>
                  <td>
                    <Link href={`/user/${r.user.id}`} className="row">
                      <Avatar name={r.user.nickname} size={28} bot={r.user.isBot} />
                      {r.user.nickname}
                    </Link>
                  </td>
                  <td>{r.drops}</td>
                  <td>
                    <Price value={r.totalWon} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
