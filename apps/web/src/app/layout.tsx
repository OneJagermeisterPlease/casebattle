import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AuthModal } from '@/components/AuthModal';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { LiveFeed } from '@/components/LiveFeed';
import { AuthProvider } from '@/lib/auth';
import { ToastProvider } from '@/lib/toast';
import './globals.css';

const FONTS_URL = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Oswald:wght@400;500;600;700&display=swap';

export const metadata: Metadata = {
  title: 'CaseClash — демо кейсов и батлов',
  description: 'Открытие кейсов, батлы, апгрейды и контракты на выдуманных монетах',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={FONTS_URL} />
      </head>
      <body>
        <ToastProvider>
          <AuthProvider>
            <Header />
            <div className="shell">
              <LiveFeed />
              <main className="main">
                {children}
                <Footer />
              </main>
            </div>
            <AuthModal />
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
