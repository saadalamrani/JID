import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'
import { ProfilesModerationTable } from './_components/profiles-moderation-table'
import { fetchModerationProfiles } from '@/lib/staff/directory-queries'

type ProfilesModerationPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function readParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

/** P-108 — profile moderation (status actions only; no content editing). */
export default async function ProfilesModerationPage({ searchParams }: ProfilesModerationPageProps) {
  const t = await getTranslations('staff.directory.profiles')
  const params = await searchParams
  const q = readParam(params.q)
  const rows = await fetchModerationProfiles(q, 80)

  return (
    <div className="space-y-6">
      <header>
        <Link href="/staff/directory" className="text-sm text-primary hover:underline">
          {t('back')}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
      </header>
      <ProfilesModerationTable rows={rows} initialQ={q} />
    </div>
  )
}
