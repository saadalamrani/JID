import { ShimmerBlock } from '@/components/ui/skeleton'
import { cardSkeletonShell } from '@/lib/ui/consistency'
import { cn } from '@/lib/utils'

type JobCardSkeletonProps = {
  className?: string
}

export function JobCardSkeleton({ className }: JobCardSkeletonProps) {
  return (
    <article className={cn('flex min-h-[300px] flex-col p-4', cardSkeletonShell, className)} aria-hidden>
      <div className="flex items-start gap-3">
        <ShimmerBlock className="h-12 w-12 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1 space-y-2">
          <ShimmerBlock className="h-4 w-2/3 max-w-[10rem]" />
          <ShimmerBlock className="h-5 w-full max-w-[14rem]" />
        </div>
        <ShimmerBlock className="h-6 w-20 shrink-0 rounded-full" />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <ShimmerBlock className="h-6 w-16 rounded-full" />
        <ShimmerBlock className="h-6 w-20 rounded-full" />
        <ShimmerBlock className="h-6 w-24 rounded-full" />
      </div>

      <ShimmerBlock className="mt-3 h-9 w-full rounded-lg" />

      <ShimmerBlock className="mt-2 h-4 w-24" />

      <div className="mt-auto pt-4">
        <ShimmerBlock className="h-10 w-full rounded-lg" />
      </div>
    </article>
  )
}
