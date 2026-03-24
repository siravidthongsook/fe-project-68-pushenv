import type { Metadata } from 'next';
import { IBM_Plex_Sans, IBM_Plex_Sans_Thai } from 'next/font/google';
import './globals.css';

const latin = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans-en',
});

const thai = IBM_Plex_Sans_Thai({
  subsets: ['latin', 'thai'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans-thai',
});

export const metadata: Metadata = {
  title: 'ระบบลงทะเบียนงาน Job Fair',
  description: 'ระบบค้นหาบริษัท จองสัมภาษณ์ และจัดการข้อมูลสำหรับงาน Job Fair',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" className={`${latin.variable} ${thai.variable}`}>
      <body>{children}</body>
    </html>
  );
}
