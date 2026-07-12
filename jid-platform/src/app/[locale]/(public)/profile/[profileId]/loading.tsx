import { Skeleton } from '@/components/ui/skeleton'

export default function IndividualProfileLoading() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <div className="container-jid flex flex-col gap-6 py-8 lg:grid lg:grid-cols-[minmax(260px,300px)_minmax(0,1fr)_minmax(220px,260px)]">
        <div className="order-1 space-y-4">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-col items-center gap-3">
              <Skeleton className="h-24 w-24 rounded-full" />
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
          </div>
        </div>
        <div className="order-2 flex gap-2 lg:hidden">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="order-3 flex gap-2 overflow-hidden lg:hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-20 shrink-0 rounded-full" />
          ))}
        </div>
        <main className="order-4 min-w-0 space-y-10 lg:order-2 lg:col-start-2">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-36 w-full rounded-xl" />
            <Skeleton className="h-36 w-full rounded-xl" />
          </div>
        </main>
        <aside className="order-5 hidden space-y-4 lg:order-3 lg:col-start-3 lg:block">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </aside>
      </div>
    </div>
  )
}
