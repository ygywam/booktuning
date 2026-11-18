import type { Metadata, Viewport } from 'next';
import './globals.css';

const schoolName = process.env.NEXT_PUBLIC_SCHOOL_NAME?.trim() || '';
const baseTitle = schoolName ? `${schoolName} 북튜닝 (Book Tuning)` : '북튜닝 (Book Tuning)';
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://booktuning-sfl.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: `${baseTitle} v4.5 - 노션 독서 서재`,
  description: '책을 읽고 기록하며 내 삶과 생각의 주파수를 맞춰가는 공간',
  alternates: {
    canonical: '/',
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    apple: '/apple-icon.svg',
  },
  openGraph: {
    title: `${baseTitle} - 노션 독서 서재`,
    description: '책을 읽고 기록하며 내 삶과 생각의 주파수를 맞춰가는 공간',
    url: appUrl,
    siteName: baseTitle,
    images: [
      {
        url: '/icon.svg',
        width: 512,
        height: 512,
        alt: baseTitle,
      },
    ],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: baseTitle,
    description: '책을 읽고 기록하며 내 삶과 생각의 주파수를 맞춰가는 공간',
    images: ['/icon.svg'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: baseTitle,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#8f5f36',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-icon.svg" />
      </head>
      <body>{children}</body>
    </html>
  );
}
