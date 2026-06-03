'use client'

import { useEffect, useState } from 'react'
import { Menu, Zap } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface HeaderProps {
  title: string
  subtitle?: string
  onMenuClick?: () => void
}

export function Header({ title, subtitle, onMenuClick }: HeaderProps) {
  const [initials, setInitials] = useState<string>('U')
  const [userEmail, setUserEmail] = useState<string>('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) {
        setUserEmail(user.email)
        setInitials(user.email[0].toUpperCase())
      }
    })
  }, [])

  return (
    <header className="h-14 border-b border-white/6 flex items-center justify-between px-4 lg:px-6 backdrop-blur sticky top-0 z-10" style={{backgroundColor:'rgba(9,9,15,0.95)'}}>
      <div className="flex items-center gap-3">
        <button
          className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
          style={{color:'rgba(245,240,232,0.4)'}}
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="font-semibold text-base leading-tight" style={{color:'#f5f0e8'}}>{title}</h1>
          {subtitle && <p className="text-xs" style={{color:'rgba(245,240,232,0.4)'}}>{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/intelligence"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
          style={{background:'linear-gradient(135deg,#c9a455,#e2bc6e)', color:'#09090f'}}
        >
          <Zap size={12} />
          Generate Report
        </Link>

        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 cursor-default select-none"
          style={{background:'linear-gradient(135deg,#c9a455,#e2bc6e)', color:'#09090f'}}
          title={userEmail}
        >
          {initials}
        </div>
      </div>
    </header>
  )
}
