import { getTranslations } from 'next-intl/server'

type ActorKey = 'individual' | 'employer' | 'university'

const ACTOR_ORDER: readonly ActorKey[] = ['individual', 'employer', 'university'] as const

/**
 * D1 R1 — "the relationship" section. Replaces the former 8-tile module grid and the
 * 3-card problem-statement grid: instead of two separate card grids, one connected
 * structure shows the three actors as vantage points on the same record, joined by a
 * single spine line rather than presented as isolated, comparable tiles.
 */
export async function ActorRelationship() {
  const t = await getTranslations('landing.relationship')

  return (
    <section
      className="border-b border-border bg-card py-16 md:py-20"
      aria-labelledby="relationship-title"
    >
      <div className="container-jid">
        <header className="max-w-2xl">
          <h2
            id="relationship-title"
            className="text-2xl font-semibold text-foreground md:text-3xl"
          >
            {t('title')}
          </h2>
          <p className="text-foreground/65 mt-3 text-sm leading-relaxed md:text-base">
            {t('subtitle')}
          </p>
        </header>

        {/* Not a card grid: three rows sharing one spine line — the connection between
            actors is the point, not a count of tiles. */}
        <ol className="relative mt-10 max-w-3xl border-s-2 border-jid-gold/40 ps-8">
          {ACTOR_ORDER.map((actor) => (
            <li key={actor} className="relative pb-10 last:pb-0">
              <span
                aria-hidden
                className="absolute -start-[calc(2rem+3px)] top-1 h-2.5 w-2.5 rounded-full bg-jid-gold"
              />
              <p className="text-xs font-semibold uppercase tracking-normal text-jid-olive">
                {t(`${actor}.role`)}
              </p>
              <p className="mt-1.5 text-lg font-semibold text-foreground md:text-xl">
                {t(`${actor}.question`)}
              </p>
              <p className="text-foreground/70 mt-2 max-w-xl text-sm leading-relaxed md:text-base">
                {t(`${actor}.body`)}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
