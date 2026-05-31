import { Shell } from '@/components/dashboard/shell'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma/client'
import { Brain, FileText, TrendingUp, Zap } from 'lucide-react'
import Link from 'next/link'
import { REPORT_TYPE_LABELS } from '@services/ai-engine/prompt-builder'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let recentReports: Array<{
    id: string
    type: string
    status: string
    createdAt: Date
    input: unknown
  }> = []

  let reportCount = 0

  try {
    const dbUser = await prisma.user.findUnique({
      where: { email: user?.email ?? '' },
      include: {
        reports: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id: true, type: true, status: true, createdAt: true, input: true },
        },
        _count: { select: { reports: true } },
      },
    })

    recentReports = dbUser?.reports ?? []
    reportCount = dbUser?._count?.reports ?? 0
  } catch {
    // DB may not be connected in dev
  }

  const STAT_CARDS = [
    { label: 'Total Reports', value: reportCount, icon: FileText, color: 'text-gold' },
    { label: 'This Month', value: recentReports.length, icon: TrendingUp, color: 'text-emerald-400' },
    { label: 'Report Types', value: 8, icon: Brain, color: 'text-blue-400' },
    { label: 'Avg. Gen Time', value: '~45s', icon: Zap, color: 'text-purple-400' },
  ]

  return (
    <Shell title="Dashboard" subtitle={`Welcome back, ${user?.email?.split('@')[0] ?? 'user'}`}>
      <div className="p-6 space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STAT_CARDS.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-surface border border-white/8 rounded-xl p-5">
              <div className={`${color} mb-3`}>
                <Icon size={20} />
              </div>
              <div className="text-cream text-2xl font-bold">{value}</div>
              <div className="text-cream/40 text-xs mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="text-cream/60 text-xs font-semibold uppercase tracking-wider mb-3">
            Generate New Report
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {(Object.keys(REPORT_TYPE_LABELS) as Array<keyof typeof REPORT_TYPE_LABELS>).slice(0, 8).map((type) => (
              <Link
                key={type}
                href={`/dashboard/intelligence?type=${type}`}
                className="bg-surface hover:bg-white/5 border border-white/8 hover:border-gold/30 rounded-xl p-4 transition-all group"
              >
                <div className="text-cream/60 group-hover:text-gold text-xs font-medium transition-colors">
                  {REPORT_TYPE_LABELS[type].en}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent reports */}
        {recentReports.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-cream/60 text-xs font-semibold uppercase tracking-wider">
                Recent Reports
              </h2>
              <Link href="/dashboard/reports" className="text-xs text-gold/60 hover:text-gold transition-colors">
                View all →
              </Link>
            </div>
            <div className="bg-surface border border-white/8 rounded-xl divide-y divide-white/5">
              {recentReports.map((report) => {
                const input = report.input as { companyName?: string }
                const label = REPORT_TYPE_LABELS[report.type as keyof typeof REPORT_TYPE_LABELS]
                return (
                  <Link
                    key={report.id}
                    href={`/dashboard/reports/${report.id}`}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-white/3 transition-colors"
                  >
                    <div>
                      <div className="text-cream text-sm font-medium">
                        {input?.companyName ?? 'Untitled'}
                      </div>
                      <div className="text-cream/40 text-xs">{label?.en ?? report.type}</div>
                    </div>
                    <div className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      report.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' :
                      report.status === 'FAILED' ? 'bg-red-500/10 text-red-400' :
                      report.status === 'PROCESSING' ? 'bg-blue-500/10 text-blue-400' :
                      'bg-white/5 text-cream/40'
                    }`}>
                      {report.status.toLowerCase()}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </Shell>
  )
}
