import { Skeleton } from '@/components/ui/skeleton'

export default function BusinessProfileLoading() {
  return (
    <main className="container-jid space-y-8 py-8">
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <Skeleton className="h-36 w-full rounded-none sm:h-44" />
        <div className="space-y-4 px-5 pb-6 pt-0 sm:px-8">
          <Skeleton className="-mt-8 h-16 w-16 rounded-lg" />
          <Skeleton className="h-8 w-2/3 max-w-md" />
          <Skeleton className="h-4 w-1/2 max-w-xs" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
          <Skeleton className="h-20 w-full" />
        </div>
      </div>

      <div className="space-y-3">
        <Skeleton className="h-6 w-40" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-[300px] w-full rounded-xl" />
          <Skeleton className="h-[300px] w-full rounded-xl" />
        </div>
      </div>
    </main>
  )
}
