import { getTranslations } from 'next-intl/server'
import { fetchStaffLammahDeadLetters, requireLammahStaffAccess } from '@/lib/staff/lammah-queries'
import { LammahNav } from '../_components/lammah-nav'
import { LammahDeadLetters } from './_components/lammah-dead-letters'

export default async function StaffLammahDeadLettersPage() {
  const [t, profile, letters] = await Promise.all([
    getTranslations('staff.lammah.deadLetters'),
    requireLammahStaffAccess(),
    fetchStaffLammahDeadLetters(),
  ])

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
      </header>
      <LammahNav />
      <LammahDeadLetters letters={letters} isSuperAdmin={profile.role==='super_admin'} />
    </div>
  )
}
