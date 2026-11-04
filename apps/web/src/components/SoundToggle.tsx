'use client';

import { useMuted } from '@/lib/sfx';
import { Icon } from './Icon';

export function SoundToggle({ className = '' }: { className?: string }) {
  const [muted, toggle] = useMuted();
  return (
    <button
      type="button"
      className={`sound-toggle${muted ? ' off' : ''} ${className}`}
      onClick={toggle}
      aria-pressed={!muted}
      aria-label={muted ? 'Включить звук' : 'Выключить звук'}
      title={muted ? 'Звук выключен' : 'Звук включён'}
    >
      <Icon name={muted ? 'sound-off' : 'sound-on'} size={18} />
    </button>
  );
}
