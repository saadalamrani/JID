import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'
import type { IndividualHomeModel } from '@/lib/individual-home/get-individual-home-model'

type AttentionPanelProps = {
  model: IndividualHomeModel
}

/**
 * D1 R2, section 2 — "what needs my attention". 0-5 specific items, each one
 * sentence + at most one action (R1-C §6.1). Honest, calm empty state — not a
 * congratulatory "all caught up!" celebration (R1-B §2 tone rule: plain
 * confirmation, no celebration).
 */
export async function AttentionPanel({ model }: AttentionPanelProps) {
  const t = await getTranslations('individualHome.attention')

  return (
    <section aria-labelledby="attention-title">
      <h2 id="attention-title" className="text-sm font-semibold text-jid-olive">
        {t('title')}
      </h2>

      {model.attention.length === 0 ? (
        <p className="text-foreground/60 mt-2 text-sm">{t('empty')}</p>
      ) : (
        <ul className="mt-2 divide-y divide-border border-y border-border">
          {model.attention.map((item, index) => {
            if (item.kind === 'incomplete_profile') {
              return (
                <li
                  key={`incomplete-${index}`}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <span className="text-sm text-foreground">{t('incompleteProfile.text')}</span>
                  <Link
                    href={item.href}
                    className="shrink-0 text-sm font-medium text-jid-olive underline underline-offset-4 hover:text-jid-gold"
                  >
                    {t('incompleteProfile.action')}
                  </Link>
                </li>
              )
            }
            return (
              <li key={`invited-${index}`} className="flex items-center justify-between gap-4 py-3">
                <span className="text-sm text-foreground">
                  {t('applicationInvited.text', { jobTitle: item.jobTitle })}
                </span>
                <Link
                  href={item.href}
                  className="shrink-0 text-sm font-medium text-jid-olive underline underline-offset-4 hover:text-jid-gold"
                >
                  {t('applicationInvited.action')}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
