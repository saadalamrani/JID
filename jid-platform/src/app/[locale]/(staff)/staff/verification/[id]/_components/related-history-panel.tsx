'use client'

import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'
import type { RelatedVerificationHistoryItem } from '@/lib/staff/verification-review-shared'

type RelatedHistoryPanelProps = {
  items: RelatedVerificationHistoryItem[]
}

/** Section 7.4 / Wave 2A — previous verification requests from same user or same entity. */
export function RelatedHistoryPanel({ items }: RelatedHistoryPanelProps) {
  const t = useTranslations('staff.verificationReview.workspace.relatedHistory')
  const locale = useLocale()
  const dateLocale = locale.startsWith('ar') ? 'ar-SA' : 'en-US'

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-sm font-semibold text-jid-olive">{t('title')}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{t('subtitle')}</p>

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{t('empty')}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-md border border-border p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link
                    href={`/staff/verification/${item.id}`}
                    className="truncate text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jid-gold/60"
                  >
                    {item.company_name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {t(`relation.${item.relation}`)} · {item.verification_type}
                  </p>
                </div>
                <span className="shrink-0 rounded-md border border-border bg-jid-beige px-2 py-0.5 text-[10px] font-medium uppercase text-jid-olive">
                  {item.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(item.created_at).toLocaleString(dateLocale, {
                  numberingSystem: 'latn',
                })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
