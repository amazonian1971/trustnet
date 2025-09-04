import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Source_Code_Pro } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const sourceCodePro = Source_Code_Pro({
  variable: "--font-geist-mono",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TrusTNet-🌿 A promise made is a seed planted.🌿",
  description: "Build meaningful relationships through small accountability groups and promises. Track your trust score and grow authentic connections.",
  keywords: "trust, social network, accountability, promises, trust score, relationship building, small groups, trust circles",
  openGraph: {
    title: "TrusTNet-🌿 A promise made is a seed planted.🌿",
    description: "Track your trust score, make promises, and join small accountability groups to build authentic relationships.",
    url: "https://trustnet.example.com",
    siteName: "TrustNet",
    images: [
      {
        url: "https://trustnet.example.com/og-image.jpg",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: " 🌿 TrusTNet- A promise made is a seed planted. 🌿",
    description: "Track your trust score, make promises, and join small accountability groups to build authentic relationships.",
    creator: "@TrustNet",
    images: ["https://trustnet.example.com/og-image.jpg"],
  },
  verification: {
    google: "YOUR_GOOGLE_VERIFICATION_CODE",
  },
  alternates: {
    canonical: "https://trustnet.example.com",
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    }
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const savedTheme = localStorage.getItem('darkMode');
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const isDark = savedTheme ? savedTheme === 'true' : prefersDark;
                
                if (isDark) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              })();
            `,
          }}
        />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body 
        className={`${inter.variable} ${sourceCodePro.variable} antialiased bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-indigo-900 transition-colors duration-300`}
      >
        {children}
      </body>
    </html>
  );
}