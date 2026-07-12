import { Skeleton } from '@/components/ui/skeleton'

export function CompanyShellLoading() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-10">
      <div className="space-y-2 text-center">
        <Skeleton className="mx-auto h-8 w-64" />
        <Skeleton className="mx-auto h-4 w-80" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Skeleton className="mx-auto h-8 w-8 rounded-full" />
        <Skeleton className="mx-auto h-8 w-8 rounded-full" />
        <Skeleton className="mx-auto h-8 w-8 rounded-full" />
      </div>
      <div className="space-y-4 rounded-xl border border-border bg-white p-6">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full max-w-xs" />
      </div>
    </div>
  )
}
