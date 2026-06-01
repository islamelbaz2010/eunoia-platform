import { Shell } from '@/components/dashboard/shell'

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/5 ${className}`} />
}

export default function DashboardLoading() {
  return (
    <Shell title="Dashboard" subtitle="Loading…">
      <div className="p-6 space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-surface border border-white/8 rounded-xl p-5 space-y-3">
              <Skeleton className="w-5 h-5" />
              <Skeleton className="w-16 h-7" />
              <Skeleton className="w-24 h-3" />
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="space-y-3">
          <Skeleton className="w-36 h-4" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        </div>

        {/* Recent reports */}
        <div className="space-y-3">
          <Skeleton className="w-28 h-4" />
          <div className="bg-surface border border-white/8 rounded-xl divide-y divide-white/5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3.5 gap-4">
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="w-32 h-4" />
                  <Skeleton className="w-24 h-3" />
                </div>
                <Skeleton className="w-16 h-5 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  )
}
