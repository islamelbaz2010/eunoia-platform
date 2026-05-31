'use client'

import { useEffect } from 'react'
import Link from 'next/link'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[dashboard-error]', error)
  }, [error])

  return (
    <div className="min-h-screen bg-midnight flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
          <span className="text-red-400 text-2xl">!</span>
        </div>

        <h1 className="text-cream text-xl font-bold mb-2">Something went wrong</h1>
        <p className="text-cream/40 text-sm mb-1">حدث خطأ غير متوقع — يرجى المحاولة مرة أخرى</p>

        {error.message && (
          <p className="text-red-400/60 text-xs font-mono mt-3 mb-6 bg-red-500/5 border border-red-500/10 rounded-lg px-4 py-2">
            {error.message}
          </p>
        )}

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-gold hover:bg-gold-light text-midnight font-semibold text-sm rounded-lg transition-colors"
          >
            Try again / أعد المحاولة
          </button>
          <Link
            href="/dashboard"
            className="px-5 py-2.5 bg-white/5 hover:bg-white/8 text-cream/70 hover:text-cream font-medium text-sm rounded-lg transition-colors border border-white/8"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
