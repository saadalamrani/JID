import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export type FeatureUnavailableProps = {
  title: string
  message: string
  compact?: boolean
  className?: string
}

/**
 * Section 6.3 — feature-flag fallback shell (standard + compact).
 * Warm JID palette: beige-warm surface, gold accent border, ink typography.
 */
export function FeatureUnavailable({
  title,
  message,
  compact = false,
  className,
}: FeatureUnavailableProps) {
  if (compact) {
    return (
      <div
        role="status"
        aria-live="polite"
        className={cn(
          'flex items-center gap-3 rounded-xl border border-accent/40 bg-surface px-4 py-3 shadow-sm',
          className,
        )}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-accent/30 bg-white/70">
          <Sparkles className="h-4 w-4 text-accent" aria-hidden />
        </span>
        <div className="min-w-0 text-start">
          <p className="truncate text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-foreground/65">{message}</p>
        </div>
      </div>
    )
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'relative overflow-hidden rounded-2xl border border-accent/40 bg-surface px-6 py-12 text-center shadow-sm sm:px-10 sm:py-14',
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -end-8 -top-8 h-32 w-32 rounded-full bg-accent/10 blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-10 -start-10 h-36 w-36 rounded-full bg-primary/5 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-accent/35 bg-white/75 shadow-sm backdrop-blur-sm">
        <Sparkles className="h-6 w-6 text-accent" aria-hidden />
      </div>

      <h2 className="relative mt-6 text-xl font-semibold text-foreground sm:text-2xl">
        {title}
      </h2>
      <p className="relative mx-auto mt-3 max-w-md text-sm leading-relaxed text-foreground/65 sm:text-base">
        {message}
      </p>
    </div>
  )
}
