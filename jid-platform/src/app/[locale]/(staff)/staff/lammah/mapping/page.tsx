import { getTranslations } from 'next-intl/server'
import { fetchStaffLammahMappingQueue } from '@/lib/staff/lammah-queries'
import { LammahNav } from '../_components/lammah-nav'
import { LammahMappingQueue } from './_components/lammah-mapping-queue'

export default async function StaffLammahMappingPage() {
  const [t, queue] = await Promise.all([
    getTranslations('staff.lammah.mapping'),
    fetchStaffLammahMappingQueue(),
  ])

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
      </header>
      <LammahNav />
      <LammahMappingQueue queue={queue} />
    </div>
  )
}
