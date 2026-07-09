import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'
import { fetchStaffLammahSources } from '@/lib/staff/lammah-queries'
import { LammahSourcesManager } from './_components/lammah-sources-manager'

export default async function StaffLammahSourcesPage() {
  const t = await getTranslations('staff.lammah.sources')
  const sources = await fetchStaffLammahSources()

  return (
    <div className="space-y-6">
      <header>
        <Link href="/staff/lammah" className="text-sm text-primary hover:underline">
          {t('back')}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
      </header>
      <LammahSourcesManager sources={sources} />
    </div>
  )
}
