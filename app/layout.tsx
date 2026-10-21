import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '북튜닝 (Book Tuning) - 노션 독서 서재',
  description: '책을 읽고 기록하며 내 삶과 생각의 주파수를 맞춰가는 공간',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}