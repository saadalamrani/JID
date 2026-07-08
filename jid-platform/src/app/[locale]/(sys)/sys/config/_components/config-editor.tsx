'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/lib/i18n/navigation'
import {
  formatPlatformConfigForEdit,
  platformConfigValueTypeSchema,
  type PlatformConfigRow,
} from '@/lib/sys/platform-config'
import { displayConfigValue } from '@/lib/sys/platform-config-queries'
import { updateConfig } from '@/app/[locale]/(sys)/sys/config/actions'
import { ConfirmDialog } from '@/app/[locale]/(sys)/sys/flags/_components/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Link } from '@/lib/i18n/navigation'

type ConfigEditorProps = {
  config: PlatformConfigRow
  showBackLink?: boolean
}

export function ConfigEditor({ config, showBackLink = false }: ConfigEditorProps) {
  const t = useTranslations('sys.config.editor')
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const valueType = platformConfigValueTypeSchema.parse(config.value_type)
  const [draft, setDraft] = useState(formatPlatformConfigForEdit(valueType, config.value))

  const handleConfirm = async (reason: string) => {
    const result = await updateConfig(config.key, draft, reason)
    if (!result.ok) {
      setError(result.error)
      throw new Error(result.error)
    }
    setError(null)
    startTransition(() => router.refresh())
  }

  const inputId = `config-edit-${config.key}`

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-5">
      {showBackLink ? (
        <Link href="/sys/config" className="text-sm text-primary hover:underline">
          {t('back')}
        </Link>
      ) : null}

      <header>
        <h2 className="text-lg font-semibold text-foreground">{config.key}</h2>
        {config.description ? <p className="mt-1 text-sm text-muted-foreground">{config.description}</p> : null}
      </header>

      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">{t('category')}</dt>
          <dd>{config.category}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t('valueType')}</dt>
          <dd>{valueType}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-muted-foreground">{t('currentValue')}</dt>
          <dd className="font-mono text-xs">{displayConfigValue(config)}</dd>
        </div>
      </dl>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="space-y-2">
        <Label htmlFor={inputId}>{t('newValue')}</Label>
        {valueType === 'boolean' ? (
          <select
            id={inputId}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm"
          >
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        ) : valueType === 'json' ? (
          <textarea
            id={inputId}
            rows={8}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full rounded-md border border-border px-3 py-2 font-mono text-xs"
          />
        ) : (
          <input
            id={inputId}
            type={valueType === 'number' ? 'number' : 'text'}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm"
            dir="ltr"
          />
        )}
        {config.is_secret ? <p className="text-xs text-muted-foreground">{t('secretHint')}</p> : null}
      </div>

      <Button type="button" disabled={pending} onClick={() => setConfirmOpen(true)}>
        {t('save')}
      </Button>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t('confirmTitle')}
        description={t('confirmDescription')}
        onConfirm={handleConfirm}
      />
    </div>
  )
}
