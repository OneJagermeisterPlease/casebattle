'use client';

import type { BattleDTO, CaseDetailDTO, CaseItemDTO, ItemDTO } from '@casebattle/shared';
import { BATTLE_SLOTS } from '@casebattle/shared';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Avatar } from '@/components/Avatar';
import { STATUS_LABEL } from '@/components/BattleRow';
import { Burst } from '@/components/Burst';
import { CaseArt } from '@/components/CaseArt';
import { rarityColor } from '@/components/ItemArt';
import { Price } from '@/components/Coin';
import { Icon } from '@/components/Icon';
import { ItemCard } from '@/components/ItemCard';
import { Roulette } from '@/components/Roulette';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { lose as loseSound, win as winSound } from '@/lib/sfx';
import { getSocket } from '@/lib/socket';
import { errText, useToast } from '@/lib/toast';

type Event = { battle: BattleDTO; round?: number; startsInMs?: number };

export default function BattlePage() {
  const { id } = useParams<{ id: string }>();
  const { me, openAuth, setBalance, refresh } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [battle, setBattle] = useState<BattleDTO | null>(null);
  const [missing, setMissing] = useState(false);
  /** Сколько раундов уже показано игроку (остальные ещё «крутятся» или не наступили). */
  const [revealed, setRevealed] = useState(0);
  const [spinning, setSpinning] = useState<number | null>(null);
  const [spinId, setSpinId] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const pools = useRef(new Map<string, CaseItemDTO[]>());
  const [, force] = useState(0);
  /** Батл досмотрен вживую (а не открыт уже завершённым) — только тогда играем финальный звук. */
  const sawLive = useRef(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const inviteInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = inviteInput.current;
    if (!inviteUrl || !el) return;
    el.focus();
    el.select();
  }, [inviteUrl]);

  /** Копируем ссылку на батл; без Clipboard API (например, http) — показываем поле с выделенной ссылкой. */
  const invite = useCallback(async () => {
    const url = window.location.href;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('no clipboard');
      await navigator.clipboard.writeText(url);
      toast('Ссылка скопирована', 'ok');
      setInviteUrl(null);
    } catch {
      setInviteUrl(url);
    }
  }, [toast]);

  function copyFromInput() {
    const el = inviteInput.current;
    if (!el) return;
    el.select();
    try {
      if (document.execCommand('copy')) toast('Ссылка скопирована', 'ok');
    } catch {
      // пользователь скопирует вручную
    }
  }
  const playedEnd = useRef(false);

  useEffect(() => {
    if (!battle) return;
    const fin = battle.status === 'finished' && revealed >= battle.cases.length && spinning === null;
    if (!fin || playedEnd.current) return;
    playedEnd.current = true;
    if (!sawLive.current) return;
    const mine = battle.players.find((p) => p.user.id === me?.id);
    const t = setTimeout(() => (!mine || mine.team === battle.winnerTeam ? winSound(true) : loseSound()), 300);
    return () => clearTimeout(t);
  }, [battle, revealed, spinning, me?.id]);

  const ensurePool = useCallback(async (slug: string) => {
    if (pools.current.has(slug)) return;
    const c = await api<CaseDetailDTO>(`/cases/${slug}`);
    pools.current.set(slug, c.items);
    force((x) => x + 1);
  }, []);

  useEffect(() => {
    api<BattleDTO>(`/battles/${id}`)
      .then((b) => {
        setBattle(b);
        setRevealed(b.currentRound);
        b.cases.forEach((c) => void ensurePool(c.slug));
      })
      .catch(() => setMissing(true));

    const s = getSocket();
    s.emit('battle:watch', id);
    const onUpdate = ({ battle: b }: Event) => setBattle(b);
    const onStarted = ({ battle: b, startsInMs }: Event) => {
      setBattle(b);
      let left = Math.round((startsInMs ?? 3000) / 1000);
      setCountdown(left);
      const t = setInterval(() => {
        left -= 1;
        setCountdown(left > 0 ? left : null);
        if (left <= 0) clearInterval(t);
      }, 1000);
    };
    const onRound = ({ battle: b, round }: Event) => {
      setBattle(b);
      setCountdown(null);
      if (round === undefined) return;
      sawLive.current = true;
      setSpinning(round);
      setSpinId((x) => x + 1);
      // Раскрываем раунд чуть раньше следующего, чтобы игрок успел увидеть результат.
      setTimeout(
        () => {
          setRevealed((r) => Math.max(r, round + 1));
          setSpinning((cur) => (cur === round ? null : cur));
        },
        Math.max(800, b.roundMs - 900),
      );
    };
    const onFinished = ({ battle: b }: Event) => {
      setBattle(b);
      void refresh();
    };
    s.on('battle:update', onUpdate);
    s.on('battle:started', onStarted);
    s.on('battle:round', onRound);
    s.on('battle:finished', onFinished);
    return () => {
      s.emit('battle:unwatch', id);
      s.off('battle:update', onUpdate);
      s.off('battle:started', onStarted);
      s.off('battle:round', onRound);
      s.off('battle:finished', onFinished);
    };
  }, [id, ensurePool, refresh]);

  if (missing) return <div className="empty">Батл не найден</div>;
  if (!battle) return <div className="loader">Загрузка батла…</div>;

  const slots = BATTLE_SLOTS[battle.mode];
  const isCreator = me?.id === battle.createdBy;
  const joined = battle.players.some((p) => p.user.id === me?.id);
  const done = battle.status === 'finished' && revealed >= battle.cases.length && spinning === null;
  const dropOf = (round: number, slot: number): ItemDTO | undefined => battle.drops.find((d) => d.round === round && d.slot === slot)?.item;
  const totalOf = (slot: number) => battle.drops.filter((d) => d.slot === slot && d.round < revealed).reduce((s, d) => s + d.item.price, 0);
  const myPlayer = battle.players.find((p) => p.user.id === me?.id);
  const iWon = done && myPlayer && myPlayer.team === battle.winnerTeam;
  const winners = battle.players.filter((p) => p.team === battle.winnerTeam);
  const pot = battle.drops.reduce((s, d) => s + d.item.price, 0);

  async function act(path: string, body: unknown = {}) {
    if (!me) return openAuth();
    try {
      setBattle(await api<BattleDTO>(`/battles/${id}/${path}`, { body }));
      if (path === 'join') setBalance(me.balance - battle!.cost);
      if (path === 'cancel') void refresh();
    } catch (e) {
      toast(errText(e), 'err');
    }
  }

  async function repeat() {
    if (!me) return openAuth();
    try {
      const b = await api<BattleDTO>('/battles', {
        body: {
          mode: battle!.mode,
          caseSlugs: battle!.cases.map((c) => c.slug),
          crazy: battle!.crazy,
        },
      });
      setBalance(me.balance - b.cost);
      router.push(`/battles/${b.id}`);
    } catch (e) {
      toast(errText(e), 'err');
    }
  }

  const currentRound = spinning ?? Math.min(revealed, battle.cases.length - 1);

  return (
    <div>
      <div className="battle-head">
        <Link href="/battles" className="btn btn-sm">
          <Icon name="arrow-left" size={16} /> Батлы
        </Link>
        <h1>
          Батл <span className="accent-text">{battle.mode}</span>
        </h1>
        {battle.crazy && (
          <span className="crazy-tag lg">
            <Icon name="reverse" size={14} stroke={2} /> безумный
          </span>
        )}
        <span className={`badge status-${battle.status}`}>{STATUS_LABEL[battle.status]}</span>
        <div className="spacer" />
        <span className="battle-cost">
          Вход <Price value={battle.cost} />
        </span>
        {battle.status === 'waiting' && (
          <button className="btn btn-primary btn-invite" onClick={invite}>
            <Icon name="link" size={18} stroke={2} /> Пригласить друга
          </button>
        )}
        {isCreator && battle.status === 'waiting' && (
          <>
            <button className="btn btn-violet" onClick={() => act('bots')}>
              <Icon name="bot" size={18} /> Позвать ботов
            </button>
            <button className="btn btn-red" onClick={() => act('cancel')}>
              Отменить
            </button>
          </>
        )}
        {done && (
          <button className="btn btn-primary" onClick={repeat}>
            Повторить за <Price value={battle.cost} />
          </button>
        )}
      </div>

      {inviteUrl && battle.status === 'waiting' && (
        <div className="invite-box">
          <Icon name="link" size={18} className="muted" />
          <input ref={inviteInput} className="input" readOnly value={inviteUrl} onFocus={(e) => e.currentTarget.select()} />
          <button className="btn btn-sm" onClick={copyFromInput}>
            Копировать
          </button>
          <button className="icon-btn" onClick={() => setInviteUrl(null)} aria-label="Скрыть">
            <Icon name="close" size={16} />
          </button>
        </div>
      )}

      <div className="round-strip">
        <div className="round-label">
          <small>Раунд</small>
          <b>
            {Math.min(battle.cases.length, (spinning ?? revealed - 1) + 1 || 0)}
            <span>/{battle.cases.length}</span>
          </b>
        </div>
        {battle.cases.map((c, i) => (
          <div key={i} className={`round-case${i === currentRound && battle.status === 'running' ? ' current' : ''}${i < revealed ? ' done' : ''}`}>
            <CaseArt c={c} />
            <div>{i + 1}</div>
          </div>
        ))}
      </div>

      {done && (
        <div className={`result-banner battle-result ${myPlayer && !iWon ? 'loss' : 'profit'}`}>
          {!(myPlayer && !iWon) && <Burst color="var(--accent)" size="xl" rays={false} />}
          <span className="result-icon">
            <Icon name={myPlayer && !iWon ? 'trend-down' : 'crown'} size={26} stroke={2} />
          </span>
          <div className="result-text">
            <h2>{myPlayer ? (iWon ? 'Вы победили!' : 'Вы проиграли') : `Победа: ${winners.map((w) => w.user.nickname).join(' и ')}`}</h2>
            <div className="muted">
              Банк батла: <Price value={pot} /> — достаётся {winners.length > 1 ? 'команде победителей' : 'победителю'}
            </div>
          </div>
        </div>
      )}

      {countdown !== null && (
        <div className="countdown-wrap">
          <div key={countdown} className="countdown">
            {countdown}
          </div>
          <small>Батл начинается</small>
        </div>
      )}

      <div className="battle-slots" style={{ gridTemplateColumns: `repeat(${slots}, minmax(0, 1fr))` }}>
        {Array.from({ length: slots }, (_, slot) => {
          const p = battle.players.find((x) => x.slot === slot);
          const isWinner = done && p && p.team === battle.winnerTeam;
          const roundCase = battle.cases[currentRound];
          const pool = roundCase ? pools.current.get(roundCase.slug) : undefined;
          const spinItem = spinning !== null ? dropOf(spinning, slot) : undefined;
          const cls = [
            'battle-slot',
            battle.mode === '2v2' ? `team-${slot < 2 ? 0 : 1}` : '',
            isWinner ? 'winner' : done ? 'loser' : '',
            spinItem ? 'is-spinning' : '',
          ].join(' ');
          const lastItem = revealed > 0 ? dropOf(revealed - 1, slot) : undefined;
          const showVs = slot > 0 && (battle.mode !== '2v2' || slot === 2);
          const state: [string, string] = !p
            ? ['waiting', battle.status === 'waiting' ? 'Ожидание игрока' : 'Пусто']
            : battle.status === 'waiting'
              ? ['ready', p.user.isBot ? 'Бот · готов' : 'Готов']
              : battle.status === 'running' || !done
                ? ['playing', 'В игре']
                : battle.status === 'finished'
                  ? isWinner
                    ? ['playing', 'Победитель']
                    : ['waiting', 'Выбыл']
                  : ['waiting', 'Отменён'];
          return (
            <div key={slot} className="slot-wrap">
              {showVs && <span className={`vs-badge${battle.mode === '2v2' ? ' team' : ''}`}>VS</span>}
              <div className={cls}>
                {isWinner && <Burst color="var(--accent)" size="lg" className="slot-burst" />}
                <div className={`player-card${p ? '' : ' empty'}`}>
                  {p ? (
                    <>
                      <Avatar name={p.user.nickname} bot={p.user.isBot} size={42} />
                      <div className="player-meta">
                        <Link href={`/user/${p.user.id}`}>
                          {p.user.nickname}
                          {p.user.id === battle.createdBy && <span className="host-tag">ХОСТ</span>}
                        </Link>
                        <span className={`player-state ${state[0]}`}>{state[1]}</span>
                      </div>
                      {isWinner && <Icon name="crown" size={18} className="slot-crown" />}
                      <Price value={totalOf(slot)} className="slot-total" />
                    </>
                  ) : (
                    <>
                      <span className="avatar avatar-empty">
                        <Icon name="user" size={20} />
                      </span>
                      <div className="player-meta">
                        <b>Свободно</b>
                        <span className={`player-state ${state[0]}`}>{state[1]}</span>
                      </div>
                    </>
                  )}
                </div>
                {!p && battle.status === 'waiting' ? (
                  <div className="slot-join">
                    {!joined ? (
                      <button className="btn btn-primary" onClick={() => act('join', { slot })}>
                        Занять за <Price value={battle.cost} />
                      </button>
                    ) : (
                      <div className="lobby-hint">
                        <b>Ждём игрока</b>
                        <span>Отправьте ссылку другу или позовите ботов</span>
                        <button className="btn btn-sm" onClick={invite}>
                          <Icon name="link" size={14} stroke={2} /> Скопировать ссылку
                        </button>
                      </div>
                    )}
                  </div>
                ) : spinItem && pool ? (
                  <Roulette pool={pool} winner={spinItem} spinId={spinId} duration={Math.max(600, battle.roundMs - 1300)} vertical />
                ) : (
                  <div className="slot-idle">
                    {lastItem ? (
                      <div key={revealed} className="slot-reveal">
                        <Burst color={rarityColor(lastItem)} size="sm" sparks={false} />
                        <ItemCard item={lastItem} compact />
                      </div>
                    ) : battle.status === 'cancelled' ? (
                      'Батл отменён'
                    ) : (
                      'Ожидание старта'
                    )}
                  </div>
                )}
                <div className="slot-drops">
                  {battle.drops
                    .filter((d) => d.slot === slot && d.round < revealed)
                    .map((d) => (
                      <ItemCard key={d.round} item={d.item} compact />
                    ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="panel small muted" style={{ marginTop: 16, wordBreak: 'break-all' }}>
        Provably fair · хеш server seed: {battle.serverSeedHash}
        {battle.serverSeed && (
          <>
            <br />
            Server seed: <b>{battle.serverSeed}</b> · client seed: <b>{battle.id}</b> · nonce = раунд, cursor = место
          </>
        )}
      </div>
    </div>
  );
}
