import { ShimmerBlock } from '@/components/ui/skeleton'
import { cardSkeletonShell } from '@/lib/ui/consistency'

/** Section 6.2 — announcements billboard shimmer. */
export function BillboardSkeleton() {
  return (
    <div className={`min-h-[280px] p-6 ${cardSkeletonShell}`} aria-hidden>
      <ShimmerBlock className="h-5 w-40" />
      <ShimmerBlock className="mt-6 h-8 w-3/4 max-w-md" />
      <ShimmerBlock className="mt-3 h-4 w-full" />
      <ShimmerBlock className="mt-2 h-4 w-5/6" />
      <ShimmerBlock className="mt-8 h-10 w-32 rounded-lg" />
    </div>
  )
}
