import { getTranslations } from 'next-intl/server'
import { fetchStaffLammahReviewDetail, requireLammahStaffAccess } from '@/lib/staff/lammah-queries'
import { LammahNav } from '../../_components/lammah-nav'
import { LammahReviewDetailClient } from './_components/lammah-review-detail-client'

export default async function StaffLammahReviewDetailPage({params}:{params:{candidateId:string}}) {
  const [t,profile,detail]=await Promise.all([
    getTranslations('staff.lammah.detail'),requireLammahStaffAccess(),
    fetchStaffLammahReviewDetail(params.candidateId),
  ])
  return <div className="space-y-6">
    <header><h1 className="text-2xl font-semibold">{t('title')}</h1><p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p></header>
    <LammahNav />
    <LammahReviewDetailClient detail={detail} isSuperAdmin={profile.role==='super_admin'} />
  </div>
}
