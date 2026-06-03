import type { Metadata, Viewport } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Eunoia Intelligence',
    template: '%s — Eunoia Intelligence',
  },
  description: 'AI-powered marketing intelligence for MENA businesses. Generate sector-specific marketing reports, competitor analysis, and growth strategies.',
  keywords: ['marketing intelligence', 'AI reports', 'Egypt marketing', 'MENA digital marketing'],
  authors: [{ name: 'Eunoia Agency' }],
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  themeColor: '#f8f6f1',
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  )
}
