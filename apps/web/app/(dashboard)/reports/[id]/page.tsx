import { notFound } from 'next/navigation'
import { Shell } from '@/components/dashboard/shell'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma/client'
import { ReportOutput } from '@/components/reports/report-output'
import { REPORT_TYPE_LABELS } from '@services/ai-engine/prompt-builder'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ReportDetailPage({ params }: PageProps) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let report: {
    id: string
    type: string
    status: string
    input: unknown
    output: unknown
    error: string | null
    createdAt: Date
    completedAt: Date | null
  } | null = null

  try {
    const dbUser = await prisma.user.findUnique({ where: { email: user?.email ?? '' } })

    if (dbUser) {
      report = await prisma.report.findFirst({
        where: { id, userId: dbUser.id },
        select: {
          id: true, type: true, status: true, input: true, output: true,
          error: true, createdAt: true, completedAt: true,
        },
      })
    }
  } catch {
    // DB not connected
  }

  if (!report) notFound()

  const label = REPORT_TYPE_LABELS[report.type as keyof typeof REPORT_TYPE_LABELS]
  const input = report.input as { companyName?: string; sectorKey?: string; cityKey?: string }

  return (
    <Shell
      title={input?.companyName ?? 'Report'}
      subtitle={label?.en ?? report.type}
    >
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/dashboard/reports"
            className="flex items-center gap-1.5 text-sm text-cream/40 hover:text-cream transition-colors"
          >
            <ArrowLeft size={14} />
            All Reports
          </Link>
          <span className="text-cream/20">/</span>
          <span className="text-cream/60 text-sm">{input?.companyName ?? 'Report'}</span>
        </div>

        {report.status === 'FAILED' && report.error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 mb-6 text-red-400">
            <strong className="font-semibold">Generation failed:</strong> {report.error}
          </div>
        )}

        {report.status === 'PROCESSING' && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-5 mb-6 text-blue-400">
            Report is being generated — refresh the page in a moment.
          </div>
        )}

        {report.output ? (
          <ReportOutput
            data={report.output as Record<string, unknown>}
            type={report.type as keyof typeof REPORT_TYPE_LABELS}
          />
        ) : null}
      </div>
    </Shell>
  )
}
