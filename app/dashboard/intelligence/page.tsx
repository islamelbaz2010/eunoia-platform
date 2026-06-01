import { Shell } from '@/components/dashboard/shell'
import { ReportForm } from '@/components/reports/report-form'

export default function IntelligencePage() {
  return (
    <Shell title="New Report" subtitle="Generate AI-powered marketing intelligence">
      <div className="p-6 max-w-3xl">
        <ReportForm />
      </div>
    </Shell>
  )
}
