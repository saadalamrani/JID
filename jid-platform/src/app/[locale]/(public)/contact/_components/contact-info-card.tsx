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
        'rounded-xl border border-jid-line/70 bg-white p-5 shadow-sm',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-jid-olive/10 text-jid-olive"
          aria-hidden
        >
          <Icon className="size-5" />
        </span>
        <div>
          <h2 className="font-arabic text-base font-semibold text-jid-ink">{title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-jid-ink/70">{description}</p>
        </div>
      </div>
    </article>
  )
}
