'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth, type Me } from '@/lib/auth';
import { errText, useToast } from '@/lib/toast';
import { Modal } from './Modal';

type AuthResponse = { token: string; user: Me };

export function AuthModal() {
  const { authOpen, closeAuth, login } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [tg, setTg] = useState<{ enabled: boolean; botUsername: string | null } | null>(null);
  const [tgWaiting, setTgWaiting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (authOpen && !tg) api<{ enabled: boolean; botUsername: string | null }>('/auth/telegram/config').then(setTg).catch(() => undefined);
    if (!authOpen && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
      setTgWaiting(false);
    }
  }, [authOpen, tg]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api<AuthResponse>(`/auth/${tab}`, { body: { nickname, password } });
      login(res.token, res.user);
      toast(tab === 'register' ? 'Аккаунт создан — на счёт начислены демо-монеты' : `С возвращением, ${res.user.nickname}!`, 'ok');
    } catch (err) {
      toast(errText(err), 'err');
    } finally {
      setBusy(false);
    }
  }

  async function guest() {
    setBusy(true);
    try {
      const res = await api<AuthResponse>('/auth/guest', { body: {} });
      login(res.token, res.user);
      toast(`Вы играете как ${res.user.nickname}`, 'ok');
    } catch (err) {
      toast(errText(err), 'err');
    } finally {
      setBusy(false);
    }
  }

  async function telegram() {
    try {
      const { token, url } = await api<{ token: string; url: string }>('/auth/telegram/start', { body: {} });
      window.open(url, '_blank', 'noopener');
      setTgWaiting(true);
      pollRef.current = setInterval(async () => {
        try {
          const res = await api<{ status: string } & Partial<AuthResponse>>(`/auth/telegram/status?token=${token}`);
          if (res.status === 'pending') return;
          clearInterval(pollRef.current!);
          pollRef.current = null;
          setTgWaiting(false);
          if (res.status === 'done' && res.token && res.user) {
            login(res.token, res.user);
            toast(`Вы вошли через Telegram как ${res.user.nickname}`, 'ok');
          } else toast('Ссылка устарела, попробуйте ещё раз', 'err');
        } catch (err) {
          clearInterval(pollRef.current!);
          pollRef.current = null;
          setTgWaiting(false);
          toast(errText(err), 'err');
        }
      }, 1500);
    } catch (err) {
      toast(errText(err), 'err');
    }
  }

  return (
    <Modal open={authOpen} onClose={closeAuth} title="Вход">
      {tg?.enabled && (
        <>
          <button className="btn btn-tg btn-block" onClick={telegram} disabled={tgWaiting}>
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
              <path fill="currentColor" d="M21.9 4.3 18.7 19.5c-.2 1-.9 1.3-1.8.8l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.3-5 9.1-8.2c.4-.4-.1-.6-.6-.2L6.2 13.2 1.4 11.7c-1-.3-1-1 .2-1.5L20.6 2.9c.9-.3 1.6.2 1.3 1.4Z" />
            </svg>
            {tgWaiting ? 'Ждём подтверждения в Telegram…' : 'Войти через Telegram'}
          </button>
          {tgWaiting && <p className="muted small center">Нажмите «Start» в боте @{tg.botUsername} — вкладка войдёт сама.</p>}
          <div className="divider">или</div>
        </>
      )}
      <div className="tabs">
        <button className={tab === 'login' ? 'active' : ''} onClick={() => setTab('login')}>
          Вход
        </button>
        <button className={tab === 'register' ? 'active' : ''} onClick={() => setTab('register')}>
          Регистрация
        </button>
      </div>
      <form onSubmit={submit} className="form">
        <input className="input" placeholder="Никнейм" value={nickname} onChange={(e) => setNickname(e.target.value)} autoComplete="username" />
        <input
          className="input"
          placeholder="Пароль"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
        />
        <button className="btn btn-primary btn-block" disabled={busy}>
          {tab === 'login' ? 'Войти' : 'Создать аккаунт'}
        </button>
      </form>
      <button className="btn btn-ghost btn-block" onClick={guest} disabled={busy}>
        Играть как гость
      </button>
      <p className="muted small center">Все монеты выдуманные: их нельзя купить, вывести или обменять на деньги.</p>
    </Modal>
  );
}
