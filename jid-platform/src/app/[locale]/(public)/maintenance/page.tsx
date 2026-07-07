import { getTranslations } from 'next-intl/server'

export default async function MaintenancePage() {
  const t = await getTranslations('maintenance')

  return (
    <div className="flex min-h-screen items-center justify-center bg-jid-beige/40 p-6">
      <div className="max-w-md rounded-xl border border-jid-line bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-jid-ink">{t('title')}</h1>
        <p className="mt-3 text-sm text-jid-ink/70">{t('description')}</p>
      </div>
    </div>
  )
}
