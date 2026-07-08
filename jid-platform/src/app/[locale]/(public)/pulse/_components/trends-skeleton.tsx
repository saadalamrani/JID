import { ShimmerBlock } from '@/components/ui/skeleton'
import { cardSkeletonShell } from '@/lib/ui/consistency'
import { cn } from '@/lib/utils'

/** Section 6.2 — market trends shimmer. */
export function TrendsSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <ShimmerBlock className="h-6 w-48" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className={cn('h-56', cardSkeletonShell)} />
        <div className={cn('h-56', cardSkeletonShell)} />
      </div>
    </div>
  )
}
