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
          <Link href="/dashboard/reports" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back to reports
          </Link>
        </div>
      </Shell>
    )
  }

  if (!report) {
    return (
      <Shell title="Loading…" subtitle="">
        <div className="p-6 flex items-center gap-3 text-muted-foreground">
          <RefreshCw size={16} className="animate-spin" />
          Loading report…
        </div>
      </Shell>
    )
  }

  const label = REPORT_TYPE_LABELS[report.type as keyof typeof REPORT_TYPE_LABELS]

  function downloadPDF() {
    window.print()
  }

  function downloadExcel(reportData: Record<string, unknown>, reportTitle: string) {
    const rows: string[][] = [['Field', 'Value']]

    function flatten(obj: unknown, prefix = '') {
      if (obj === null || obj === undefined) return
      if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
        rows.push([prefix, String(obj)])
      } else if (Array.isArray(obj)) {
        obj.forEach((item, i) => flatten(item, `${prefix}[${i + 1}]`))
      } else if (typeof obj === 'object') {
        Object.entries(obj as Record<string, unknown>).forEach(([k, v]) => {
          flatten(v, prefix ? `${prefix} > ${k}` : k)
        })
      }
    }

    flatten(reportData)

    const csv = rows
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const BOM = '﻿'
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${reportTitle.replace(/\s+/g, '_')}_eunoia.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Shell title={report.input?.companyName ?? 'Report'} subtitle={label?.en ?? report.type}>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/reports"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={14} />
              All Reports
            </Link>
            <span className="text-border">/</span>
            <span className="text-foreground text-sm font-medium">{report.input?.companyName ?? 'Report'}</span>
          </div>
            <div className="flex items-center gap-2 print:hidden">
              <button
                onClick={downloadPDF}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors"
              >
                <Printer size={13} />
                PDF
              </button>
              <button
                onClick={() => downloadExcel(report.output ?? {}, report.input?.companyName ?? 'report')}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all hover:opacity-90"
                style={{background:'linear-gradient(135deg,#16a34a,#15803d)', color:'#fff'}}
              >
                <span>📊</span>
                Excel
              </button>
            </div>
        </div>

        {report.status === 'FAILED' && report.error && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-5 mb-6 text-red-700 dark:text-red-400">
            <strong className="font-semibold">Generation failed:</strong> {report.error}
          </div>
        )}

        {report.status === 'PROCESSING' && (
          <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-5 mb-6 text-blue-700 dark:text-blue-400 flex items-center gap-3">
            <RefreshCw size={16} className={isPolling ? 'animate-spin' : ''} />
            <span>Generating report… this takes 30–60 seconds. This page updates automatically.</span>
          </div>
        )}

        {report.status === 'QUEUED' && (
          <div className="bg-muted border border-border rounded-xl p-5 mb-6 text-muted-foreground flex items-center gap-3">
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
