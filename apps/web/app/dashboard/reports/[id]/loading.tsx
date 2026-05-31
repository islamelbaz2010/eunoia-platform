import { Shell } from '@/components/dashboard/shell'

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/5 ${className}`} />
}

export default function ReportDetailLoading() {
  return (
    <Shell title="Loading report…" subtitle="">
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="w-24 h-4" />
          <Skeleton className="w-2 h-4" />
          <Skeleton className="w-32 h-4" />
        </div>
        <div className="bg-surface border border-white/8 rounded-xl p-6 space-y-4">
          <Skeleton className="w-48 h-6" />
          <Skeleton className="w-full h-4" />
          <Skeleton className="w-5/6 h-4" />
          <Skeleton className="w-4/6 h-4" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-surface border border-white/8 rounded-xl p-5 space-y-3">
              <Skeleton className="w-36 h-5" />
              <Skeleton className="w-full h-4" />
              <Skeleton className="w-5/6 h-4" />
              <Skeleton className="w-3/4 h-4" />
            </div>
          ))}
        </div>
      </div>
    </Shell>
  )
}
