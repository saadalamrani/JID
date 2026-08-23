import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { CvBuilderShell } from './_components/cv-builder-shell'
import { initializeCv } from '@/lib/cv/auto-fill'
import { getCurrentViewer } from '@/lib/profile/queries'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('cv.meta')
  return {
    title: t('title'),
  }
}

export default async function CvBuilderPage() {
  const viewer = await getCurrentViewer()
  if (!viewer.userId) {
    redirect('/login')
  }

  const result = await initializeCv()
  if (!result) {
    redirect('/login')
  }

  return (
    <main className="container-jid py-8">
      <CvBuilderShell initialCv={result.cv} created={result.created} />
    </main>
  )
}
