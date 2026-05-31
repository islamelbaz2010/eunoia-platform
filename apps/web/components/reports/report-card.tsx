import Link from 'next/link'
import { REPORT_TYPE_LABELS } from '@services/ai-engine/prompt-builder'
import type { ReportListItem } from '@/types/report.types'

interface ReportCardProps {
  report: ReportListItem
}

export function ReportCard({ report }: ReportCardProps) {
  const label = REPORT_TYPE_LABELS[report.type]

  return (
    <Link
      href={`/dashboard/reports/${report.id}`}
      className="block bg-surface border border-white/8 hover:border-gold/20 rounded-xl p-5 transition-colors group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="text-gold/70 text-xs font-medium mb-0.5">{label?.en ?? report.type}</div>
          <div className="text-cream font-semibold text-sm">{report.companyName}</div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
          report.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' :
          report.status === 'FAILED' ? 'bg-red-500/10 text-red-400' :
          report.status === 'PROCESSING' ? 'bg-blue-500/10 text-blue-400' :
          'bg-white/5 text-cream/40'
        }`}>
          {report.status.toLowerCase()}
        </span>
      </div>
      <div className="text-cream/30 text-xs">
        {new Date(report.createdAt).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}
      </div>
    </Link>
  )
}
