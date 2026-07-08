import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type PillProps = {
  icon?: LucideIcon
  children: ReactNode
  className?: string
}

/** Small icon + text badge — Section 4.3 shared pill. */
export function Pill({ icon: Icon, children, className }: PillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-border/50 bg-muted px-2 py-0.5 font-arabic text-xs text-muted-foreground',
        className,
      )}
    >
      {Icon ? <Icon className="h-3 w-3 shrink-0 text-primary" aria-hidden /> : null}
      <span>{children}</span>
    </span>
  )
}
