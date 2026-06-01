import { Shell } from '@/components/dashboard/shell'

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/5 ${className}`} />
}

export default function ReportsLoading() {
  return (
    <Shell title="Reports" subtitle="Loading…">
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div />
          <Skeleton className="w-28 h-9 rounded-lg" />
        </div>
        <div className="bg-surface border border-white/8 rounded-xl overflow-hidden">
          <div className="border-b border-white/8 px-5 py-3 flex gap-6">
            {['w-20', 'w-24', 'w-16', 'w-20'].map((w, i) => (
              <Skeleton key={i} className={`${w} h-3`} />
            ))}
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-6 px-5 py-4 border-b border-white/5 last:border-0">
              <Skeleton className="w-32 h-4 flex-shrink-0" />
              <Skeleton className="w-28 h-4" />
              <Skeleton className="w-16 h-5 rounded-full" />
              <Skeleton className="w-20 h-4" />
              <div className="ml-auto">
                <Skeleton className="w-12 h-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  )
}
