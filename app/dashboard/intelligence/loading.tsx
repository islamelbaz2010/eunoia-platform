import { Shell } from '@/components/dashboard/shell'

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/5 ${className}`} />
}

export default function IntelligenceLoading() {
  return (
    <Shell title="New Report" subtitle="Generate AI-powered marketing intelligence">
      <div className="p-6 max-w-3xl space-y-5">
        {/* Report type section */}
        <div className="bg-surface border border-white/8 rounded-xl p-5 space-y-4">
          <Skeleton className="w-24 h-3" />
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        </div>

        {/* Company info section */}
        <div className="bg-surface border border-white/8 rounded-xl p-5 space-y-4">
          <Skeleton className="w-36 h-3" />
          <Skeleton className="w-full h-10" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
          <Skeleton className="w-full h-10" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        </div>

        {/* Collapsible sections */}
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-xl" />
        ))}

        <Skeleton className="w-full h-12 rounded-xl" />
      </div>
    </Shell>
  )
}
