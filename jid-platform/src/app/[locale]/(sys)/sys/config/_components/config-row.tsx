'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'
import {
  platformConfigValueTypeSchema,
  type PlatformConfigRow,
} from '@/lib/sys/platform-config'
import { displayConfigValue } from '@/lib/sys/platform-config-queries'
import { Button } from '@/components/ui/button'

export function ConfigRow({ config }: { config: PlatformConfigRow }) {
  const t = useTranslations('sys.config.row')
  const valueType = platformConfigValueTypeSchema.parse(config.value_type)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-jid-line bg-white p-4">
      <div className="min-w-0">
        <p className="font-medium text-jid-ink">{config.key}</p>
        {config.description ? (
          <p className="mt-1 text-sm text-jid-ink/55">{config.description}</p>
        ) : null}
        <p className="mt-2 font-mono text-xs text-jid-ink/60">{displayConfigValue(config)}</p>
        <p className="mt-1 text-xs text-jid-ink/45">
          {valueType}
          {config.is_secret ? ` · ${t('secret')}` : ''}
        </p>
      </div>
      <Button type="button" variant="outline" size="sm" asChild>
        <Link href={`/sys/config/${encodeURIComponent(config.key)}`}>{t('edit')}</Link>
      </Button>
    </div>
  )
}
