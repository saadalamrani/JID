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
        'rounded-xl border bg-card p-6 shadow-sm',
        accent === 'olive' ? 'border-primary/25' : 'border-border',
      )}
    >
      <h3
        className={cn(
          'font-arabic text-lg font-semibold',
          accent === 'olive' ? 'text-primary' : 'text-accent',
        )}
      >
        {title}
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
    </article>
  )
}
