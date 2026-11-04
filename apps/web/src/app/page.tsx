'use client';

import type { CaseDTO } from '@casebattle/shared';
import { useEffect, useMemo, useState } from 'react';
import { BonusCards } from '@/components/BonusCards';
import { CaseCard } from '@/components/CaseCard';
import { api } from '@/lib/api';

type Sort = 'default' | 'asc' | 'desc';

export default function HomePage() {
  const [cases, setCases] = useState<CaseDTO[] | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>('default');

  useEffect(() => {
    api<CaseDTO[]>('/cases').then(setCases).catch(() => setCases([]));
  }, []);

  const categories = useMemo(() => [...new Set((cases ?? []).map((c) => c.category))], [cases]);
  const groups = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = (cases ?? []).filter((c) => (!q || c.name.toLowerCase().includes(q)) && (!category || c.category === category));
    if (sort !== 'default') list.sort((a, b) => (sort === 'asc' ? a.price - b.price : b.price - a.price));
    const map = new Map<string, CaseDTO[]>();
    for (const c of list) map.set(c.category, [...(map.get(c.category) ?? []), c]);
    return [...map.entries()];
  }, [cases, search, category, sort]);

  return (
    <div>
      <BonusCards />
      <div className="filter-bar">
        <input className="input" placeholder="Быстрый поиск кейса…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="select" style={{ width: 'auto' }} value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
          <option value="default">По умолчанию</option>
          <option value="asc">Сначала дешёвые</option>
          <option value="desc">Сначала дорогие</option>
        </select>
        <div className="row">
          <button className={`chip${!category ? ' active' : ''}`} onClick={() => setCategory(null)}>
            Все
          </button>
          {categories.map((c) => (
            <button key={c} className={`chip${category === c ? ' active' : ''}`} onClick={() => setCategory(c === category ? null : c)}>
              {c}
            </button>
          ))}
        </div>
      </div>
      {cases === null && <div className="loader">Загрузка кейсов…</div>}
      {groups.map(([cat, list]) => (
        <section key={cat}>
          <h2 className="section-title">{cat}</h2>
          <div className="cases-grid">
            {list.map((c) => (
              <CaseCard key={c.id} c={c} />
            ))}
          </div>
        </section>
      ))}
      {cases !== null && groups.length === 0 && <div className="empty">Ничего не найдено</div>}
    </div>
  );
}
