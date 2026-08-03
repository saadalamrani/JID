'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { configureCatalogPilot, executeCatalogRetention } from '../actions'

export function CatalogAdminControls({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const t = useTranslations('staff.catalog')
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<string | null>(null)
  if (!isSuperAdmin) return null
  const run = (action: () => Promise<{ code: string }>) =>
    startTransition(async () => setResult((await action()).code))
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <h2 className="font-semibold">{t('adminControls')}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t('adminControlsHint')}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          disabled={pending}
          onClick={() => run(() => configureCatalogPilot(true))}
          className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50"
        >
          {t('enablePilot')}
        </button>
        <button
          disabled={pending}
          onClick={() => run(() => configureCatalogPilot(false))}
          className="rounded-md border border-border px-3 py-2 text-sm disabled:opacity-50"
        >
          {t('killConnector')}
        </button>
        <button
          disabled={pending}
          onClick={() => run(executeCatalogRetention)}
          className="rounded-md border border-border px-3 py-2 text-sm disabled:opacity-50"
        >
          {t('runRetention')}
        </button>
      </div>
      {result && (
        <p role="status" className="mt-3 text-sm">
          {result}
        </p>
      )}
    </section>
  )
}
