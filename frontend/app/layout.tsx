import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, Inter } from 'next/font/google'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import './globals.css'

const display = Geist({
  subsets: ['latin'],
  variable: '--font-display-sans',
  weight: ['400', '500', '600', '700'],
})

const body = Inter({
  subsets: ['latin'],
  variable: '--font-body',
})

const mono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono-sans',
})

export const metadata: Metadata = {
  title: 'Sentinel — the self-healing commerce catalog for AI buyer agents',
  description:
    'Sentinel makes commerce catalogs readable by AI agents, detects the queries that fail, and heals its own product data so the next agent converts.',
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

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0a0a0b',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable} bg-background`}
    >
      <body className="antialiased font-sans">
        <SiteHeader />
        <main className="pt-[6.75rem] md:pt-14">{children}</main>
        <SiteFooter />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
