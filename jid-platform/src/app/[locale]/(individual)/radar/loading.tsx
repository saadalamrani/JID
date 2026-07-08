import { getTranslations } from 'next-intl/server'

export default async function RadarLoading() {
  const t = await getTranslations('radar')

  return (
    <main className="container-jid py-8">
      <div className="mb-6 h-16 animate-pulse rounded-xl bg-muted" aria-hidden />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-48 animate-pulse rounded-xl bg-background/40" aria-hidden />
        <div className="h-48 animate-pulse rounded-xl bg-background/40" aria-hidden />
      </div>
      <p className="sr-only">{t('loading')}</p>
    </main>
  )
}
