import { Logo } from '@/components/brand/logo'
import { getTranslations } from 'next-intl/server'

export default async function StaffLoading() {
  const t = await getTranslations('staff.shell')

  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <Logo size="sm" />
      <div className="h-40 animate-pulse rounded-xl bg-background/40" />
      <p className="sr-only">{t('loading')}</p>
    </div>
  )
}
