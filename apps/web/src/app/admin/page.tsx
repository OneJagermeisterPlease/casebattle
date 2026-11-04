'use client';

import type { CaseDTO, InventoryItemDTO, ItemDTO } from '@casebattle/shared';
import { PATTERNS, RARITIES, RARITY_META, WEAPON_KINDS } from '@casebattle/shared';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Avatar } from '@/components/Avatar';
import { CaseArt } from '@/components/CaseArt';
import { Price } from '@/components/Coin';
import { Icon } from '@/components/Icon';
import { ItemArt } from '@/components/ItemArt';
import { ItemCard } from '@/components/ItemCard';
import { Modal } from '@/components/Modal';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatCoins, pct } from '@/lib/format';
import { errText, useToast } from '@/lib/toast';

type Tab = 'stats' | 'users' | 'cases' | 'items' | 'promos' | 'import';

const TABS: [Tab, string][] = [
  ['stats', 'Обзор'],
  ['users', 'Пользователи'],
  ['cases', 'Кейсы'],
  ['items', 'Предметы'],
  ['promos', 'Промокоды'],
  ['import', 'Импорт'],
];

const toCents = (s: string) => Math.round(Number(s.replace(',', '.')) * 100);

export default function AdminPage() {
  const { me, ready } = useAuth();
  const [tab, setTab] = useState<Tab>('stats');
  if (!ready) return <div className="loader">Загрузка…</div>;
  if (!me?.isAdmin) return <div className="empty">Доступ только для администраторов.</div>;
  return (
    <div>
      <h1 className="section-title" style={{ marginTop: 0 }}>
        Админ-панель
      </h1>
      <div className="tabs">
        {TABS.map(([k, label]) => (
          <button key={k} className={tab === k ? 'active' : ''} onClick={() => setTab(k)}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'stats' && <Stats />}
      {tab === 'users' && <Users />}
      {tab === 'cases' && <Cases />}
      {tab === 'items' && <Items />}
      {tab === 'promos' && <Promos />}
      {tab === 'import' && <Import />}
    </div>
  );
}

/* ---------------- Обзор ---------------- */
interface StatsDTO {
  users: number;
  usersDay: number;
  totalBalance: number;
  inventoryValue: number;
  opensDay: number;
  opens: number;
  battles: number;
  topCases: { name: string; opens: number }[];
}

function Stats() {
  const [s, setS] = useState<StatsDTO | null>(null);
  useEffect(() => {
    api<StatsDTO>('/admin/stats').then(setS).catch(() => undefined);
  }, []);
  if (!s) return <div className="loader">Загрузка…</div>;
  const kpis: [string, React.ReactNode][] = [
    ['Пользователей', s.users],
    ['Новых за 24ч', s.usersDay],
    ['Открытий всего', s.opens],
    ['Открытий за 24ч', s.opensDay],
    ['Батлов', s.battles],
    ['Монет на балансах', <Price key="b" value={s.totalBalance} size={18} />],
    ['Стоимость инвентарей', <Price key="i" value={s.inventoryValue} size={18} />],
  ];
  return (
    <>
      <div className="kpis">
        {kpis.map(([k, v]) => (
          <div key={k} className="panel kpi">
            <small>{k}</small>
            <b>{v}</b>
          </div>
        ))}
      </div>
      <div className="panel" style={{ marginTop: 16 }}>
        <h3>Популярные кейсы</h3>
        <table className="table">
          <tbody>
            {s.topCases.map((c) => (
              <tr key={c.name}>
                <td>{c.name}</td>
                <td>{c.opens} открытий</td>
              </tr>
            ))}
          </tbody>
        </table>
        {s.topCases.length === 0 && <div className="empty">Пока никто ничего не открывал</div>}
      </div>
    </>
  );
}

/* ---------------- Пользователи ---------------- */
interface AdminUser {
  id: string;
  nickname: string;
  isBot: boolean;
  balance: number;
  isAdmin: boolean;
  isBanned: boolean;
  createdAt: string;
  drops: number;
  battles: number;
  totalWon: number;
}

function Users() {
  const [search, setSearch] = useState('');
  const [bots, setBots] = useState(false);
  const [data, setData] = useState<{ users: AdminUser[]; total: number } | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(() => {
    const q = new URLSearchParams({ limit: '200' });
    if (search) q.set('search', search);
    if (bots) q.set('bots', 'true');
    api<{ users: AdminUser[]; total: number }>(`/admin/users?${q}`).then(setData).catch(() => undefined);
  }, [search, bots]);
  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div className="panel">
      <div className="picker-head">
        <h3>Пользователи · {data?.total ?? '…'}</h3>
        <input className="input" placeholder="Поиск по нику" value={search} onChange={(e) => setSearch(e.target.value)} />
        <label className="toggle">
          <input type="checkbox" checked={bots} onChange={(e) => setBots(e.target.checked)} />
          <i />
          Боты
        </label>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Игрок</th>
              <th>Баланс</th>
              <th>Выиграно</th>
              <th>Дропов</th>
              <th>Батлов</th>
              <th>Регистрация</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {data?.users.map((u) => (
              <tr key={u.id} className="clickable" onClick={() => setOpen(u.id)}>
                <td>
                  <span className="row">
                    <Avatar name={u.nickname} size={26} bot={u.isBot} />
                    {u.nickname}
                  </span>
                </td>
                <td>
                  <Price value={u.balance} />
                </td>
                <td>
                  <Price value={u.totalWon} />
                </td>
                <td>{u.drops}</td>
                <td>{u.battles}</td>
                <td className="muted">{new Date(u.createdAt).toLocaleString('ru-RU')}</td>
                <td>
                  {u.isAdmin && <span className="badge violet">админ</span>} {u.isBanned && <span className="badge red">бан</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {open && <UserDetails id={open} onClose={() => setOpen(null)} onChanged={load} />}
    </div>
  );
}

interface UserDetailsDTO {
  user: AdminUser & { nonce: number };
  transactions: { id: string; amount: number; reason: string; createdAt: string }[];
  inventory: InventoryItemDTO[];
}

function UserDetails({ id, onClose, onChanged }: { id: string; onClose: () => void; onChanged: () => void }) {
  const toast = useToast();
  const [d, setD] = useState<UserDetailsDTO | null>(null);
  const [amount, setAmount] = useState('');
  const [tab, setTab] = useState<'tx' | 'inv'>('tx');
  const load = useCallback(() => {
    api<UserDetailsDTO>(`/admin/users/${id}`).then(setD).catch((e) => toast(errText(e), 'err'));
  }, [id, toast]);
  useEffect(load, [load]);

  async function adjust(sign: 1 | -1) {
    try {
      await api(`/admin/users/${id}/balance`, { body: { amount: sign * toCents(amount) } });
      setAmount('');
      toast('Баланс изменён', 'ok');
      load();
      onChanged();
    } catch (e) {
      toast(errText(e), 'err');
    }
  }

  async function patch(data: { isBanned?: boolean; isAdmin?: boolean }) {
    try {
      await api(`/admin/users/${id}`, { method: 'PATCH', body: data });
      load();
      onChanged();
    } catch (e) {
      toast(errText(e), 'err');
    }
  }

  return (
    <Modal open onClose={onClose} title={d?.user.nickname ?? '…'} wide>
      {!d ? (
        <div className="loader">Загрузка…</div>
      ) : (
        <>
          <div className="row">
            <Avatar name={d.user.nickname} size={48} bot={d.user.isBot} />
            <div>
              <div>
                Баланс: <Price value={d.user.balance} size={16} />
              </div>
              <div className="muted small">
                Регистрация {new Date(d.user.createdAt).toLocaleString('ru-RU')} · nonce {d.user.nonce} ·{' '}
                <Link href={`/user/${d.user.id}`}>публичный профиль</Link>
              </div>
            </div>
            <div className="spacer" />
            <button className={`btn btn-sm ${d.user.isBanned ? 'btn-green' : 'btn-red'}`} onClick={() => patch({ isBanned: !d.user.isBanned })}>
              {d.user.isBanned ? 'Разбанить' : 'Забанить'}
            </button>
            <button className="btn btn-sm btn-violet" onClick={() => patch({ isAdmin: !d.user.isAdmin })}>
              {d.user.isAdmin ? 'Снять админа' : 'Сделать админом'}
            </button>
          </div>
          <div className="row" style={{ marginTop: 14 }}>
            <input className="input" style={{ maxWidth: 200 }} placeholder="Сумма, монет" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <button className="btn btn-green btn-sm" disabled={!toCents(amount)} onClick={() => adjust(1)}>
              + Начислить
            </button>
            <button className="btn btn-red btn-sm" disabled={!toCents(amount)} onClick={() => adjust(-1)}>
              − Списать
            </button>
          </div>
          <div className="tabs" style={{ marginTop: 14 }}>
            <button className={tab === 'tx' ? 'active' : ''} onClick={() => setTab('tx')}>
              Транзакции · {d.transactions.length}
            </button>
            <button className={tab === 'inv' ? 'active' : ''} onClick={() => setTab('inv')}>
              Предметы · {d.inventory.length}
            </button>
          </div>
          {tab === 'tx' && (
            <table className="table">
              <tbody>
                {d.transactions.map((t) => (
                  <tr key={t.id}>
                    <td className="muted">{new Date(t.createdAt).toLocaleString('ru-RU')}</td>
                    <td>{t.reason}</td>
                    <td className={t.amount >= 0 ? 'green' : 'red'}>
                      {t.amount >= 0 ? '+' : '−'}
                      {formatCoins(Math.abs(t.amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {tab === 'inv' && (
            <div className="grid-items small">
              {d.inventory.map((i) => (
                <ItemCard key={i.id} item={i.item} price={i.price} compact dim={i.status !== 'owned'} top={<span className="chance-badge">{i.source}</span>} />
              ))}
            </div>
          )}
        </>
      )}
    </Modal>
  );
}

/* ---------------- Кейсы ---------------- */
interface AdminCase extends CaseDTO {
  sortOrder: number;
  isActive: boolean;
  opens: number;
  rtp: number;
  items: { item: ItemDTO; weight: number; chance: number }[];
}

function Cases() {
  const [cases, setCases] = useState<AdminCase[] | null>(null);
  const [search, setSearch] = useState('');
  const [edit, setEdit] = useState<AdminCase | 'new' | null>(null);
  const load = useCallback(() => {
    api<AdminCase[]>('/admin/cases').then(setCases).catch(() => undefined);
  }, []);
  useEffect(load, [load]);
  const list = (cases ?? []).filter((c) => !search || `${c.name} ${c.category}`.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="panel">
      <div className="picker-head">
        <h3>Кейсы · {cases?.length ?? '…'}</h3>
        <input className="input" placeholder="Поиск" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn btn-primary btn-sm" onClick={() => setEdit('new')}>
          + Новый кейс
        </button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th />
              <th>Кейс</th>
              <th>Категория</th>
              <th>Цена</th>
              <th>Предметов</th>
              <th>RTP</th>
              <th>Открытий</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.id} className="clickable" onClick={() => setEdit(c)}>
                <td style={{ width: 60 }}>
                  <div style={{ width: 50, height: 40 }}>
                    <CaseArt c={c} />
                  </div>
                </td>
                <td>
                  <b>{c.name}</b>
                  <div className="muted small">{c.slug}</div>
                </td>
                <td>{c.category}</td>
                <td>
                  <Price value={c.price} />
                </td>
                <td>{c.items.length}</td>
                <td className={c.rtp > 1 ? 'red' : c.rtp < 0.8 ? 'muted' : 'green'}>{(c.rtp * 100).toFixed(1)}%</td>
                <td>{c.opens}</td>
                <td>{c.isActive ? <span className="badge green">вкл</span> : <span className="badge red">выкл</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {edit && (
        <CaseEditor
          c={edit === 'new' ? null : edit}
          onClose={() => setEdit(null)}
          onSaved={() => {
            setEdit(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function CaseEditor({ c, onClose, onSaved }: { c: AdminCase | null; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [f, setF] = useState({
    slug: c?.slug ?? '',
    name: c?.name ?? '',
    category: c?.category ?? 'Стартовые',
    sortOrder: c?.sortOrder ?? 0,
    price: c ? String(c.price / 100) : '',
    hue: c?.hue ?? 200,
    icon: c?.icon ?? 'star',
    imageUrl: c?.imageUrl ?? '',
    limitTotal: c?.limitTotal ? String(c.limitTotal) : '',
    isActive: c?.isActive ?? true,
  });
  const [rows, setRows] = useState<{ item: ItemDTO; weight: number }[]>(c?.items.map((i) => ({ item: i.item, weight: i.weight })) ?? []);
  const [q, setQ] = useState('');
  const [found, setFound] = useState<ItemDTO[]>([]);

  useEffect(() => {
    if (!q) return setFound([]);
    const t = setTimeout(() => {
      api<{ items: ItemDTO[] }>(`/items?search=${encodeURIComponent(q)}&limit=24&sort=desc`).then((r) => setFound(r.items));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const totalW = rows.reduce((s, r) => s + r.weight, 0) || 1;
  const ev = rows.reduce((s, r) => s + (r.weight / totalW) * r.item.price, 0);
  const price = toCents(f.price || '0');

  async function save() {
    try {
      const body = {
        slug: f.slug,
        name: f.name,
        category: f.category,
        sortOrder: Number(f.sortOrder),
        price,
        hue: Number(f.hue),
        icon: f.icon,
        imageUrl: f.imageUrl || null,
        limitTotal: f.limitTotal ? Number(f.limitTotal) : null,
        isActive: f.isActive,
        items: rows.map((r) => ({ itemId: r.item.id, weight: Math.max(1, Math.round(r.weight)) })),
      };
      await api(c ? `/admin/cases/${c.id}` : '/admin/cases', { method: c ? 'PUT' : 'POST', body });
      toast('Кейс сохранён', 'ok');
      onSaved();
    } catch (e) {
      toast(errText(e), 'err');
    }
  }

  const field = (label: string, key: keyof typeof f, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="field">
      {label}
      <input className="input" value={String(f[key])} onChange={(e) => setF({ ...f, [key]: e.target.value })} {...props} />
    </label>
  );

  return (
    <Modal open onClose={onClose} title={c ? `Кейс «${c.name}»` : 'Новый кейс'} wide>
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <div style={{ width: 160 }}>
          <CaseArt c={{ hue: Number(f.hue), icon: f.icon, imageUrl: f.imageUrl || null, name: f.name }} />
        </div>
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
          {field('Название', 'name')}
          {field('Slug (URL)', 'slug', { disabled: !!c })}
          {field('Категория', 'category')}
          {field('Цена, монет', 'price')}
          {field('Порядок', 'sortOrder', { type: 'number' })}
          {field('Цвет (0–359)', 'hue', { type: 'number' })}
          {field('Иконка', 'icon')}
          {field('Картинка (URL)', 'imageUrl')}
          {field('Лимит (пусто — без лимита)', 'limitTotal')}
          <label className="toggle" style={{ alignSelf: 'end' }}>
            <input type="checkbox" checked={f.isActive} onChange={(e) => setF({ ...f, isActive: e.target.checked })} />
            <i />
            Активен
          </label>
        </div>
      </div>
      <div className="stat-line" style={{ marginTop: 12 }}>
        <span>
          Матожидание: <Price value={Math.round(ev)} />
        </span>
        <span className={price && ev / price > 1 ? 'red' : 'green'}>RTP {price ? ((ev / price) * 100).toFixed(1) : '—'}%</span>
      </div>
      <table className="table" style={{ marginTop: 8 }}>
        <thead>
          <tr>
            <th />
            <th>Предмет</th>
            <th>Цена</th>
            <th>Вес</th>
            <th>Шанс</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {[...rows]
            .sort((a, b) => b.item.price - a.item.price)
            .map((r) => (
              <tr key={r.item.id}>
                <td style={{ width: 70 }}>
                  <ItemArt item={r.item} className="admin-thumb" />
                </td>
                <td>
                  <span style={{ color: RARITY_META[r.item.rarity].color }}>{r.item.weapon}</span> | {r.item.finish}
                </td>
                <td>
                  <Price value={r.item.price} />
                </td>
                <td>
                  <input
                    className="input"
                    style={{ width: 110 }}
                    type="number"
                    min={1}
                    value={r.weight}
                    onChange={(e) => setRows(rows.map((x) => (x.item.id === r.item.id ? { ...x, weight: Number(e.target.value) } : x)))}
                  />
                </td>
                <td>{pct(r.weight / totalW)}</td>
                <td>
                  <button className="icon-btn" onClick={() => setRows(rows.filter((x) => x.item.id !== r.item.id))}>
                    <Icon name="close" size={16} />
                  </button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
      <div className="picker-head" style={{ marginTop: 12 }}>
        <h3>Добавить предмет</h3>
        <input className="input" placeholder="Поиск по названию (например, AK-47 или Fade)" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="grid-items small">
        {found.map((it) => (
          <ItemCard
            key={it.id}
            item={it}
            compact
            dim={rows.some((r) => r.item.id === it.id)}
            onClick={() => !rows.some((r) => r.item.id === it.id) && setRows([...rows, { item: it, weight: 1000 }])}
          />
        ))}
      </div>
      <div className="win-actions" style={{ marginTop: 16 }}>
        <button className="btn btn-primary" onClick={save} disabled={rows.length < 2 || !f.name || !f.slug || !price}>
          Сохранить
        </button>
        <button className="btn" onClick={onClose}>
          Отмена
        </button>
      </div>
    </Modal>
  );
}

/* ---------------- Предметы ---------------- */
function Items() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [data, setData] = useState<{ items: ItemDTO[]; total: number } | null>(null);
  const [edit, setEdit] = useState<ItemDTO | 'new' | null>(null);
  const load = useCallback(() => {
    const q = new URLSearchParams({ limit: '120', sort: 'desc' });
    if (search) q.set('search', search);
    api<{ items: ItemDTO[]; total: number }>(`/items?${q}`).then(setData).catch(() => undefined);
  }, [search]);
  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div className="panel">
      <div className="picker-head">
        <h3>Предметы · {data?.total ?? '…'}</h3>
        <input className="input" placeholder="Поиск" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn btn-primary btn-sm" onClick={() => setEdit('new')}>
          + Новый предмет
        </button>
      </div>
      <div className="grid-items small">
        {data?.items.map((it) => <ItemCard key={it.id} item={it} compact onClick={() => setEdit(it)} />)}
      </div>
      {edit && (
        <ItemEditor
          item={edit === 'new' ? null : edit}
          onClose={() => setEdit(null)}
          onSaved={() => {
            setEdit(null);
            load();
            toast('Предмет сохранён', 'ok');
          }}
        />
      )}
    </div>
  );
}

function ItemEditor({ item, onClose, onSaved }: { item: ItemDTO | null; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [f, setF] = useState({
    weapon: item?.weapon ?? '',
    finish: item?.finish ?? '',
    kind: item?.kind ?? 'rifle',
    rarity: item?.rarity ?? 'milspec',
    price: item ? String(item.price / 100) : '',
    hue: item?.hue ?? 200,
    pattern: item?.pattern ?? 'solid',
    imageUrl: item?.imageUrl ?? '',
  });
  const preview: ItemDTO = { id: item?.id ?? 'preview', ...f, price: toCents(f.price || '0'), hue: Number(f.hue), imageUrl: f.imageUrl || null };

  async function save() {
    try {
      const body = { ...f, price: toCents(f.price), hue: Number(f.hue), imageUrl: f.imageUrl || null };
      await api(item ? `/admin/items/${item.id}` : '/admin/items', { method: item ? 'PUT' : 'POST', body });
      onSaved();
    } catch (e) {
      toast(errText(e), 'err');
    }
  }

  const select = (label: string, key: 'kind' | 'rarity' | 'pattern', options: readonly string[]) => (
    <label className="field">
      {label}
      <select className="select" value={f[key]} onChange={(e) => setF({ ...f, [key]: e.target.value })}>
        {options.map((o) => (
          <option key={o} value={o}>
            {key === 'rarity' ? RARITY_META[o as keyof typeof RARITY_META].label : o}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <Modal open onClose={onClose} title={item ? 'Редактирование предмета' : 'Новый предмет'} wide>
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <div style={{ width: 200 }}>
          <ItemCard item={preview} />
        </div>
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
          <label className="field">
            Оружие
            <input className="input" value={f.weapon} onChange={(e) => setF({ ...f, weapon: e.target.value })} />
          </label>
          <label className="field">
            Раскраска
            <input className="input" value={f.finish} onChange={(e) => setF({ ...f, finish: e.target.value })} />
          </label>
          <label className="field">
            Цена, монет
            <input className="input" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} />
          </label>
          {select('Тип', 'kind', WEAPON_KINDS)}
          {select('Редкость', 'rarity', RARITIES)}
          {select('Узор (без картинки)', 'pattern', PATTERNS)}
          <label className="field">
            Цвет (0–359)
            <input className="input" type="number" value={f.hue} onChange={(e) => setF({ ...f, hue: Number(e.target.value) })} />
          </label>
          <label className="field" style={{ gridColumn: '1 / -1' }}>
            Картинка (URL)
            <input className="input" value={f.imageUrl} onChange={(e) => setF({ ...f, imageUrl: e.target.value })} />
          </label>
        </div>
      </div>
      <div className="win-actions" style={{ marginTop: 16 }}>
        <button className="btn btn-primary" onClick={save} disabled={!f.weapon || !f.finish || !toCents(f.price || '0')}>
          Сохранить
        </button>
        <button className="btn" onClick={onClose}>
          Отмена
        </button>
      </div>
    </Modal>
  );
}

/* ---------------- Промокоды ---------------- */
interface Promo {
  code: string;
  amount: number;
  maxUses: number | null;
  uses: number;
}

function Promos() {
  const toast = useToast();
  const [list, setList] = useState<Promo[]>([]);
  const [f, setF] = useState({ code: '', amount: '', maxUses: '' });
  const load = useCallback(() => {
    api<Promo[]>('/admin/promos').then(setList).catch(() => undefined);
  }, []);
  useEffect(load, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api('/admin/promos', { body: { code: f.code, amount: toCents(f.amount), maxUses: f.maxUses ? Number(f.maxUses) : null } });
      setF({ code: '', amount: '', maxUses: '' });
      load();
    } catch (err) {
      toast(errText(err), 'err');
    }
  }

  async function remove(code: string) {
    if (!confirm(`Удалить промокод ${code}?`)) return;
    try {
      await api(`/admin/promos/${code}`, { method: 'DELETE' });
      load();
    } catch (err) {
      toast(errText(err), 'err');
    }
  }

  return (
    <div className="panel">
      <form className="row" onSubmit={create}>
        <input className="input" style={{ maxWidth: 200 }} placeholder="КОД" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} />
        <input className="input" style={{ maxWidth: 160 }} placeholder="Монет" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} />
        <input className="input" style={{ maxWidth: 200 }} placeholder="Лимит активаций" value={f.maxUses} onChange={(e) => setF({ ...f, maxUses: e.target.value })} />
        <button className="btn btn-primary" disabled={!f.code || !toCents(f.amount || '0')}>
          Создать / обновить
        </button>
      </form>
      <table className="table" style={{ marginTop: 14 }}>
        <thead>
          <tr>
            <th>Код</th>
            <th>Сумма</th>
            <th>Активаций</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {list.map((p) => (
            <tr key={p.code}>
              <td>
                <b>{p.code}</b>
              </td>
              <td>
                <Price value={p.amount} />
              </td>
              <td>
                {p.uses} / {p.maxUses ?? '∞'}
              </td>
              <td>
                <button className="btn btn-sm btn-red" onClick={() => remove(p.code)}>
                  Удалить
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- Импорт ---------------- */
const IMPORT_EXAMPLE = `{
  "items": [
    { "id": "my-item-1", "weapon": "AK-47", "finish": "Моя раскраска", "kind": "rifle", "rarity": "covert", "price": 150000, "imageUrl": null }
  ],
  "cases": [
    { "slug": "my-case", "name": "Мой кейс", "category": "Свои", "price": 9900, "items": [ { "itemId": "my-item-1", "weight": 10 }, { "itemId": "…", "weight": 990 } ] }
  ]
}`;

function Import() {
  const toast = useToast();
  const [text, setText] = useState('');
  async function run() {
    try {
      const res = await api<{ items: number; cases: number }>('/admin/import', { body: JSON.parse(text) });
      toast(`Импортировано: предметов ${res.items}, кейсов ${res.cases}`, 'ok');
    } catch (e) {
      toast(e instanceof SyntaxError ? 'Невалидный JSON' : errText(e), 'err');
    }
  }
  return (
    <div className="panel form">
      <p className="muted">
        Массовая загрузка предметов и кейсов. Цены — в сотых долях монеты (100 = 1 монета). Существующие id/slug обновляются.
      </p>
      <textarea className="input" rows={16} placeholder={IMPORT_EXAMPLE} value={text} onChange={(e) => setText(e.target.value)} style={{ fontFamily: 'monospace' }} />
      <button className="btn btn-primary" disabled={!text} onClick={run}>
        Импортировать
      </button>
    </div>
  );
}
