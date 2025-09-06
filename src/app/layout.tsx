// src/app/dashboard/layout.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'TrustNet Dashboard - Build Trust Through Promises',
  description: 'Track your trust score, make promises, and join small accountability groups to build authentic relationships.',
  openGraph: {
    title: 'TrustNet Dashboard - Build Trust Through Promises',
    description: 'Track your trust score, make promises, and join small accountability groups to build authentic relationships.',
    url: 'https://trustnet.example.com/dashboard',
    siteName: 'TrustNet',
    images: [
      {
        url: '/og-dashboard.jpg',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TrustNet Dashboard - Build Trust Through Promises',
    description: 'Track your trust score, make promises, and join small accountability groups to build authentic relationships.',
    creator: '@trustnet',
    images: ['/og-dashboard.jpg'],
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}