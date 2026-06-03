'use client'
import Link from 'next/link'
import { Menu, Plus, Sun, Moon, PanelLeftClose, PanelLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function Header({ title, subtitle, onMenuClick, sidebarOpen }: {
  title: string
  subtitle?: string
  onMenuClick?: () => void
  sidebarOpen?: boolean
}) {
  const [email, setEmail] = useState<string | null>(null)
  const [dark, setDark] = useState(false)

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null))
    // Load saved theme
    const saved = localStorage.getItem('theme')
    if (saved === 'dark') { document.documentElement.classList.add('dark'); setDark(true) }
  }, [])

  function toggleTheme() {
    const next = !dark
    setDark(next)
    if (next) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  const initials = email ? email.charAt(0).toUpperCase() : '?'

  return (
    <header className="h-14 border-b border-border bg-background/95 backdrop-blur sticky top-0 z-10 flex items-center justify-between px-4 lg:px-6 gap-3">
      <div className="flex items-center gap-3">
        {/* Sidebar toggle — always visible */}
        <button
          onClick={onMenuClick}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
        </button>
        <div>
          <h1 className="text-sm font-semibold text-foreground leading-tight">{title}</h1>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Toggle theme"
        >
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* New Report CTA */}
        <Link
          href="/dashboard/intelligence"
          className="hidden sm:flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg,#b8922a,#d4aa45)', color: '#fff' }}
        >
          <Plus size={13} strokeWidth={2.5} />
          New Report
        </Link>

        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold cursor-default select-none"
          style={{ background: 'linear-gradient(135deg,#b8922a,#d4aa45)', color: '#fff' }}
        >
          {initials}
        </div>
      </div>
    </header>
  )
}
