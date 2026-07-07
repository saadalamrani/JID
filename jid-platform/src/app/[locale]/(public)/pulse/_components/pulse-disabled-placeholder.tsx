import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'

/** Section 6.11 — super_admin-only UI when master flag is off (gate runs in page.tsx). */
export async function PulseDisabledPlaceholder() {
  const t = await getTranslations('pulse.disabled')

  return (
    <main className="container-jid flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <div className="max-w-lg rounded-xl border border-jid-line bg-white p-8 shadow-sm">
        <p className="text-sm font-medium text-jid-olive">{t('eyebrow')}</p>
        <h1 className="mt-2 text-2xl font-semibold text-jid-ink">{t('title')}</h1>
        <p className="mt-3 text-sm text-jid-ink/70">{t('description')}</p>
        <Link
          href="/sys/features"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-jid-olive px-4 py-2 text-sm font-medium text-white hover:bg-jid-olive/90"
        >
          {t('featuresLink')}
        </Link>
      </div>
    </main>
  )
}
