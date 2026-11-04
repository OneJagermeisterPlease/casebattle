import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Case Battle (demo)',
  description: 'Демо кейс-батлов на выдуманных монетах',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body style={{ margin: 0, background: '#0f1117', color: '#e6e8ef', fontFamily: 'system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
