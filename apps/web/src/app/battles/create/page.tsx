'use client';

import type { BattleDTO, BattleMode, CaseDTO } from '@casebattle/shared';
import { BATTLE_SLOTS } from '@casebattle/shared';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { CaseArt } from '@/components/CaseArt';
import { Price } from '@/components/Coin';
import { Icon } from '@/components/Icon';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { errText, useToast } from '@/lib/toast';

const MODES: BattleMode[] = ['1v1', '1v1v1', '1v1v1v1', '2v2'];
const MAX_ROUNDS = 25;

export default function CreateBattlePage() {
  const { me, openAuth, setBalance } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [cases, setCases] = useState<CaseDTO[]>([]);
  const [mode, setMode] = useState<BattleMode>('1v1');
  const [crazy, setCrazy] = useState(false);
  const [rounds, setRounds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<CaseDTO[]>('/cases')
      .then((list) => setCases(list.filter((c) => c.limitTotal === null)))
      .catch(() => undefined);
  }, []);

  const bySlug = useMemo(() => new Map(cases.map((c) => [c.slug, c])), [cases]);
  const cost = rounds.reduce((s, slug) => s + (bySlug.get(slug)?.price ?? 0), 0);
  const filtered = cases.filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()));
  const qty = (slug: string) => rounds.filter((r) => r === slug).length;

  async function create() {
    if (!me) return openAuth();
    setBusy(true);
    try {
      const b = await api<BattleDTO>('/battles', { body: { mode, caseSlugs: rounds, crazy } });
      setBalance(me.balance - cost);
      router.push(`/battles/${b.id}`);
    } catch (e) {
      toast(errText(e), 'err');
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="section-title" style={{ marginTop: 0 }}>
        Создание батла
      </h1>
      <div className="panel" style={{ display: 'grid', gap: 14 }}>
        <div className="row">
          <b style={{ width: 120 }}>Режим</b>
          {MODES.map((m) => (
            <button key={m} className={`chip${mode === m ? ' active' : ''}`} onClick={() => setMode(m)}>
              <Icon name="users" size={15} /> {m} · {BATTLE_SLOTS[m]} игр.
            </button>
          ))}
        </div>
        <div className="row">
          <b style={{ width: 120 }}>Безумный</b>
          <label className="toggle">
            <input type="checkbox" checked={crazy} onChange={(e) => setCrazy(e.target.checked)} />
            <i />
            <Icon name="reverse" size={16} className="toggle-icon" />
            <span className="muted small">побеждает тот, у кого дроп дешевле</span>
          </label>
        </div>
        <div className="row">
          <b style={{ width: 120 }}>Раунды · {rounds.length}</b>
          <div className="battle-cases" style={{ flex: 1, flexWrap: 'wrap' }}>
            {rounds.map((slug, i) => (
              <button
                key={i}
                title="Убрать"
                style={{ background: 'none', border: 0, padding: 0 }}
                onClick={() => setRounds((r) => r.filter((_, k) => k !== i))}
              >
                <CaseArt c={bySlug.get(slug)!} />
              </button>
            ))}
            {rounds.length === 0 && <span className="muted">Добавьте кейсы из списка ниже</span>}
          </div>
          {rounds.length > 0 && (
            <button className="btn btn-sm" onClick={() => setRounds([])}>
              Очистить
            </button>
          )}
        </div>
        <div className="row">
          <span>
            Стоимость входа: <Price value={cost} size={16} />
          </span>
          <div className="spacer" />
          <button className="btn btn-primary btn-lg" disabled={rounds.length === 0 || busy} onClick={create}>
            Создать батл
          </button>
        </div>
      </div>

      <div className="picker-head" style={{ marginTop: 20 }}>
        <h3>Выберите кейсы (до {MAX_ROUNDS})</h3>
        <input className="input" style={{ maxWidth: 300 }} placeholder="Поиск" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="case-picker">
        {filtered.map((c) => (
          <div key={c.id} className="case-pick" onClick={() => rounds.length < MAX_ROUNDS && setRounds((r) => [...r, c.slug])}>
            {qty(c.slug) > 0 && <span className="qty">x{qty(c.slug)}</span>}
            <CaseArt c={c} />
            <div className="case-pick-name">{c.name}</div>
            <Price value={c.price} size={12} />
          </div>
        ))}
      </div>
    </div>
  );
}
