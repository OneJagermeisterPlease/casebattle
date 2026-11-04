import { formatCoins } from '@/lib/format';

export function Coin({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="coin" aria-hidden>
      <circle cx="12" cy="12" r="11" fill="#f5b81c" />
      <circle cx="12" cy="12" r="8" fill="#ffd25a" stroke="#c98a00" strokeWidth="1.5" />
      <path d="M9 8.5h4.2a2.3 2.3 0 0 1 0 4.6H9.6m0-4.6v7h4" fill="none" stroke="#a86b00" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function Price({ value, size = 14, className = '' }: { value: number; size?: number; className?: string }) {
  return (
    <span className={`price ${className}`}>
      <Coin size={size} />
      {formatCoins(value)}
    </span>
  );
}
