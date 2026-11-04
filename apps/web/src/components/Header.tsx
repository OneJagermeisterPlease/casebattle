'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { BRAND } from '@/lib/brand';
import { getSocket } from '@/lib/socket';
import { Avatar } from './Avatar';
import { Price } from './Coin';
import { Icon, type IconName } from './Icon';
import { SoundToggle } from './SoundToggle';

const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: '/', label: 'Кейсы', icon: 'cases' },
  { href: '/battles', label: 'Батлы', icon: 'battles' },
  { href: '/upgrade', label: 'Апгрейд', icon: 'upgrade' },
  { href: '/contract', label: 'Контракты', icon: 'contract' },
  { href: '/top', label: 'Топ', icon: 'top' },
  { href: '/fair', label: 'Честность', icon: 'fair' },
];

export function Header() {
  const { me, ready, openAuth, logout } = useAuth();
  const path = usePathname();
  const [online, setOnline] = useState<number | null>(null);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    const s = getSocket();
    const onStats = (d: { online: number }) => setOnline(d.online);
    s.on('stats', onStats);
    return () => {
      s.off('stats', onStats);
    };
  }, []);

  return (
    <header className="header">
      <Link href="/" className="logo">
        <span className="logo-mark" aria-hidden>
          <svg viewBox="0 0 32 32" width="30" height="30">
            <defs>
              <linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#ffd27a" />
                <stop offset=".55" stopColor="#ff9d1c" />
                <stop offset="1" stopColor="#b9530a" />
              </linearGradient>
            </defs>
            <path d="M16 2.5 28 9.2v13.6L16 29.5 4 22.8V9.2Z" fill="none" stroke="url(#logo-g)" strokeWidth="2" strokeLinejoin="round" />
            <path d="M16 8.5 22.5 12v8L16 23.5 9.5 20v-8Z" fill="url(#logo-g)" opacity=".9" />
            <path d="M16 8.5V16l6.5-4M16 16l-6.5-4" fill="none" stroke="#1a1006" strokeWidth="1.2" strokeLinejoin="round" opacity=".55" />
          </svg>
        </span>
        <span className="logo-text">
          <span>{BRAND.name}</span>
          <b>{BRAND.accent}</b>
        </span>
        <small>{BRAND.tagline}</small>
      </Link>
      <nav className="nav">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className={(n.href === '/' ? path === '/' : path.startsWith(n.href)) ? 'active' : ''}>
            <Icon name={n.icon} className="nav-icon" size={20} />
            <span>{n.label}</span>
          </Link>
        ))}
        {me?.isAdmin && (
          <Link href="/admin" className={path.startsWith('/admin') ? 'active' : ''}>
            <Icon name="admin" className="nav-icon" size={20} />
            <span>Админка</span>
          </Link>
        )}
      </nav>
      <div className="header-right">
        {online !== null && (
          <span className="online">
            <i /> {online} онлайн
          </span>
        )}
        <SoundToggle />
        {ready && !me && (
          <button className="btn btn-primary" onClick={openAuth}>
            Войти
          </button>
        )}
        {me && (
          <>
            <Link href="/fair#bonus" className="balance" title="Баланс демо-монет">
              <Price value={me.balance} size={18} />
              <span className="balance-plus">
                <Icon name="plus" size={14} stroke={2.4} />
              </span>
            </Link>
            <div className="user-menu">
              <button className="user-btn" onClick={() => setMenu((m) => !m)}>
                <Avatar name={me.nickname} size={34} />
              </button>
              {menu && (
                <div className="dropdown" onMouseLeave={() => setMenu(false)}>
                  <div className="dropdown-head">{me.nickname}</div>
                  <Link href={`/user/${me.id}`} onClick={() => setMenu(false)}>
                    <Icon name="bag" size={16} />
                    Профиль и инвентарь
                  </Link>
                  <Link href="/fair" onClick={() => setMenu(false)}>
                    <Icon name="gift" size={16} />
                    Бонусы и честность
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setMenu(false);
                    }}
                  >
                    <Icon name="logout" size={16} />
                    Выйти
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
