'use client'
import Link from 'next/link'
import { Menu, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function Header({ title, subtitle, onMenuClick }: {
  title: string
  subtitle?: string
  onMenuClick?: () => void
}) {
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null))
  }, [])

  const initials = email ? email.charAt(0).toUpperCase() : '?'

  return (
    <header className="sticky top-0 z-10 h-14 border-b border-border flex items-center justify-between px-6 bg-background/95 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
        >
          <Menu size={17} />
        </button>
        <div>
          <h1 className="text-sm font-semibold text-foreground leading-tight">{title}</h1>
          {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <Link
          href="/dashboard/intelligence"
          className="flex items-center gap-1.5 text-white text-xs font-bold px-3.5 py-2 rounded-lg no-underline hover:opacity-90 transition-opacity"
          style={{ background: 'linear-gradient(135deg, #b8922a, #d4aa45)' }}
        >
          <Plus size={12} strokeWidth={2.5} />New Report
        </Link>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold text-white select-none"
          style={{ background: 'linear-gradient(135deg, #b8922a, #d4aa45)' }}
        >
          {initials}
        </div>
      </div>
    </header>
  )
}
