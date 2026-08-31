'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Combobox } from '@/components/ui/combobox'
import { Button } from '@/components/ui/button'
import { useUniversitiesCatalog } from '@/lib/queries/universities'
import {
  declareUniversityAffiliation,
  requestUniversityAffiliationReview,
  revokeOwnUniversityAffiliation,
} from '@/lib/university/individual-actions'
import type { UniversityAffiliationRow } from '@/lib/university/wave10-queries'

const PERSON_STATUSES = ['STUDENT', 'GRADUATE', 'OTHER'] as const

type IndividualAffiliationPanelProps = {
  affiliations: UniversityAffiliationRow[]
  catalogNames: Record<string, { name_ar: string; name_en: string }>
}

export function IndividualAffiliationPanel({
  affiliations,
  catalogNames,
}: IndividualAffiliationPanelProps) {
  const t = useTranslations('profile.affiliation')
  const universitiesQuery = useUniversitiesCatalog()
  const [catalogId, setCatalogId] = useState<string | null>(null)
  const [personStatus, setPersonStatus] = useState<(typeof PERSON_STATUSES)[number]>('GRADUATE')
  const [graduationYear, setGraduationYear] = useState('')
  const [reason, setReason] = useState('')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const universities = (universitiesQuery.data ?? []).map((u) => ({
    value: u.id,
    label: `${u.name_ar} — ${u.name_en}`,
    description: u.short_code,
  }))

  function run(action: () => Promise<{ ok: true } | { ok: false; error: string }>) {
    setError(null)
    startTransition(async () => {
      const result = await action()
      if (!result.ok) setError(result.error)
    })
  }

  return (
    <div className="space-y-6" data-testid="individual-affiliation-panel">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
        <p className="max-w-2xl text-sm text-foreground/70">{t('description')}</p>
      </header>

      <section className="rounded-2xl border border-border bg-background p-5">
        <h2 className="text-lg font-semibold text-foreground">{t('declareTitle')}</h2>
        <p className="mt-1 text-sm text-foreground/70">{t('noEmailMandate')}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2 text-sm">
            <span>{t('university')}</span>
            <Combobox
              options={universities}
              value={catalogId}
              onValueChange={setCatalogId}
              placeholder={t('universityPlaceholder')}
              searchPlaceholder={t('universitySearch')}
              emptyText={t('universityEmpty')}
            />
          </label>
          <label className="block space-y-2 text-sm">
            <span>{t('personStatus')}</span>
            <select
              className="block h-11 w-full rounded-md border border-input bg-background px-3"
              value={personStatus}
              onChange={(event) =>
                setPersonStatus(event.target.value as (typeof PERSON_STATUSES)[number])
              }
            >
              {PERSON_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {t(`status.${status}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-2 text-sm">
            <span>{t('graduationYear')}</span>
            <input
              className="block h-11 w-full rounded-md border border-input bg-background px-3"
              inputMode="numeric"
              value={graduationYear}
              onChange={(event) => setGraduationYear(event.target.value)}
            />
          </label>
        </div>
        <Button
          className="mt-4 min-h-11"
          disabled={pending || !catalogId}
          onClick={() =>
            run(() =>
              declareUniversityAffiliation({
                catalogUniversityId: catalogId ?? '',
                personStatus,
                graduationYear: graduationYear ? Number(graduationYear) : null,
              }),
            )
          }
        >
          {t('declare')}
        </Button>
      </section>

      <section className="rounded-2xl border border-border bg-background p-5">
        <h2 className="text-lg font-semibold text-foreground">{t('currentTitle')}</h2>
        {affiliations.length === 0 ? (
          <p className="mt-2 text-sm text-foreground/70">{t('empty')}</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {affiliations.map((row) => {
              const names = catalogNames[row.catalog_university_id]
              return (
                <li key={row.id} className="rounded-lg border border-border p-3">
                  <p className="font-medium text-foreground">
                    {names ? `${names.name_ar} / ${names.name_en}` : row.catalog_university_id}
                  </p>
                  <p className="mt-1 text-sm text-foreground/70">
                    {t(`state.${row.state}`)} · {t(`status.${row.person_status}`)}
                    {row.graduation_year ? ` · ${row.graduation_year}` : ''}
                  </p>
                  {row.state === 'DECLARED' ? (
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <input
                        className="h-11 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm"
                        placeholder={t('reasonPlaceholder')}
                        value={reason}
                        onChange={(event) => setReason(event.target.value)}
                      />
                      <Button
                        variant="outline"
                        className="min-h-11"
                        disabled={pending || reason.trim().length < 8}
                        onClick={() => run(() => requestUniversityAffiliationReview(row.id, reason))}
                      >
                        {t('requestReview')}
                      </Button>
                      <Button
                        variant="ghost"
                        className="min-h-11"
                        disabled={pending || reason.trim().length < 8}
                        onClick={() => run(() => revokeOwnUniversityAffiliation(row.id, reason))}
                      >
                        {t('revoke')}
                      </Button>
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
