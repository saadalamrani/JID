/** Section 6.2 — market trends shimmer (full trends section ships Day 7). */
export function TrendsSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden>
      <div className="h-6 w-48 rounded bg-jid-line/30" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-56 rounded-xl border border-jid-line bg-jid-line/10" />
        <div className="h-56 rounded-xl border border-jid-line bg-jid-line/10" />
      </div>
    </div>
  )
}
