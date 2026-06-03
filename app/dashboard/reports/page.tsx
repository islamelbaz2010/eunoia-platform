import { Shell } from '@/components/dashboard/shell'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma/client'
import { REPORT_TYPE_LABELS } from '@services/ai-engine/prompt-builder'
import Link from 'next/link'
import { Plus } from 'lucide-react'

interface PageProps {
  searchParams: Promise<{ page?: string }>
}

export default async function ReportsPage({ searchParams }: PageProps) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1', 10))
  const limit = 20

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let reports: Array<{
    id: string
    type: string
    status: string
    createdAt: Date
    completedAt: Date | null
    input: unknown
  }> = []
  let total = 0

  try {
    const dbUser = await prisma.user.findUnique({
      where: { email: user?.email ?? '' },
    })

    if (dbUser) {
      ;[reports, total] = await prisma.$transaction([
        prisma.report.findMany({
          where: { userId: dbUser.id },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
          select: { id: true, type: true, status: true, createdAt: true, completedAt: true, input: true },
        }),
        prisma.report.count({ where: { userId: dbUser.id } }),
      ])
    }
  } catch {
    // DB not connected in dev
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <Shell title="Reports" subtitle={`${total} report${total !== 1 ? 's' : ''} total`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div />
          <Link
            href="/dashboard/intelligence"
            className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-colors text-white hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#b8922a,#d4aa45)' }}
          >
            <Plus size={16} />
            New Report
          </Link>
        </div>

        {reports.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <span className="text-muted-foreground text-2xl">📊</span>
            </div>
            <h3 className="text-foreground font-semibold mb-2">No reports yet</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Generate your first AI marketing intelligence report
            </p>
            <Link
              href="/dashboard/intelligence"
              className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors text-white hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#b8922a,#d4aa45)' }}
            >
              <Plus size={16} />
              Generate Report
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Company</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Created</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {reports.map((report) => {
                    const input = report.input as { companyName?: string }
                    const label = REPORT_TYPE_LABELS[report.type as keyof typeof REPORT_TYPE_LABELS]
                    return (
                      <tr key={report.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-3.5 text-foreground text-sm font-medium">
                          {input?.companyName ?? '—'}
                        </td>
                        <td className="px-5 py-3.5 text-muted-foreground text-sm">{label?.en ?? report.type}</td>
                        <td className="px-5 py-3.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            report.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' :
                            report.status === 'FAILED'    ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400' :
                            report.status === 'PROCESSING'? 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {report.status.toLowerCase()}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-muted-foreground text-sm">
                          {new Date(report.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Link
                            href={`/dashboard/reports/${report.id}`}
                            className="text-xs text-gold hover:text-gold-light transition-colors"
                          >
                            View →
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                {page > 1 && (
                  <Link href={`?page=${page - 1}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted/50">
                    ← Previous
                  </Link>
                )}
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                {page < totalPages && (
                  <Link href={`?page=${page + 1}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted/50">
                    Next →
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Shell>
  )
}
