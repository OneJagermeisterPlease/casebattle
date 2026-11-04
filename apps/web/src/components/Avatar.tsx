import { Icon } from './Icon';

export function Avatar({ name, size = 32, bot }: { name: string; size?: number; bot?: boolean }) {
  const hue = [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 0);
  return (
    <span
      className={`avatar${bot ? ' bot' : ''}`}
      style={{ width: size, height: size, fontSize: size * 0.42, background: `linear-gradient(140deg, hsl(${hue} 65% 52%), hsl(${(hue + 50) % 360} 70% 28%))` }}
      aria-hidden
    >
      {bot ? <Icon name="bot" size={Math.round(size * 0.62)} stroke={1.8} /> : name.replace(/^[^\p{L}\p{N}]+/u, '').slice(0, 1).toUpperCase() || '?'}
    </span>
  );
}
