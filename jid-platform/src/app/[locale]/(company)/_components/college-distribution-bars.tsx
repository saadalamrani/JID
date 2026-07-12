'use client'

type CollegeDistributionBarsProps = {
  data: Record<string, number> | string | null | undefined
}

function parseJsonMap(input: Record<string, number> | string | null | undefined): Record<string, number> {
  if (!input) return {}
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input) as Record<string, number>
      return parsed ?? {}
    } catch {
      return {}
    }
  }
  return input
}

export function CollegeDistributionBars({ data }: CollegeDistributionBarsProps) {
  const entries = Object.entries(parseJsonMap(data))
    .map(([name, value]) => [name, Number(value)] as const)
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])

  const total = entries.reduce((sum, [, value]) => sum + value, 0)
  const max = entries[0]?.[1] ?? 0

  if (!entries.length || total === 0) {
    return <p className="text-sm text-foreground/60">لا توجد بيانات توزيع الكليات حالياً.</p>
  }

  return (
    <div className="space-y-3">
      {entries.map(([name, value]) => {
        const pct = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 0
        const ratio = Math.round((value / total) * 100)
        return (
          <div key={name} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="truncate text-foreground">{name}</span>
              <span className="font-medium text-foreground/70">
                {value} ({ratio}%)
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-background">
              <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
