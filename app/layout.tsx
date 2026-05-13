import type { Metadata } from 'next';
import { Heebo } from 'next/font/google';
import './globals.css';

const heebo = Heebo({ subsets: ['hebrew', 'latin'] });

export const metadata: Metadata = {
  title: 'ניחושים מוזיקליים',
  description: 'נחשו את שנת השיר',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className="h-full">
      <body className={`${heebo.className} min-h-full bg-zinc-950`}>{children}</body>
    </html>
  );
}
