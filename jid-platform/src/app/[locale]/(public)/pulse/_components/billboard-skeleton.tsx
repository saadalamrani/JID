/** Section 6.2 — announcements billboard shimmer (full billboard ships Day 6). */
export function BillboardSkeleton() {
  return (
    <div
      className="min-h-[280px] animate-pulse rounded-xl border border-border bg-border/30 p-6"
      aria-hidden
    >
      <div className="h-5 w-40 rounded bg-border/30" />
      <div className="mt-6 h-8 w-3/4 max-w-md rounded bg-border/30" />
      <div className="mt-3 h-4 w-full rounded bg-border/30" />
      <div className="mt-2 h-4 w-5/6 rounded bg-border/30" />
      <div className="mt-8 h-10 w-32 rounded-lg bg-border/30" />
    </div>
  )
}
