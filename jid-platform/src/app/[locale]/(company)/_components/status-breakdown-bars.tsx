'use client'

type StatusBreakdownBarsProps = {
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

function formatLabel(key: string): string {
  const map: Record<string, string> = {
    current_student: 'طالب حالي',
    expected_graduate: 'متوقع التخرج',
    graduate: 'خريج',
    alumni: 'خريج سابق',
    other: 'أخرى',
    unspecified: 'غير محدد',
  }
  return map[key] ?? key
}

export function StatusBreakdownBars({ data }: StatusBreakdownBarsProps) {
  const entries = Object.entries(parseJsonMap(data)).filter(([, value]) => Number(value) > 0)
  const total = entries.reduce((sum, [, value]) => sum + Number(value), 0)

  if (!entries.length || total === 0) {
    return <p className="text-sm text-jid-ink/60">لا توجد بيانات حالة دراسية حالياً.</p>
  }

  return (
    <div className="space-y-3">
      {entries.map(([status, raw]) => {
        const value = Number(raw)
        const pct = Math.max(2, Math.round((value / total) * 100))
        return (
          <div key={status} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-jid-ink">{formatLabel(status)}</span>
              <span className="font-medium text-jid-ink/70">{value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-jid-beige">
              <div className="h-full rounded-full bg-jid-olive" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
