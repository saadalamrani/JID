import { CompanyCardSkeleton } from './company-card-skeleton'

const SKELETON_COUNT = 8

export function CatalogSuspenseFallback() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-9 w-56 animate-pulse rounded-lg bg-border/30" />
        <div className="h-4 w-32 animate-pulse rounded bg-border/30" />
      </div>
      <div className="h-24 animate-pulse rounded-xl bg-border/30" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
          <CompanyCardSkeleton key={index} />
        ))}
      </div>
    </div>
  )
}
