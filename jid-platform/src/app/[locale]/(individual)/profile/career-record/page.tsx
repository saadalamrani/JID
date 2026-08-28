import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'

import { CareerRecordRoute } from '@/features/career-record'
import { getCareerRecordCopy } from '@/features/career-record/copy'
import { isValidLocale } from '@/lib/i18n/config'
import { getCurrentViewer } from '@/lib/profile/queries'

export async function generateMetadata(): Promise<Metadata> {
  const localeValue = await getLocale()
  const locale = isValidLocale(localeValue) ? localeValue : 'ar'
  return { title: getCareerRecordCopy(locale).metaTitle }
}

export default async function CareerRecordPage() {
  const viewer = await getCurrentViewer()
  if (!viewer.userId) {
    redirect('/login')
  }

  return (
    <main className="container-jid py-8">
      <CareerRecordRoute />
    </main>
  )
}
