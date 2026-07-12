import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'
import { ShellForbidden } from '@/components/shell/shell-forbidden'

/** P-109 — university profile suspended by platform. */
export default async function UniversityProfileSuspendedPage() {
  const t = await getTranslations('university.profileSuspended')

  return (
    <ShellForbidden
      title={t('title')}
      message={t('message')}
      action={
        <Link href="/contact" className="text-sm font-medium text-primary hover:underline">
          {t('contactSupport')}
        </Link>
      }
    />
  )
}
