import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import './globals.css';

const montserrat = Montserrat({ subsets: ['latin', 'vietnamese'] });

export const metadata: Metadata = {
  title: 'MẦM — AI Đồng Hành Học Đường',
  description: 'Công cụ AI hỗ trợ bước đầu về tâm lý học đường.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className={montserrat.className}>
      <body className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
