import { shimmerSurface } from '@/lib/ui/consistency'
import { cn } from '@/lib/utils'

type SkeletonProps = React.HTMLAttributes<HTMLDivElement> & {
  /** shimmer = gradient sweep; pulse = muted fade (default for inline lines). */
  variant?: 'pulse' | 'shimmer'
}

function Skeleton({ className, variant = 'pulse', ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-md',
        variant === 'shimmer' ? shimmerSurface : 'animate-pulse bg-muted',
        className,
      )}
      {...props}
    />
  )
}

/** Gradient shimmer block for card/module loading layouts. */
function ShimmerBlock({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(shimmerSurface, 'rounded-md', className)} {...props} />
}

export { Skeleton, ShimmerBlock }
