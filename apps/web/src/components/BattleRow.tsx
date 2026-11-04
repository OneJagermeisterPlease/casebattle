import type { BattleDTO } from '@casebattle/shared';
import { BATTLE_SLOTS } from '@casebattle/shared';
import Link from 'next/link';
import { Avatar } from './Avatar';
import { CaseArt } from './CaseArt';
import { Price } from './Coin';
import { Icon } from './Icon';

export const STATUS_LABEL: Record<BattleDTO['status'], string> = {
  waiting: 'Ожидание',
  running: 'Идёт',
  finished: 'Завершён',
  cancelled: 'Отменён',
};

export function BattleRow({ b }: { b: BattleDTO }) {
  const slots = BATTLE_SLOTS[b.mode];
  return (
    <div className={`battle-row ${b.status}`}>
      <div className="battle-mode">
        {b.mode}
        <small>
          {b.crazy && (
            <span className="crazy-tag">
              <Icon name="reverse" size={12} stroke={2} /> безумный
            </span>
          )}
          {b.cases.length} раунд.
        </small>
        {b.status === 'waiting' && (
          <span className="wait-state">
            <i /> ждёт игроков · {b.players.length}/{slots}
          </span>
        )}
        {b.status === 'running' && (
          <span className="wait-state live">
            <i /> идёт игра
          </span>
        )}
      </div>
      <div className="battle-cases">
        {b.cases.slice(0, 10).map((c, i) => (
          <CaseArt key={i} c={c} />
        ))}
        {b.cases.length > 10 && <span className="muted">+{b.cases.length - 10}</span>}
      </div>
      <div className="battle-players">
        {Array.from({ length: slots }, (_, s) => {
          const p = b.players.find((x) => x.slot === s);
          return p ? <Avatar key={s} name={p.user.nickname} bot={p.user.isBot} /> : <span key={s} className="slot-empty" />;
        })}
      </div>
      <Price value={b.cost} />
      <Link href={`/battles/${b.id}`} className={`btn ${b.status === 'waiting' ? 'btn-primary' : ''}`}>
        {b.status === 'waiting' ? 'Присоединиться' : b.status === 'running' ? 'Смотреть' : 'Повтор'}
      </Link>
    </div>
  );
}
