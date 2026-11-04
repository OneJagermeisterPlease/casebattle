'use client';

import { rollFloat } from '@casebattle/shared';
import { useState } from 'react';
import { BonusCards } from '@/components/BonusCards';
import { api } from '@/lib/api';
import { useAuth, type Me } from '@/lib/auth';
import { errText, useToast } from '@/lib/toast';

export default function FairPage() {
  const { me, setMe, openAuth } = useAuth();
  const toast = useToast();
  const [clientSeed, setClientSeed] = useState('');
  const [v, setV] = useState({ serverSeed: '', clientSeed: '', nonce: '1', cursor: '0' });
  const [roll, setRoll] = useState<number | null>(null);

  async function saveSeed() {
    try {
      setMe(await api<Me>('/me/client-seed', { body: { clientSeed } }));
      toast('Client seed обновлён', 'ok');
    } catch (e) {
      toast(errText(e), 'err');
    }
  }

  async function rotate() {
    try {
      setMe(await api<Me>('/me/rotate-seed', { body: {} }));
      toast('Server seed сменён, предыдущий раскрыт', 'ok');
    } catch (e) {
      toast(errText(e), 'err');
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setRoll(await rollFloat(v.serverSeed, v.clientSeed, Number(v.nonce), Number(v.cursor)));
  }

  return (
    <div>
      <div id="bonus">
        <BonusCards />
      </div>
      <h1 className="section-title">Честная игра (provably fair)</h1>
      <div className="upgrade-pickers" style={{ marginTop: 0 }}>
        <div className="panel">
          <h3>Как это работает</h3>
          <ol className="muted" style={{ paddingLeft: 18, lineHeight: 1.7 }}>
            <li>
              Сервер заранее показывает <b>хеш</b> своего секретного server seed — изменить его потом нельзя.
            </li>
            <li>Вы задаёте свой client seed. Каждое открытие увеличивает nonce на 1.</li>
            <li>
              Результат = HMAC-SHA256(server seed, «client seed:nonce:cursor»), первые 52 бита → число от 0 до 1. Cursor — номер
              предмета при открытии нескольких кейсов.
            </li>
            <li>Число от 0 до 1 выбирает предмет по шансам кейса (или сравнивается с шансом апгрейда).</li>
            <li>После смены server seed старый раскрывается — проверьте любое прошлое открытие формой справа.</li>
            <li>В батлах client seed = id батла, nonce = номер раунда, cursor = номер места; seed батла раскрывается после финала.</li>
          </ol>
        </div>
        <div className="panel">
          <h3>Ваши сиды</h3>
          {!me ? (
            <button className="btn btn-primary btn-block" onClick={openAuth}>
              Войдите, чтобы увидеть
            </button>
          ) : (
            <div className="form" style={{ marginTop: 12 }}>
              <label className="field">
                Хеш текущего server seed
                <input className="input" readOnly value={me.serverSeedHash} />
              </label>
              <label className="field">
                Client seed (сейчас: {me.clientSeed}) · nonce: {me.nonce}
                <div className="row">
                  <input className="input" style={{ flex: 1 }} placeholder="Новый client seed" value={clientSeed} onChange={(e) => setClientSeed(e.target.value)} />
                  <button className="btn" disabled={!clientSeed} onClick={saveSeed}>
                    Сохранить
                  </button>
                </div>
              </label>
              <button className="btn btn-violet" onClick={rotate}>
                Сменить server seed и раскрыть текущий
              </button>
              {me.prevServerSeed && (
                <label className="field">
                  Предыдущий server seed (хеш {me.prevServerSeedHash?.slice(0, 16)}…)
                  <input className="input" readOnly value={me.prevServerSeed} />
                </label>
              )}
            </div>
          )}
        </div>
      </div>
      <form className="panel form" style={{ marginTop: 16 }} onSubmit={verify}>
        <h3>Проверить результат</h3>
        <div className="upgrade-pickers" style={{ marginTop: 0 }}>
          <input className="input" placeholder="Server seed" value={v.serverSeed} onChange={(e) => setV({ ...v, serverSeed: e.target.value })} />
          <input className="input" placeholder="Client seed (или id батла)" value={v.clientSeed} onChange={(e) => setV({ ...v, clientSeed: e.target.value })} />
          <input className="input" placeholder="Nonce (или раунд)" value={v.nonce} onChange={(e) => setV({ ...v, nonce: e.target.value })} />
          <input className="input" placeholder="Cursor (или место)" value={v.cursor} onChange={(e) => setV({ ...v, cursor: e.target.value })} />
        </div>
        <button className="btn btn-primary">Посчитать</button>
        {roll !== null && (
          <div className="stat-line">
            <span className="muted">Бросок</span>
            <b>{roll.toFixed(10)}</b>
          </div>
        )}
      </form>
    </div>
  );
}
