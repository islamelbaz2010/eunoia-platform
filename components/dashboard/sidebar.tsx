'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BarChart3, Brain, Calculator, FileText, Settings, TrendingUp, LogOut, X, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/dashboard',             label: 'Dashboard',  icon: BarChart3,   exact: true },
  { href: '/dashboard/intelligence', label: 'New Report', icon: Brain },
  { href: '/dashboard/reports',      label: 'Reports',    icon: FileText },
  { href: '/dashboard/feasibility',  label: 'Feasibility', icon: Calculator },
  { href: '/dashboard/real-estate',  label: 'Real Estate', icon: Building2 },
  { href: '/dashboard/analytics',    label: 'Analytics',  icon: TrendingUp },
  { href: '/dashboard/settings',     label: 'Settings',   icon: Settings },
]

const RE = [
  { type: 'REAL_ESTATE_LAUNCH',      label: 'Launch Strategy' },
  { type: 'REAL_ESTATE_LEADS',       label: 'Lead Gen Intel' },
  { type: 'REAL_ESTATE_FEASIBILITY', label: 'Feasibility' },
]

export function Sidebar({ open = false, onClose }: { open?: boolean; onClose?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const showExh = new Date() < new Date('2026-06-06T00:00:00')

  async function handleSignOut() {
    await createClient().auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside
      className={cn(
        'fixed top-0 bottom-0 left-0 z-50 w-64 flex flex-col bg-card border-r border-border transition-transform duration-300 lg:relative lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <Link href="/dashboard" onClick={onClose} className="no-underline">
          <div className="font-mono text-[11px] tracking-[0.28em] uppercase font-bold text-gold">EUNOIA</div>
          <div className="h-px my-1" style={{ background: 'linear-gradient(90deg, #b8922a, #d4aa45, transparent)' }} />
          <div className="text-[9px] tracking-[0.15em] uppercase text-muted-foreground">Intelligence Platform</div>
        </Link>
        <button
          onClick={onClose}
          className="lg:hidden w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5">
        <ul className="space-y-0.5">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href)
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium no-underline transition-all duration-150 border-l-2',
                    active
                      ? 'text-gold bg-accent border-gold'
                      : 'text-muted-foreground border-transparent hover:text-foreground hover:bg-secondary'
                  )}
                >
                  <Icon size={14} />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Real Estate sub-nav */}
        <div className="mt-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60 px-3 mb-1.5">
            Real Estate
          </p>
          <ul className="space-y-0.5">
            {RE.map(({ type, label }) => (
              <li key={type}>
                <Link
                  href={`/dashboard/intelligence?type=${type}`}
                  onClick={onClose}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] text-muted-foreground no-underline hover:text-foreground hover:bg-secondary transition-all"
                >
                  <Building2 size={12} />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Exhibition banner */}
      {showExh && (
        <div className="mx-2.5 mb-2.5 rounded-xl border border-gold-border bg-gold-bg p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[9px] font-bold uppercase tracking-wider bg-gold text-white px-2 py-0.5 rounded-full">
              LIVE
            </span>
            <span className="text-[10px] text-muted-foreground">Jun 5, 2026</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-snug">Real Estate Developer Exhibition</p>
          <Link
            href="/dashboard/intelligence?type=OPPORTUNITY_SCORING"
            onClick={onClose}
            className="block mt-2 text-[11px] font-bold text-gold no-underline text-center"
          >
            Run demo →
          </Link>
        </div>
      )}

      {/* Sign out */}
      <div className="border-t border-border p-2.5">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
