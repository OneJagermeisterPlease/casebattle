'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth, type Me } from '@/lib/auth';
import { formatCoins } from '@/lib/format';
import { errText, useToast } from '@/lib/toast';
import { Icon } from './Icon';

function useCountdown(to: string | undefined) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const left = to ? Math.max(0, new Date(to).getTime() - now) : 0;
  const hh = String(Math.floor(left / 3_600_000)).padStart(2, '0');
  const mm = String(Math.floor((left / 60_000) % 60)).padStart(2, '0');
  const ss = String(Math.floor((left / 1000) % 60)).padStart(2, '0');
  return { left, text: `${hh}:${mm}:${ss}` };
}

export function BonusCards() {
  const { me, setMe, openAuth } = useAuth();
  const toast = useToast();
  const [code, setCode] = useState('');
  const [stats, setStats] = useState<{ opened: number; users: number; battles: number } | null>(null);
  const cd = useCountdown(me?.dailyAvailableAt);

  useEffect(() => {
    api<{ opened: number; users: number; battles: number }>('/stats').then(setStats).catch(() => undefined);
  }, []);

  async function claim() {
    if (!me) return openAuth();
    try {
      setMe(await api<Me>('/me/daily', { body: {} }));
      toast('Ежедневный бонус начислен!', 'ok');
    } catch (e) {
      toast(errText(e), 'err');
    }
  }

  async function promo(e: React.FormEvent) {
    e.preventDefault();
    if (!me) return openAuth();
    try {
      const before = me.balance;
      const next = await api<Me>('/me/promo', { body: { code } });
      setMe(next);
      setCode('');
      toast(`Промокод активирован: +${formatCoins(next.balance - before)}`, 'ok');
    } catch (err) {
      toast(errText(err), 'err');
    }
  }

  return (
    <div className="hero">
      <div className="hero-card bonus">
        <Icon name="gift" size={96} stroke={1} className="hero-card-icon" />
        <div>
          <h3>Ежедневный бонус</h3>
          <p>Бесплатные демо-монеты каждые 24 часа</p>
        </div>
        <div className="row">
          {me && cd.left > 0 ? (
            <>
              <span className="muted small">Осталось:</span>
              <span className="timer">{cd.text}</span>
            </>
          ) : (
            <button className="btn btn-violet" onClick={claim}>
              Забрать бонус
            </button>
          )}
        </div>
      </div>
      <form className="hero-card promo" onSubmit={promo}>
        <Icon name="ticket" size={96} stroke={1} className="hero-card-icon" />
        <div>
          <h3>Промокод</h3>
          <p>
            Попробуйте <b>DEMO</b> или <b>WELCOME</b>
          </p>
        </div>
        <div className="row">
          <input className="input" style={{ flex: 1 }} placeholder="Введите промокод" value={code} onChange={(e) => setCode(e.target.value)} />
          <button className="btn btn-primary" disabled={!code}>
            OK
          </button>
        </div>
      </form>
      <div className="hero-card stats">
        <Icon name="chart" size={96} stroke={1} className="hero-card-icon" />
        <div>
          <h3>Статистика</h3>
          <p>Открыто кейсов на сайте</p>
        </div>
        <div className="row">
          <span className="hero-big">{stats?.opened.toLocaleString('ru-RU') ?? '—'}</span>
          <span className="muted small">
            игроков: {stats?.users ?? '—'} · батлов: {stats?.battles ?? '—'}
          </span>
        </div>
      </div>
    </div>
  );
}
