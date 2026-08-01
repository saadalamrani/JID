import { cn } from '@/lib/utils'

type SlaProgressBarProps = {
  percent: number
  overdue: boolean
  label: string
}

export function SlaProgressBar({ percent, overdue, label }: SlaProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, percent))

  return (
    <div className="space-y-2" role="group" aria-label={label}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span
          className={cn(
            'font-medium tabular-nums',
            overdue ? 'text-destructive' : 'text-primary',
          )}
        >
          {clamped}%
        </span>
      </div>
      <div
        className="h-2.5 w-full overflow-hidden rounded-md bg-border"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clamped}
        aria-label={label}
      >
        <div
          className={cn(
            'h-full rounded-md transition-all duration-500 motion-reduce:transition-none',
            overdue ? 'bg-destructive' : 'bg-jid-gold',
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
