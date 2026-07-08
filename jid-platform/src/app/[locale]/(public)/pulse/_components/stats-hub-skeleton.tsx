import { ShimmerBlock } from '@/components/ui/skeleton'
import { cardSkeletonShell } from '@/lib/ui/consistency'

/** Section 6.2 — metrics stats hub shimmer. */
export function StatsHubSkeleton() {
  return (
    <div className={`min-h-[280px] p-4 ${cardSkeletonShell}`} aria-hidden>
      <ShimmerBlock className="h-5 w-28" />
      <div className="mt-4 grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-lg bg-muted/40 p-3">
            <ShimmerBlock className="h-3 w-16" />
            <ShimmerBlock className="mt-2 h-6 w-12" />
          </div>
        ))}
      </div>
    </div>
  )
}
