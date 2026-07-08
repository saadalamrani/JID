import { ShimmerBlock } from '@/components/ui/skeleton'
import { cardSkeletonShell } from '@/lib/ui/consistency'
import { cn } from '@/lib/utils'

type MentorCardSkeletonProps = {
  className?: string
}

export function MentorCardSkeleton({ className }: MentorCardSkeletonProps) {
  return (
    <article className={cn('flex h-[220px] flex-col p-4', cardSkeletonShell, className)} aria-hidden>
      <div className="flex items-start gap-3">
        <ShimmerBlock className="h-12 w-12 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <ShimmerBlock className="h-5 w-3/4" />
          <ShimmerBlock className="h-4 w-1/2" />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <ShimmerBlock className="h-6 w-16 rounded-full" />
        <ShimmerBlock className="h-6 w-20 rounded-full" />
      </div>
      <ShimmerBlock className="mt-auto h-10 w-full rounded-lg" />
    </article>
  )
}
