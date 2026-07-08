/** Section 6.2 — metrics stats hub shimmer (full stats hub ships Day 6). */
export function StatsHubSkeleton() {
  return (
    <div
      className="min-h-[280px] animate-pulse rounded-xl border border-border bg-border/30 p-4"
      aria-hidden
    >
      <div className="h-5 w-28 rounded bg-border/30" />
      <div className="mt-4 grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-lg bg-border/30 p-3">
            <div className="h-3 w-16 rounded bg-border/30" />
            <div className="mt-2 h-6 w-12 rounded bg-border/30" />
          </div>
        ))}
      </div>
    </div>
  )
}
