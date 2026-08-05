import { HomeHeroFloatingCards } from '@/app/[locale]/(public)/_components/landing/home-hero-floating-cards'
import { Logo } from '@/components/brand/logo'
import type { HomeHeroFloatingCard } from '@/lib/navigation/home-hero-cards'
import { cn } from '@/lib/utils'

type HomeHeroVisualProps = {
  cards: HomeHeroFloatingCard[]
}

/**
 * Calm on-brand hero plane: official mark + optional real-data cards only.
 * No decorative metrics, gradients, or illustrative fake UI.
 */
export function HomeHeroVisual({ cards }: HomeHeroVisualProps) {
  return (
    <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
      <div
        className={cn(
          'relative flex min-h-[16rem] w-full flex-col justify-between overflow-hidden rounded-xl border border-jid-line/40 bg-jid-beige p-6 md:min-h-[18rem] md:p-8',
        )}
      >
        <div className="flex items-center">
          <Logo size="lg" className="max-h-10" />
        </div>

        <div className="mt-8 border-t border-jid-olive/10 pt-4">
          {cards.length > 0 ? (
            <HomeHeroFloatingCards cards={cards} />
          ) : (
            <div className="h-16" aria-hidden />
          )}
        </div>
      </div>
    </div>
  )
}
