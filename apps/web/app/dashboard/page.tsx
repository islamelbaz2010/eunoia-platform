import { Shell } from '@/components/dashboard/shell'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma/client'
import { Brain, FileText, TrendingUp, Clock } from 'lucide-react'
import Link from 'next/link'
import { REPORT_TYPE_LABELS } from '@services/ai-engine/prompt-builder'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let totalReports = 0
  let thisMonthReports = 0
  let lastReportDate: Date | null = null
  let mostUsedType: string | null = null
  let recentReports: Array<{
    id: string
    type: string
    status: string
    createdAt: Date
    input: unknown
  }> = []

  try {
    const dbUser = await prisma.user.findUnique({
      where: { email: user?.email ?? '' },
      select: { workspaceId: true },
    })

    if (dbUser) {
      const wid = dbUser.workspaceId
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const [total, thisMonth, lastReport, typeGroups, recent] = await prisma.$transaction([
        prisma.report.count({ where: { workspaceId: wid } }),
        prisma.report.count({ where: { workspaceId: wid, createdAt: { gte: startOfMonth } } }),
        prisma.report.findFirst({
          where: { workspaceId: wid, status: 'COMPLETED' },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        }),
        prisma.report.groupBy({
          by: ['type'],
          where: { workspaceId: wid },
          _count: { type: true },
          orderBy: { _count: { type: 'desc' } },
          take: 1,
        }),
        prisma.report.findMany({
          where: { workspaceId: wid },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id: true, type: true, status: true, createdAt: true, input: true },
        }),
      ])

      totalReports = total
      thisMonthReports = thisMonth
      lastReportDate = lastReport?.createdAt ?? null
      mostUsedType = typeGroups[0]?.type ?? null
      recentReports = recent
    }
  } catch {
    // DB may not be connected in dev
  }

  const lastReportLabel = lastReportDate
    ? lastReportDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    : '—'

  const mostUsedLabel = mostUsedType
    ? (REPORT_TYPE_LABELS[mostUsedType as keyof typeof REPORT_TYPE_LABELS]?.en ?? mostUsedType)
    : '—'

  const STAT_CARDS = [
    { label: 'Total Reports', value: totalReports, icon: FileText, color: 'text-gold' },
    { label: 'This Month', value: thisMonthReports, icon: TrendingUp, color: 'text-emerald-400' },
    { label: 'Last Report', value: lastReportLabel, icon: Clock, color: 'text-blue-400' },
    { label: 'Top Report Type', value: mostUsedLabel, icon: Brain, color: 'text-purple-400' },
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
              <div className="text-cream text-2xl font-bold truncate">{value}</div>
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
            {(Object.keys(REPORT_TYPE_LABELS) as Array<keyof typeof REPORT_TYPE_LABELS>).map((type) => (
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
        {recentReports.length > 0 ? (
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
        ) : (
          <div className="bg-surface border border-white/8 rounded-xl p-10 text-center">
            <div className="text-cream/20 text-4xl mb-3">📊</div>
            <h3 className="text-cream font-semibold mb-1">No reports yet</h3>
            <p className="text-cream/40 text-sm mb-5">Generate your first AI marketing intelligence report</p>
            <Link
              href="/dashboard/intelligence"
              className="inline-flex items-center gap-2 bg-gold hover:bg-gold-light text-midnight text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
            >
              Generate Report
            </Link>
          </div>
        )}
      </div>
    </Shell>
  )
}
