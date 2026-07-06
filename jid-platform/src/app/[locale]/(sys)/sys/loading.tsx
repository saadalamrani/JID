import { getTranslations } from 'next-intl/server'

export default async function SysLoading() {
  const t = await getTranslations('sys.shell')

  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <div className="h-10 w-48 animate-pulse rounded-lg bg-jid-beige/60" />
      <div className="h-40 animate-pulse rounded-xl bg-jid-beige/40" />
      <p className="sr-only">{t('loading')}</p>
    </div>
  )
}
