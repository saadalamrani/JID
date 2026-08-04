import { getTranslations } from 'next-intl/server'
import { fetchStaffLammahReviewQueue } from '@/lib/staff/lammah-queries'
import { LammahNav } from '../_components/lammah-nav'
import { LammahReviewQueue } from './_components/lammah-review-queue'

export default async function StaffLammahReviewPage() {
  const [t,queue]=await Promise.all([
    getTranslations('staff.lammah.review'),fetchStaffLammahReviewQueue(),
  ])
  return <div className="space-y-6">
    <header><h1 className="text-2xl font-semibold">{t('title')}</h1><p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p></header>
    <LammahNav />
    <LammahReviewQueue queue={queue} />
  </div>
}
