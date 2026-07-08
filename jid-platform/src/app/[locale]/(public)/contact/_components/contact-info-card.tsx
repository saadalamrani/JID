import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type ContactInfoCardProps = {
  icon: LucideIcon
  title: string
  description: string
  className?: string
}

/** Section 9 — contact sidebar info card. */
export function ContactInfoCard({ icon: Icon, title, description, className }: ContactInfoCardProps) {
  return (
    <article
      className={cn(
        'rounded-xl border border-border bg-card p-5 shadow-sm',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
          aria-hidden
        >
          <Icon className="size-5" />
        </span>
        <div>
          <h2 className="font-arabic text-base font-semibold text-foreground">{title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </div>
    </article>
  )
}
