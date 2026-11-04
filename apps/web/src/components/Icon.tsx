import type { CSSProperties, ReactNode } from 'react';

/** Небольшой собственный набор линейных иконок (24×24, stroke = currentColor). */
const PATHS = {
  cases: (
    <>
      <path d="M3.5 8.2 12 4l8.5 4.2v7.6L12 20l-8.5-4.2Z" />
      <path d="M3.5 8.2 12 12.4l8.5-4.2M12 12.4V20" />
      <path d="m7.8 6.1 8.4 4.2" opacity=".55" />
    </>
  ),
  battles: (
    <>
      <path d="M14.5 17.5 4 7V4h3l10.5 10.5" />
      <path d="m13 19 6-6M16 16l3.5 3.5M18.5 21l2.5-2.5" />
      <path d="M9.5 6.5 17 4h3v3l-2.5 7.5" opacity=".55" />
      <path d="m5 13 6 6M7.5 17.5 4 21M3 19.5 4.5 21" />
    </>
  ),
  upgrade: (
    <>
      <path d="m6.5 12.5 5.5-5.5 5.5 5.5" />
      <path d="m6.5 18 5.5-5.5 5.5 5.5" opacity=".55" />
      <path d="M5 4h14" />
    </>
  ),
  contract: (
    <>
      <path d="M14 3H7.5A2.5 2.5 0 0 0 5 5.5v13A2.5 2.5 0 0 0 7.5 21h9a2.5 2.5 0 0 0 2.5-2.5V8Z" />
      <path d="M14 3v5h5M8.5 11.5h7" />
      <path d="M8.5 16.5c1.3-1.6 2.2.9 3.4-.4.9-1 1.6-.3 3.6.2" opacity=".75" />
    </>
  ),
  top: (
    <>
      <path d="M7.5 4h9v5a4.5 4.5 0 0 1-9 0Z" />
      <path d="M7.5 6H5a2.5 2.5 0 0 0 2.6 4.3M16.5 6H19a2.5 2.5 0 0 1-2.6 4.3" />
      <path d="M12 13.5V17M8.5 20.5h7M9.5 17h5v3.5h-5Z" />
    </>
  ),
  fair: (
    <>
      <path d="M12 3 19.5 6v5.5c0 4.4-3.1 8.1-7.5 9.5-4.4-1.4-7.5-5.1-7.5-9.5V6Z" />
      <path d="m8.7 12 2.4 2.4 4.3-4.6" />
    </>
  ),
  admin: (
    <>
      <path d="M4 6.5h9M18 6.5h2M4 12h3M11 12h9M4 17.5h11M19 17.5h1" />
      <circle cx="15.5" cy="6.5" r="2" />
      <circle cx="9" cy="12" r="2" />
      <circle cx="17" cy="17.5" r="2" />
    </>
  ),
  bot: (
    <>
      <rect x="4.5" y="8" width="15" height="11" rx="3" />
      <path d="M12 4.8V8M2.5 12v3.5M21.5 12v3.5M9.5 16h5" />
      <circle cx="12" cy="3.8" r="1" />
      <circle cx="9.2" cy="12.6" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="14.8" cy="12.6" r="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  reverse: (
    <>
      <path d="M7.5 4v16M4 16.5 7.5 20l3.5-3.5" />
      <path d="M16.5 20V4M13 7.5 16.5 4 20 7.5" />
    </>
  ),
  bag: (
    <>
      <path d="M5 9.5A3.5 3.5 0 0 1 8.5 6h7A3.5 3.5 0 0 1 19 9.5V19a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2Z" />
      <path d="M9 6V5a3 3 0 0 1 6 0v1M5 13h14M10 13v2.5h4V13" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="7.5" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
    </>
  ),
  link: (
    <>
      <path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.2 1.2" />
      <path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2" />
    </>
  ),
  close: <path d="m6.5 6.5 11 11M17.5 6.5l-11 11" />,
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  'sound-on': (
    <>
      <path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4Z" />
      <path d="M15.5 9.2a4 4 0 0 1 0 5.6M18.2 6.6a7.6 7.6 0 0 1 0 10.8" />
    </>
  ),
  'sound-off': (
    <>
      <path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4Z" />
      <path d="m16 9.5 5 5M21 9.5l-5 5" />
    </>
  ),
  bolt: <path d="M13.5 2.5 5 13.5h6.5l-1 8 8.5-11h-6.5Z" />,
  'arrow-left': <path d="M19 12H5M11 6l-6 6 6 6" />,
  'arrow-right': <path d="M5 12h14M13 6l6 6-6 6" />,
  crown: (
    <>
      <path d="M3.5 8 8 12l4-6.5 4 6.5 4.5-4-2 10.5h-13Z" />
      <path d="M5.8 21h12.4" />
    </>
  ),
  sparkle: <path d="M12 3.5 13.9 9l5.6 1.9-5.6 1.9L12 18.5l-1.9-5.7-5.6-1.9L10.1 9Z" />,
  users: (
    <>
      <circle cx="9" cy="8.5" r="3.2" />
      <path d="M3 19.5a6 6 0 0 1 12 0" />
      <path d="M15.5 5.6a3.2 3.2 0 0 1 0 5.8M17.5 14.2a6 6 0 0 1 3.5 5.3" opacity=".6" />
    </>
  ),
  gift: (
    <>
      <rect x="3.5" y="8.5" width="17" height="4" rx="1" />
      <path d="M5 12.5V20h14v-7.5M12 8.5V20" />
      <path d="M12 8.5C10.5 5 7 4.5 7 6.5S10 8.5 12 8.5c2 0 5 0 5-2s-3.5-1.5-5 2Z" />
    </>
  ),
  ticket: (
    <>
      <path d="M3.5 7.5A1.5 1.5 0 0 1 5 6h14a1.5 1.5 0 0 1 1.5 1.5V10a2 2 0 0 0 0 4v2.5A1.5 1.5 0 0 1 19 18H5a1.5 1.5 0 0 1-1.5-1.5V14a2 2 0 0 0 0-4Z" />
      <path d="M14 6v12" strokeDasharray="2 2" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20h16" />
      <path d="M7 16v-4M12 16V7M17 16v-6" />
    </>
  ),
  trend: (
    <>
      <path d="m3.5 16.5 6-6 4 4 7-7.5" />
      <path d="M15 7h5.5v5.5" />
    </>
  ),
  'trend-down': (
    <>
      <path d="m3.5 7.5 6 6 4-4 7 7.5" />
      <path d="M15 17h5.5v-5.5" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  logout: (
    <>
      <path d="M14 4h3.5A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5H14" />
      <path d="M10 8l-4 4 4 4M6 12h10" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </>
  ),
  pen: (
    <>
      <path d="m15 4.5 4.5 4.5L9 19.5H4.5V15Z" />
      <path d="m12.5 7 4.5 4.5" />
    </>
  ),
  dice: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="3.5" />
      <circle cx="8.5" cy="8.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="15.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.5M12 7.6v.1" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 20,
  stroke = 1.7,
  className = '',
  style,
  title,
}: {
  name: IconName;
  size?: number;
  stroke?: number;
  className?: string;
  style?: CSSProperties;
  title?: string;
}) {
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    >
      {title && <title>{title}</title>}
      {PATHS[name]}
    </svg>
  );
}
