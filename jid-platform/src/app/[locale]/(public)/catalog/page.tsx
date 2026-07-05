import { Suspense } from 'react'
import { localeConfig, type Locale } from '@/lib/i18n/config'
import { CatalogSuspenseFallback } from './_components/catalog-suspense-fallback'
import { CatalogWithData } from './_components/catalog-with-data'

type CatalogPageProps = {
  params: { locale: string }
}

export default function CatalogPage({ params }: CatalogPageProps) {
  const locale = params.locale as Locale
  const dir = localeConfig.direction[locale] ?? 'rtl'

  return (
    <main dir={dir} className="container-jid py-8" lang={locale}>
      <Suspense fallback={<CatalogSuspenseFallback />}>
        <CatalogWithData />
      </Suspense>
    </main>
  )
}
