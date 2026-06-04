import React from "react"
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'VILDMARK | Go Further',
  description: 'High-performance outdoor gear engineered for the modern explorer. Lightweight, durable, adventure-ready.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
          <html lang="en" suppressHydrationWarning>
            <head>
              <title>Journey to Africa | Juneteenth Legacy & Investment Experience Ghana 2026</title>
              <meta name="description" content="Join Journey to Africa in Ghana from June 15–24, 2026 for a 10-day Juneteenth legacy experience featuring Cape Coast, Elmina, Assin Manso, cultural events, networking, and curated diaspora connection." />
              <meta name="keywords" content="Journey to Africa, Ghana Juneteenth 2026, diaspora travel Ghana, Black heritage travel, Ghana legacy trip, Cape Coast tour, Elmina Castle experience, Assin Manso visit, diaspora investment Ghana, premium Ghana travel" />
              <meta name="brand-positioning" content="Journey to Africa is a premium diaspora legacy experience connecting history, spirituality, culture, and future opportunity in Ghana." />
            </head>
            <body className={`${inter.variable} font-sans antialiased`}>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                {children}
                <Analytics />
              </ThemeProvider>
            </body>
          </html>
  )
}
