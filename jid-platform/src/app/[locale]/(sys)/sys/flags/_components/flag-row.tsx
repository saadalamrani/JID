'use client'

import { useState, useTransition } from 'react'
import { Settings } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from '@/lib/i18n/navigation'
import type { FeatureFlag } from '@/lib/governance/schemas'
import { toggleFlagGlobally } from '@/app/[locale]/(sys)/sys/flags/actions'
import { Link } from '@/lib/i18n/navigation'
import { Switch } from '@/components/ui/switch'
import { ConfirmDialog } from './confirm-dialog'

type FlagRowProps = {
  flag: FeatureFlag
}

/** Section 7.2 — single flag row with global toggle + settings link. */
export function FlagRow({ flag }: FlagRowProps) {
  const t = useTranslations('sys.flags.row')
  const locale = useLocale()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [nextEnabled, setNextEnabled] = useState(flag.is_enabled)
  const [error, setError] = useState<string | null>(null)

  const label = locale === 'ar' ? flag.label_ar : flag.label_en
  const description = locale === 'ar' ? flag.description_ar : flag.description_en

  const requestToggle = (checked: boolean) => {
    setNextEnabled(checked)
    setConfirmOpen(true)
  }

  const handleConfirm = async (reason: string) => {
    const result = await toggleFlagGlobally(flag.key, nextEnabled, reason)
    if (!result.ok) {
      throw new Error(result.error)
    }
    setError(null)
    startTransition(() => router.refresh())
  }

  return (
    <>
      <div className="flex items-center justify-between gap-4 rounded-lg border border-jid-line bg-white px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-jid-ink">{label}</p>
            <code className="rounded bg-jid-beige/60 px-1.5 py-0.5 text-[11px] text-jid-ink/60">
              {flag.key}
            </code>
          </div>
          {description ? <p className="mt-1 text-sm text-jid-ink/55">{description}</p> : null}
          {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <Switch
            checked={flag.is_enabled}
            onCheckedChange={requestToggle}
            disabled={pending}
            aria-label={t('toggleAria', { key: flag.key })}
          />
          <Link
            href={`/sys/flags/${encodeURIComponent(flag.key)}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-jid-line text-jid-ink/60 transition-colors hover:bg-jid-beige/60 hover:text-jid-olive"
            aria-label={t('settingsAria', { key: flag.key })}
          >
            <Settings className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={nextEnabled ? t('enableTitle', { key: flag.key }) : t('disableTitle', { key: flag.key })}
        description={t('toggleDescription')}
        destructive={!nextEnabled}
        onConfirm={handleConfirm}
      />
    </>
  )
}
