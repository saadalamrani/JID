import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'

import { CvProjectionRoute } from '@/features/cv-projection'
import { getCvProjectionCopy } from '@/features/cv-projection/copy'
import { isValidLocale } from '@/lib/i18n/config'
import { getCurrentViewer } from '@/lib/profile/queries'

export async function generateMetadata(): Promise<Metadata> {
  const localeValue = await getLocale()
  const locale = isValidLocale(localeValue) ? localeValue : 'ar'
  return { title: getCvProjectionCopy(locale).metaTitle }
}

export default async function CvProjectionPage() {
  const viewer = await getCurrentViewer()
  if (!viewer.userId) {
    redirect('/login')
  }

  return (
    <main className="container-jid py-8">
      <CvProjectionRoute />
    </main>
  )
}
