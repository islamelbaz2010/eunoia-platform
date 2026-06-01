import { ReportCard } from './report-card'
import type { ReportListItem } from '@/types/report.types'

interface ReportListProps {
  reports: ReportListItem[]
  emptyMessage?: string
}

export function ReportList({ reports, emptyMessage = 'No reports found.' }: ReportListProps) {
  if (reports.length === 0) {
    return (
      <div className="text-center py-12 text-cream/30 text-sm">{emptyMessage}</div>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {reports.map(report => (
        <ReportCard key={report.id} report={report} />
      ))}
    </div>
  )
}
