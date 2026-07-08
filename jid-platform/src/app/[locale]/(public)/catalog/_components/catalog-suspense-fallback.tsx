import { ShimmerBlock } from '@/components/ui/skeleton'
import { CompanyCardSkeleton } from './company-card-skeleton'

const SKELETON_COUNT = 8

export function CatalogSuspenseFallback() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <ShimmerBlock className="h-9 w-56 rounded-lg" />
        <ShimmerBlock className="h-4 w-32" />
      </div>
      <ShimmerBlock className="h-24 rounded-xl" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
          <CompanyCardSkeleton key={index} />
        ))}
      </div>
    </div>
  )
}
