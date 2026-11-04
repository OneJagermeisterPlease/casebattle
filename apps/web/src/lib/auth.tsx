'use client';

import type { MeDTO } from '@casebattle/shared';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, getToken, setToken } from './api';

export type Me = MeDTO & { isAdmin: boolean };

interface AuthState {
  me: Me | null;
  ready: boolean;
  setMe: (me: Me | null) => void;
  setBalance: (balance: number) => void;
  login: (token: string, me: Me) => void;
  logout: () => void;
  refresh: () => Promise<void>;
  authOpen: boolean;
  openAuth: () => void;
  closeAuth: () => void;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [ready, setReady] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const refresh = useCallback(async () => {
    if (!getToken()) return;
    try {
      setMe(await api<Me>('/me'));
    } catch {
      setToken(null);
      setMe(null);
    }
  }, []);

  useEffect(() => {
    void refresh().finally(() => setReady(true));
  }, [refresh]);

  const value: AuthState = {
    me,
    ready,
    setMe,
    setBalance: (balance) => setMe((m) => (m ? { ...m, balance } : m)),
    login: (token, user) => {
      setToken(token);
      setMe(user);
      setAuthOpen(false);
    },
    logout: () => {
      setToken(null);
      setMe(null);
    },
    refresh,
    authOpen,
    openAuth: () => setAuthOpen(true),
    closeAuth: () => setAuthOpen(false),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth outside AuthProvider');
  return ctx;
}
