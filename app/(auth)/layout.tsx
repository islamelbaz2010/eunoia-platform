import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In — Eunoia',
  description: 'Decision Intelligence Platform for Egypt Real Estate',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-midnight px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gold flex items-center justify-center">
              <span className="text-midnight font-bold text-sm">E</span>
            </div>
            <span className="text-cream font-semibold text-xl tracking-tight">
              Eunoia
            </span>
          </div>
          <p className="text-cream/50 text-sm">
            Decision Intelligence Platform
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
