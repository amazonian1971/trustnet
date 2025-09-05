import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import PWAInstaller from '@/components/PWAInstaller'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TrusTNet-🌿 A promise made is a seed planted.🌿',
  description: 'Build meaningful relationships through small accountability groups and promises',
  themeColor: '#1a73e8',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  applicationName: 'TrustNet',
  appleMobileWebAppCapable: 'yes',
  appleMobileWebAppStatusBarStyle: 'default',
  appleMobileWebAppTitle: 'TrustNet',
  formatDetection: {
    telephone: false
  },
  manifest: '/manifest.json',
  icons: [
    { rel: 'icon', url: '/icon-192.png' },
    { rel: 'apple-touch-icon', url: '/icon-192.png' }
  ]
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Essential PWA meta tags */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="icon" href="/icon-192.png" />
        <meta name="theme-color" content="#1a73e8" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="TrustNet" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* Critical fix for Vercel override */}
        <meta name="application-name" content="TrustNet" />
        <meta name="msapplication-TileColor" content="#1a73e8" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body className={`${inter.className} bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-indigo-900 transition-colors duration-300`}>
        {children}
        <PWAInstaller />
      </body>
    </html>
  )
}