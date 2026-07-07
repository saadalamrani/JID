import { cn } from '@/lib/utils'

type ValueCardProps = {
  title: string
  description: string
  accent: 'olive' | 'gold'
}

/** Section 6 — single platform value card (server-rendered). */
export function ValueCard({ title, description, accent }: ValueCardProps) {
  return (
    <article
      className={cn(
        'rounded-xl border bg-white p-6 shadow-sm',
        accent === 'olive' ? 'border-jid-olive/30' : 'border-jid-gold/40',
      )}
    >
      <h3
        className={cn(
          'font-arabic text-lg font-semibold',
          accent === 'olive' ? 'text-jid-olive' : 'text-jid-gold',
        )}
      >
        {title}
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-jid-ink/70">{description}</p>
    </article>
  )
}
