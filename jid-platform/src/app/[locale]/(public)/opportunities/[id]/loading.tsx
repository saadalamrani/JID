import { Skeleton } from '@/components/ui/skeleton'

export default function JobDetailLoading() {
  return (
    <main className="container-jid space-y-6 py-8">
      <div className="space-y-4 rounded-xl border border-border/40 bg-card p-6">
        <div className="flex gap-4">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-3/4 max-w-lg" />
          </div>
        </div>
        <Skeleton className="h-14 w-full rounded-lg" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-11 w-full max-w-md rounded-lg" />
      </div>
      <div className="space-y-3 rounded-xl border border-border/40 bg-card p-6">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </main>
  )
}
