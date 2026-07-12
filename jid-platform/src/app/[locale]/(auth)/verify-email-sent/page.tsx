import { getTranslations } from 'next-intl/server'
import { AuthShell } from '@/components/auth/auth-shell'
import { Link } from '@/lib/i18n/navigation'

export default async function VerifyEmailSentPage() {
  const t = await getTranslations('auth.verifyEmail')

  return (
    <AuthShell title={t('title')} subtitle={t('subtitle')}>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>{t('instructions')}</p>
        <p>{t('inbucketHint')}</p>
        <Link
          href="/login"
          className="inline-block font-medium text-primary underline-offset-4 hover:underline"
        >
          {t('backToLogin')}
        </Link>
      </div>
    </AuthShell>
  )
}
