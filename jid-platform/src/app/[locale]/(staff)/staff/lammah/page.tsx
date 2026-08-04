import { getTranslations } from 'next-intl/server'
import { fetchStaffLammahOverview, requireLammahStaffAccess } from '@/lib/staff/lammah-queries'
import { LammahNav } from './_components/lammah-nav'
import { LammahOperations } from './_components/lammah-operations'

export default async function StaffLammahPage() {
  const [t,profile,overview]=await Promise.all([
    getTranslations('staff.lammah'),requireLammahStaffAccess(),fetchStaffLammahOverview(),
  ])
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
      </header>
      <LammahNav />
      <LammahOperations overview={overview} isSuperAdmin={profile.role==='super_admin'} />
    </div>
  )
}
