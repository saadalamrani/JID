import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'
import { ShellForbidden } from '@/components/shell/shell-forbidden'

/** P-109 — organization profile suspended by platform (no self-service reinstatement). */
export default async function CompanyProfileSuspendedPage() {
  const t = await getTranslations('company.profileSuspended')

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
