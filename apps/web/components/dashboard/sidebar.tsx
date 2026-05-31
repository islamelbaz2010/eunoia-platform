'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  Brain,
  FileText,
  Settings,
  TrendingUp,
  LogOut,
  ChevronRight,
  X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3, exact: true },
  { href: '/dashboard/intelligence', label: 'New Report', icon: Brain },
  { href: '/dashboard/reports', label: 'Reports', icon: FileText },
  { href: '/dashboard/analytics', label: 'Analytics', icon: TrendingUp },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

interface SidebarProps {
  open?: boolean
  onClose?: () => void
}

export function Sidebar({ open = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className={`
      fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto
      w-64 shrink-0 flex flex-col bg-surface border-r border-white/8
      transition-transform duration-300 ease-in-out
      ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/8 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5" onClick={onClose}>
          <div className="w-8 h-8 rounded-lg bg-gold flex items-center justify-center shrink-0">
            <span className="text-midnight font-bold text-sm">E</span>
          </div>
          <div>
            <div className="text-cream font-semibold text-sm leading-tight">Eunoia</div>
            <div className="text-cream/40 text-xs">Intelligence Platform</div>
          </div>
        </Link>
        {/* Close button — mobile only */}
        <button
          className="lg:hidden w-7 h-7 flex items-center justify-center text-cream/40 hover:text-cream rounded-lg hover:bg-white/5 transition-colors"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <X size={16} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href)
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group ${
                    isActive
                      ? 'bg-gold/10 text-gold'
                      : 'text-cream/60 hover:text-cream hover:bg-white/5'
                  }`}
                >
                  <Icon size={16} className={isActive ? 'text-gold' : 'text-current'} />
                  {label}
                  {isActive && (
                    <ChevronRight size={14} className="ml-auto text-gold/60" />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-white/8">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-cream/40 hover:text-red-400 hover:bg-red-500/5 transition-colors w-full"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
