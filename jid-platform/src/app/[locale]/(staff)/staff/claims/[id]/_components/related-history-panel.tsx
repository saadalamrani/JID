'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'
import type { RelatedClaimHistoryItem } from '@/lib/staff/claim-review-shared'

type RelatedHistoryPanelProps = {
  items: RelatedClaimHistoryItem[]
}

/** Section 7.4 — previous claims from same user or same entity. */
export function RelatedHistoryPanel({ items }: RelatedHistoryPanelProps) {
  const t = useTranslations('staff.claimReview.workspace.relatedHistory')

  return (
    <div className="rounded-lg border border-jid-line bg-white p-4">
      <h3 className="text-sm font-semibold text-jid-ink">{t('title')}</h3>
      <p className="mt-1 text-xs text-jid-ink/55">{t('subtitle')}</p>

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-jid-ink/50">{t('empty')}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-md border border-jid-line/80 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link
                    href={`/staff/claims/${item.id}`}
                    className="truncate text-sm font-medium text-jid-olive hover:underline"
                  >
                    {item.company_name}
                  </Link>
                  <p className="text-xs text-jid-ink/55">
                    {t(`relation.${item.relation}`)} · {item.claim_type}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-jid-beige px-2 py-0.5 text-[10px] font-medium uppercase text-jid-ink/70">
                  {item.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-jid-ink/45">
                {new Date(item.created_at).toLocaleString('ar-SA')}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
