import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'bg-sunken rounded animate-pulse',
        className,
      )}
    />
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-surface border border-[var(--cl-border)] rounded p-4 h-24">
            <Skeleton className="h-3 w-20 mb-2" />
            <Skeleton className="h-8 w-16 mb-1" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
      {/* Finding rows */}
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-surface border border-[var(--cl-border)] rounded p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-14 rounded-sm" />
              <Skeleton className="h-5 w-48" />
            </div>
            <Skeleton className="h-5 w-24 rounded-sm" />
          </div>
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  )
}
