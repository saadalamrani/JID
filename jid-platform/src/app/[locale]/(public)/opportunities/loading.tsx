import { Skeleton } from '@/components/ui/skeleton'

export default function OpportunitiesLoading() {
  return (
    <main className="container-jid space-y-4 py-8">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-32" />
      <div className="mt-6 space-y-2">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-5 w-full max-w-md" />
        ))}
      </div>
    </main>
  )
}
