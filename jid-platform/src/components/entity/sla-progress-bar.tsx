import { cn } from '@/lib/utils'

type SlaProgressBarProps = {
  percent: number
  overdue: boolean
  label: string
}

export function SlaProgressBar({ percent, overdue, label }: SlaProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, percent))

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-jid-ink/70">{label}</span>
        <span className={cn('font-medium', overdue ? 'text-red-600' : 'text-jid-olive')}>
          {clamped}%
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-jid-line">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            overdue ? 'bg-red-500' : 'bg-jid-gold',
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
