import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Eunoia Intelligence',
    template: '%s — Eunoia Intelligence',
  },
  description: 'AI-powered marketing intelligence for MENA businesses. Generate sector-specific marketing reports, competitor analysis, and growth strategies.',
  keywords: ['marketing intelligence', 'AI reports', 'Egypt marketing', 'MENA digital marketing'],
  authors: [{ name: 'Eunoia Agency' }],
  robots: {
    index: false, // Private SaaS — no public indexing
    follow: false,
  },
}

export const viewport: Viewport = {
  themeColor: '#0f1219',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-midnight text-cream antialiased">
        {children}
      </body>
    </html>
  )
}
