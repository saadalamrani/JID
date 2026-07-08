import { ShimmerBlock } from '@/components/ui/skeleton'
import { cardSkeletonShell } from '@/lib/ui/consistency'
import { cn } from '@/lib/utils'

type CompanyCardSkeletonProps = {
  className?: string
}

export function CompanyCardSkeleton({ className }: CompanyCardSkeletonProps) {
  return (
    <article className={cn('flex min-h-[220px] flex-col p-4', cardSkeletonShell, className)} aria-hidden>
      <div className="flex items-start gap-3">
        <ShimmerBlock className="h-12 w-12 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1 space-y-2">
          <ShimmerBlock className="h-5 w-3/4 max-w-[12rem]" />
          <ShimmerBlock className="h-4 w-1/2 max-w-[8rem]" />
        </div>
        <ShimmerBlock className="h-6 w-20 shrink-0 rounded-full" />
      </div>

      <div className="mt-3 flex gap-2">
        <ShimmerBlock className="h-4 w-24" />
        <ShimmerBlock className="h-4 w-20" />
      </div>

      <div className="mt-auto pt-4">
        <ShimmerBlock className="h-10 w-full rounded-lg" />
      </div>

      <ShimmerBlock className="mt-3 h-3 w-40" />
    </article>
  )
}
