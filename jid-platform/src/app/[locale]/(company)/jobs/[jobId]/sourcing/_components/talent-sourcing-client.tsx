'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Link } from '@/lib/i18n/navigation'
import { Button } from '@/components/ui/button'
import type { HiringIntelligenceReport, SourcingComparisonGrid, TalentSearchHit } from '@/types/contracts/talent-sourcing'
import type { CriterionRef } from '@/lib/talent-sourcing/relevance'

type TalentSourcingClientProps = {
  jobId: string
}

export function TalentSourcingClient({ jobId }: TalentSourcingClientProps) {
  const t = useTranslations('company.talentSourcing')
  const locale = useLocale()
  const isAr = locale === 'ar'

  const [criteria, setCriteria] = useState<CriterionRef[]>([])
  const [hits, setHits] = useState<TalentSearchHit[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [grid, setGrid] = useState<SourcingComparisonGrid | null>(null)
  const [intelligence, setIntelligence] = useState<HiringIntelligenceReport | null>(null)
  const [labelAr, setLabelAr] = useState('')
  const [labelEn, setLabelEn] = useState('')
  const [messageAr, setMessageAr] = useState('')
  const [messageEn, setMessageEn] = useState('')
  const [inviteTarget, setInviteTarget] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [searchRes, intelRes] = await Promise.all([
        fetch(`/api/company/jobs/${jobId}/talent`),
        fetch(`/api/company/jobs/${jobId}/talent/intelligence`),
      ])
      const searchJson = (await searchRes.json()) as {
        criteria?: CriterionRef[]
        hits?: TalentSearchHit[]
        error?: string
      }
      if (!searchRes.ok) throw new Error(searchJson.error ?? t('loadFailed'))
      setCriteria(searchJson.criteria ?? [])
      setHits(searchJson.hits ?? [])
      if (intelRes.ok) {
        setIntelligence((await intelRes.json()) as HiringIntelligenceReport)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [jobId, t])

  useEffect(() => {
    void load()
  }, [load])

  const selectedHits = useMemo(
    () => hits.filter((hit) => selected.includes(hit.profileId)),
    [hits, selected],
  )

  async function addCriterion(event: React.FormEvent) {
    event.preventDefault()
    const response = await fetch(`/api/company/jobs/${jobId}/talent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ labelAr, labelEn }),
    })
    const json = (await response.json()) as { error?: string }
    if (!response.ok) {
      toast.error(json.error ?? t('criterionFailed'))
      return
    }
    setLabelAr('')
    setLabelEn('')
    toast.success(t('criterionSaved'))
    await load()
  }

  function toggle(profileId: string) {
    setSelected((current) =>
      current.includes(profileId)
        ? current.filter((id) => id !== profileId)
        : current.length >= 5
          ? current
          : [...current, profileId],
    )
  }

  async function compare() {
    const response = await fetch(`/api/company/jobs/${jobId}/talent/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileIds: selected }),
    })
    const json = (await response.json()) as SourcingComparisonGrid & { error?: string }
    if (!response.ok) {
      toast.error(json.error ?? t('compareFailed'))
      return
    }
    setGrid(json)
  }

  async function invite(profileId: string) {
    const response = await fetch(`/api/company/jobs/${jobId}/talent/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidateProfileId: profileId, messageAr, messageEn }),
    })
    const json = (await response.json()) as { error?: string }
    if (!response.ok) {
      toast.error(json.error ?? t('inviteFailed'))
      return
    }
    toast.success(t('inviteSent'))
    setInviteTarget(null)
    setMessageAr('')
    setMessageEn('')
    await load()
  }

  return (
    <section className="container-jid space-y-8 py-6" data-testid="talent-sourcing-page">
      <header className="space-y-2">
        <p className="text-xs text-muted-foreground">
          <Link href={`/jobs/${jobId}/applicants`} className="underline-offset-2 hover:underline">
            {t('backToApplicants')}
          </Link>
        </p>
        <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{t('subtitle')}</p>
      </header>

      <form onSubmit={addCriterion} className="space-y-3 rounded-xl border border-border p-4">
        <h2 className="text-base font-medium">{t('criteriaTitle')}</h2>
        <p className="text-sm text-muted-foreground">{t('criteriaHint')}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span>{t('labelAr')}</span>
            <input
              className="min-h-11 w-full rounded-md border border-border bg-background px-3"
              value={labelAr}
              onChange={(event) => setLabelAr(event.target.value)}
              required
            />
          </label>
          <label className="space-y-1 text-sm">
            <span>{t('labelEn')}</span>
            <input
              className="min-h-11 w-full rounded-md border border-border bg-background px-3"
              value={labelEn}
              onChange={(event) => setLabelEn(event.target.value)}
              required
            />
          </label>
        </div>
        <Button type="submit" className="min-h-11">
          {t('addCriterion')}
        </Button>
        {criteria.length > 0 ? (
          <ul className="space-y-1 text-sm">
            {criteria.map((criterion) => (
              <li key={criterion.id}>{isAr ? criterion.labelAr : criterion.labelEn}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">{t('noCriteria')}</p>
        )}
      </form>

      <div className="space-y-3">
        <h2 className="text-base font-medium">{t('resultsTitle')}</h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">{t('loading')}</p>
        ) : hits.length === 0 ? (
          <p className="text-sm text-muted-foreground" data-testid="talent-sourcing-empty">
            {t('empty')}
          </p>
        ) : (
          <ul className="space-y-3">
            {hits.map((hit) => (
              <li
                key={hit.profileId}
                className="space-y-3 rounded-xl border border-border p-4"
                data-testid="talent-hit"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{hit.displayName || t('unnamed')}</p>
                    {hit.headline ? (
                      <p className="text-sm text-muted-foreground">{hit.headline}</p>
                    ) : null}
                  </div>
                  <label className="flex min-h-11 items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selected.includes(hit.profileId)}
                      onChange={() => toggle(hit.profileId)}
                    />
                    {t('compareSelect')}
                  </label>
                </div>
                <ul className="space-y-1 text-sm">
                  {hit.reasons.map((reason) => (
                    <li key={reason.criterionId}>
                      {reason.evidencePresent ? '• ' : '– '}
                      {isAr ? reason.reasonAr : reason.reasonEn}
                    </li>
                  ))}
                </ul>
                {hit.invitationState ? (
                  <p className="text-xs text-muted-foreground">{t(`state.${hit.invitationState}`)}</p>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11"
                    onClick={() => setInviteTarget(hit.profileId)}
                  >
                    {t('inviteCta')}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {inviteTarget ? (
        <form
          className="space-y-3 rounded-xl border border-border p-4"
          onSubmit={(event) => {
            event.preventDefault()
            void invite(inviteTarget)
          }}
        >
          <h2 className="text-base font-medium">{t('inviteTitle')}</h2>
          <p className="text-sm text-muted-foreground">{t('inviteHint')}</p>
          <label className="block space-y-1 text-sm">
            <span>{t('messageAr')}</span>
            <textarea
              className="min-h-24 w-full rounded-md border border-border bg-background p-3"
              value={messageAr}
              onChange={(event) => setMessageAr(event.target.value)}
              required
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span>{t('messageEn')}</span>
            <textarea
              className="min-h-24 w-full rounded-md border border-border bg-background p-3"
              value={messageEn}
              onChange={(event) => setMessageEn(event.target.value)}
              required
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" className="min-h-11">
              {t('sendInvite')}
            </Button>
            <Button type="button" variant="ghost" className="min-h-11" onClick={() => setInviteTarget(null)}>
              {t('cancel')}
            </Button>
          </div>
        </form>
      ) : null}

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-medium">{t('compareTitle')}</h2>
          <Button type="button" className="min-h-11" disabled={selectedHits.length < 2} onClick={() => void compare()}>
            {t('compareCta')}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">{t('compareHint')}</p>
        {grid ? (
          <div className="overflow-x-auto" data-testid="talent-comparison-grid">
            <table className="w-full min-w-[32rem] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border border-border p-2 text-start">{t('candidate')}</th>
                  {grid.criteria.map((criterion) => (
                    <th key={criterion.criterionId} className="border border-border p-2 text-start">
                      {isAr ? criterion.labelAr : criterion.labelEn}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grid.rows.map((row) => (
                  <tr key={row.profileId}>
                    <td className="border border-border p-2 font-medium">{row.displayName}</td>
                    {row.cells.map((cell) => (
                      <td key={cell.criterionId} className="border border-border p-2 align-top">
                        {isAr ? cell.observationAr : cell.observationEn}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      {intelligence ? (
        <div className="space-y-3" data-testid="hiring-intelligence">
          <h2 className="text-base font-medium">{t('intelligenceTitle')}</h2>
          <p className="text-sm text-muted-foreground">{t('intelligenceHint')}</p>
          <ul className="space-y-3">
            {intelligence.metrics.map((metric) => (
              <li key={metric.id} className="rounded-xl border border-border p-4">
                <p className="font-medium">{isAr ? metric.labelAr : metric.labelEn}</p>
                <p className="text-lg">
                  {metric.unit === 'ratio' ? t('ratioValue', { value: metric.value.toFixed(2) }) : metric.value}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('metricMeta', {
                    source: metric.source,
                    population: metric.population,
                    window: metric.timeWindow,
                    missingness: metric.missingness,
                  })}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}
