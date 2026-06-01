'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Shell } from '@/components/dashboard/shell'
import { ReportOutput } from '@/components/reports/report-output'
import { REPORT_TYPE_LABELS } from '@services/ai-engine/prompt-builder'
import Link from 'next/link'
import { ArrowLeft, RefreshCw, Printer } from 'lucide-react'

type ReportData = {
  id: string
  type: string
  status: string
  input: { companyName?: string; sectorKey?: string; cityKey?: string }
  output: Record<string, unknown> | null
  error: string | null
  createdAt: string
  completedAt: string | null
}

export default function ReportDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [report, setReport] = useState<ReportData | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [isPolling, setIsPolling] = useState(false)

  const fetchReport = useCallback(async () => {
    try {
      const res = await fetch(`/api/reports/${id}`)
      if (res.status === 404) { setNotFound(true); return }
      if (!res.ok) return
      const data = await res.json() as ReportData
      setReport(data)
    } catch {
      // ignore
    }
  }, [id])

  useEffect(() => {
    void fetchReport()
  }, [fetchReport])

  // Poll every 3s while PROCESSING
  useEffect(() => {
    if (report?.status !== 'PROCESSING') { setIsPolling(false); return }
    setIsPolling(true)
    const timer = setInterval(() => { void fetchReport() }, 3000)
    return () => clearInterval(timer)
  }, [report?.status, fetchReport])

  if (notFound) {
    return (
      <Shell title="Not Found" subtitle="This report doesn't exist">
        <div className="p-6">
          <Link href="/dashboard/reports" className="text-sm text-gold/60 hover:text-gold transition-colors">
            ← Back to reports
          </Link>
        </div>
      </Shell>
    )
  }

  if (!report) {
    return (
      <Shell title="Loading…" subtitle="">
        <div className="p-6 flex items-center gap-3 text-cream/40">
          <RefreshCw size={16} className="animate-spin" />
          Loading report…
        </div>
      </Shell>
    )
  }

  const label = REPORT_TYPE_LABELS[report.type as keyof typeof REPORT_TYPE_LABELS]

  return (
    <Shell title={report.input?.companyName ?? 'Report'} subtitle={label?.en ?? report.type}>
      <div className="p-6 md:p-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/reports"
              className="flex items-center gap-1.5 text-sm text-cream/40 hover:text-cream transition-colors"
            >
              <ArrowLeft size={14} />
              All Reports
            </Link>
            <span className="text-cream/20">/</span>
            <span className="text-cream/60 text-sm">{report.input?.companyName ?? 'Report'}</span>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gold/30 text-gold text-sm hover:bg-gold/10 transition-colors print:hidden"
          >
            <Printer size={14} />
            Print / Save PDF
          </button>
        </div>

        {report.status === 'FAILED' && report.error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 mb-6 text-red-400">
            <strong className="font-semibold">Generation failed:</strong> {report.error}
          </div>
        )}

        {report.status === 'PROCESSING' && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-5 mb-6 text-blue-400 flex items-center gap-3">
            <RefreshCw size={16} className={isPolling ? 'animate-spin' : ''} />
            <span>Generating report… this takes 30–60 seconds. This page updates automatically.</span>
          </div>
        )}

        {report.status === 'QUEUED' && (
          <div className="bg-white/5 border border-white/8 rounded-xl p-5 mb-6 text-cream/60 flex items-center gap-3">
            <RefreshCw size={16} className="animate-spin" />
            <span>Report is queued for processing…</span>
          </div>
        )}

        {report.output ? (
          <ReportOutput
            data={report.output}
            type={report.type as keyof typeof REPORT_TYPE_LABELS}
          />
        ) : null}
      </div>
    </Shell>
  )
}
