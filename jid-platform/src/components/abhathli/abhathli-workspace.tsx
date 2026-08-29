'use client'

import { useMemo, useState, useTransition } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Link, useRouter } from '@/lib/i18n/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { SurfaceStateView } from '@/components/ui/surface-state'
import {
  approveAbhathliAction,
  executeAbhathliAction,
  prepareAbhathliDraftAction,
  searchWithAbhathliAction,
  trackAbhathliRecommendationAction,
} from '@/app/[locale]/(individual)/abhathli/actions'
import type { AbhathliDraft, AbhathliRecommendation } from '@/lib/abhathli/types'
import { OPPORTUNITY_DISCOVERY_FAMILIES, type OpportunityDiscoveryFamily } from '@/lib/opportunity/discovery-types'

type StoredRecommendation = AbhathliRecommendation & { recommendation_id: string }

export function AbhathliWorkspace() {
  const locale = useLocale() as 'ar' | 'en'
  const t = useTranslations('abhathli')
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [recommendations, setRecommendations] = useState<StoredRecommendation[]>([])
  const [drafts, setDrafts] = useState<Record<string, AbhathliDraft>>({})
  const [approved, setApproved] = useState<Record<string, boolean>>({})

  const familyOptions = useMemo(() => [...OPPORTUNITY_DISCOVERY_FAMILIES], [])

  return (
    <div className="space-y-8">
      <PageHeader title={t('title')} description={t('subtitle')} />

      <p className="rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
        {t('boundary')}
      </p>

      <form
        className="grid gap-4 rounded-lg border border-border bg-card p-4"
        onSubmit={(event) => {
          event.preventDefault()
          const form = new FormData(event.currentTarget)
          const families = form.getAll('families').map(String) as OpportunityDiscoveryFamily[]
          startTransition(async () => {
            setError(null)
            const result = await searchWithAbhathliAction({
              keywords: String(form.get('keywords') ?? ''),
              families,
              cities: String(form.get('cities') ?? ''),
              remoteOnly: form.get('remoteOnly') === 'on',
              useCareerRecord: form.get('useCareerRecord') === 'on',
            })
            if (!result.ok) {
              setError(result.error)
              return
            }
            setRecommendations(result.recommendations)
            setDrafts({})
            setApproved({})
          })
        }}
      >
        <label className="text-sm">
          {t('keywords')}
          <Input name="keywords" className="mt-1" placeholder={t('keywordsPlaceholder')} />
        </label>
        <fieldset className="space-y-2">
          <legend className="text-sm">{t('families')}</legend>
          <div className="flex flex-wrap gap-3">
            {familyOptions.map((family) => (
              <label key={family} className="flex min-h-11 items-center gap-2 text-sm">
                <input type="checkbox" name="families" value={family} />
                {t(`family.${family}`)}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="text-sm">
          {t('cities')}
          <Input name="cities" className="mt-1" placeholder={t('citiesPlaceholder')} />
        </label>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input type="checkbox" name="remoteOnly" />
          {t('remoteOnly')}
        </label>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input type="checkbox" name="useCareerRecord" defaultChecked />
          {t('useCareerRecord')}
        </label>
        <Button type="submit" disabled={pending} className="min-h-11">
          {t('search')}
        </Button>
      </form>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {recommendations.length === 0 ? (
        <SurfaceStateView state="empty" title={t('emptyTitle')} description={t('emptyBody')} />
      ) : (
        <ul className="space-y-4">
          {recommendations.map((item) => {
            const title = locale === 'ar' ? item.title_ar || item.title_en : item.title_en || item.title_ar
            const draft = drafts[item.recommendation_id]
            const isApproved = Boolean(approved[item.recommendation_id])
            return (
              <li key={item.recommendation_id} className="space-y-3 rounded-lg border border-border bg-card p-4">
                <div className="space-y-1">
                  <h2 className="text-base font-semibold">{title ?? item.opportunity_id}</h2>
                  {item.organization_name ? (
                    <p className="text-sm text-muted-foreground">{item.organization_name}</p>
                  ) : null}
                  <p className="text-sm text-foreground">
                    {locale === 'ar' ? item.why_included_ar : item.why_included_en}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t('criteriaCoverage', {
                      matched: String(item.matched_count),
                      required: String(item.required_count),
                    })}
                  </p>
                </div>
                {(locale === 'ar' ? item.gaps_ar : item.gaps_en).length > 0 ? (
                  <ul className="list-disc ps-5 text-sm text-muted-foreground">
                    {(locale === 'ar' ? item.gaps_ar : item.gaps_en).map((gap) => (
                      <li key={gap}>{gap}</li>
                    ))}
                  </ul>
                ) : null}
                {draft ? (
                  <pre className="overflow-x-auto whitespace-pre-wrap rounded-md bg-muted/50 p-3 text-sm">
                    {locale === 'ar' ? draft.cover_letter_ar : draft.cover_letter_en}
                  </pre>
                ) : null}
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11"
                    disabled={pending}
                    onClick={() => {
                      startTransition(async () => {
                        const result = await trackAbhathliRecommendationAction({
                          recommendationId: item.recommendation_id,
                        })
                        if (!result.ok) {
                          setError(result.error)
                          return
                        }
                        router.push(`/radar/${result.careerItemId}`)
                      })
                    }}
                  >
                    {t('track')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11"
                    disabled={pending}
                    onClick={() => {
                      startTransition(async () => {
                        const result = await prepareAbhathliDraftAction({
                          recommendationId: item.recommendation_id,
                        })
                        if (!result.ok) {
                          setError(result.error)
                          return
                        }
                        setDrafts((current) => ({ ...current, [item.recommendation_id]: result.draft }))
                      })
                    }}
                  >
                    {t('prepare')}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="min-h-11"
                    disabled={pending || isApproved}
                    onClick={() => {
                      startTransition(async () => {
                        const result = await approveAbhathliAction({
                          recommendationId: item.recommendation_id,
                        })
                        if (!result.ok) {
                          setError(result.error)
                          return
                        }
                        setApproved((current) => ({ ...current, [item.recommendation_id]: true }))
                      })
                    }}
                  >
                    {isApproved ? t('approved') : t('approve')}
                  </Button>
                  <Button
                    type="button"
                    className="min-h-11"
                    disabled={pending || !isApproved}
                    onClick={() => {
                      startTransition(async () => {
                        const result = await executeAbhathliAction({
                          recommendationId: item.recommendation_id,
                        })
                        if (!result.ok) {
                          setError(result.error)
                          return
                        }
                        if (result.href?.startsWith('http')) {
                          window.open(result.href, '_blank', 'noopener,noreferrer')
                          router.push(`/radar/${result.careerItemId}`)
                          return
                        }
                        if (result.href) {
                          router.push(result.href)
                          return
                        }
                        router.push(`/radar/${result.careerItemId}`)
                      })
                    }}
                  >
                    {item.source_class === 'GOVERNED_EXTERNAL' ? t('redirect') : t('apply')}
                  </Button>
                </div>
                {!isApproved ? (
                  <p className="text-xs text-muted-foreground">{t('approvalRequired')}</p>
                ) : null}
                {item.source_class === 'GOVERNED_EXTERNAL' ? (
                  <p className="text-xs text-muted-foreground">{t('externalNotice')}</p>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}

      <p className="text-sm">
        <Link href="/radar" className="underline underline-offset-4">
          {t('openRadar')}
        </Link>
      </p>
    </div>
  )
}
