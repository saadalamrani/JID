'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { LammahSource } from '@/types/lammah'
import { createLammahSource, toggleLammahSourceActive } from '../../actions'

type LammahSourcesManagerProps = {
  sources: LammahSource[]
}

export function LammahSourcesManager({ sources }: LammahSourcesManagerProps) {
  const t = useTranslations('staff.lammah.sources')
  const [pending, startTransition] = useTransition()
  const [name, setName] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [sourceType, setSourceType] = useState<LammahSource['sourceType']>('rss')
  const [trustTier, setTrustTier] = useState<1 | 2>(2)

  const onCreate = () => {
    startTransition(async () => {
      const result = await createLammahSource({ name, baseUrl, sourceType, trustTier })
      if (!result.ok) {
        window.alert(result.error)
        return
      }
      setName('')
      setBaseUrl('')
    })
  }

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="font-arabic text-lg font-semibold">{t('addTitle')}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="lammah-source-name">{t('name')}</Label>
            <Input id="lammah-source-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lammah-source-url">{t('baseUrl')}</Label>
            <Input id="lammah-source-url" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lammah-source-type">{t('type')}</Label>
            <select
              id="lammah-source-type"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value as LammahSource['sourceType'])}
            >
              <option value="rss">RSS</option>
              <option value="career_page">{t('careerPage')}</option>
              <option value="api">API</option>
              <option value="official_program">{t('officialProgram')}</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lammah-trust-tier">{t('trustTier')}</Label>
            <select
              id="lammah-trust-tier"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={trustTier}
              onChange={(e) => setTrustTier(Number(e.target.value) as 1 | 2)}
            >
              <option value={1}>{t('tier1')}</option>
              <option value={2}>{t('tier2')}</option>
            </select>
          </div>
        </div>
        <Button type="button" className="mt-4" disabled={pending || !name.trim() || !baseUrl.trim()} onClick={onCreate}>
          {t('addCta')}
        </Button>
      </section>

      <section className="space-y-3">
        <h2 className="font-arabic text-lg font-semibold">{t('listTitle')}</h2>
        {sources.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        ) : (
          <ul className="grid gap-3">
            {sources.map((source) => (
              <li key={source.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-arabic font-semibold">{source.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{source.baseUrl}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t('sourceMeta', {
                        type: source.sourceType,
                        tier: source.trustTier,
                        failures: source.consecutiveFailures,
                      })}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant={source.isActive ? 'outline' : 'default'}
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        const result = await toggleLammahSourceActive(source.id, !source.isActive)
                        if (!result.ok) window.alert(result.error)
                      })
                    }
                  >
                    {source.isActive ? t('deactivate') : t('activate')}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
