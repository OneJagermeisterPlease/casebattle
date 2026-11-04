import Link from 'next/link';
import { BRAND } from '@/lib/brand';

export function Footer() {
  return (
    <footer className="footer">
      <div>
        <b>
          {BRAND.name}
          {BRAND.accent}
        </b>{' '}
        — учебный демо-проект. Монеты выдуманные: их нельзя купить, вывести или обменять на деньги или предметы.
      </div>
      <div className="footer-links">
        <Link href="/faq">Вопрос — ответ</Link>
        <Link href="/fair">Честная игра</Link>
        <Link href="/top">Топ игроков</Link>
      </div>
    </footer>
  );
}
