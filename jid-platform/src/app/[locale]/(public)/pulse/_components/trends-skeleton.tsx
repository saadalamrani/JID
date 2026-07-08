/** Section 6.2 — market trends shimmer (full trends section ships Day 7). */
export function TrendsSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden>
      <div className="h-6 w-48 rounded bg-border/30" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-56 rounded-xl border border-border bg-border/30" />
        <div className="h-56 rounded-xl border border-border bg-border/30" />
      </div>
    </div>
  )
}
