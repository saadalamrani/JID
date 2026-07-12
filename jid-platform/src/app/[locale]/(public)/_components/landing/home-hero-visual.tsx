import { HomeHeroFloatingCards } from '@/app/[locale]/(public)/_components/landing/home-hero-floating-cards'
import type { HomeHeroFloatingCard } from '@/lib/navigation/home-hero-cards'
import { cn } from '@/lib/utils'

type HomeHeroVisualProps = {
  cards: HomeHeroFloatingCard[]
}

/**
 * Task 5 — abstract on-brand hero visual (no stock photography).
 * Fixed aspect-ratio container; future approved asset can replace the inner composition.
 */
export function HomeHeroVisual({ cards }: HomeHeroVisualProps) {
  return (
    <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
      <div
        className={cn(
          'relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-jid-line/40',
          'bg-gradient-to-br from-jid-beige via-background to-jid-olive-50 shadow-sm',
        )}
      >
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(230,180,58,0.12),transparent_55%)]"
          aria-hidden
        />

        {/* Decorative Radar-style kanban sliver (illustrative, not live data). */}
        <div
          className="absolute bottom-10 start-6 end-[38%] top-10 rounded-xl border border-jid-olive/10 bg-background/55 p-3 shadow-sm backdrop-blur-[2px]"
          aria-hidden
        >
          <div className="mb-2 h-2 w-16 rounded-full bg-jid-olive/15" />
          <div className="grid grid-cols-3 gap-1.5">
            {[0, 1, 2].map((col) => (
              <div key={col} className="space-y-1.5 rounded-lg bg-jid-beige-warm/80 p-1.5">
                <div className="h-1.5 w-8 rounded-full bg-jid-olive/20" />
                <div
                  className={cn(
                    'h-8 rounded-md border border-jid-line/30 bg-background/90',
                    col === 1 && 'border-jid-gold/35',
                  )}
                />
                {col === 0 ? (
                  <div className="h-6 rounded-md border border-jid-line/25 bg-background/70" />
                ) : null}
              </div>
            ))}
          </div>
        </div>

        {/* Decorative profile-completion ring (illustrative). */}
        <div
          className="absolute end-8 top-10 flex h-24 w-24 items-center justify-center rounded-full border border-jid-gold/25 bg-background/40 shadow-sm"
          aria-hidden
        >
          <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90" aria-hidden>
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              className="stroke-jid-olive/15"
              strokeWidth="3"
            />
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              className="stroke-jid-gold/70"
              strokeWidth="3"
              strokeDasharray="72 100"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute h-2 w-6 rounded-full bg-jid-olive/20" />
        </div>

        <div className="absolute start-10 top-14 h-10 w-10 rounded-xl bg-jid-gold/15" aria-hidden />
        <div className="absolute bottom-16 end-14 h-16 w-20 rounded-lg bg-jid-olive/10" aria-hidden />

        <HomeHeroFloatingCards cards={cards} />
      </div>
    </div>
  )
}
