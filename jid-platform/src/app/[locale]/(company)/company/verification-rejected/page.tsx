import {
  canReapplyNow,
  formatRequiredDocuments,
  getLatestRejectedVerification,
} from '@/lib/entity/rejected-claim'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Link } from '@/lib/i18n/navigation'
import { getLocale, getTranslations } from 'next-intl/server'

export default async function CompanyVerificationRejectedPage() {
  const t = await getTranslations('entity.rejected')
  const locale = (await getLocale()) as 'ar' | 'en'
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const verification = await getLatestRejectedVerification(supabase, user.id, 'business')
  if (!verification) redirect('/signup/entity-type')

  const canReapply = canReapplyNow(verification.can_reapply_after)

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <div className="rounded-xl border border-red-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-foreground">{t('title')}</h1>
        <p className="mt-2 text-sm text-foreground/70">{verification.company_name}</p>

        <div className="mt-6 space-y-3 text-sm">
          <p>
            <span className="text-foreground/60">{t('reason')}:</span>{' '}
            <span className="font-medium">{verification.rejection_reason}</span>
          </p>
          <p>
            <span className="text-foreground/60">{t('requiredDocuments')}:</span>{' '}
            <span className="font-medium">
              {formatRequiredDocuments(verification.required_documents, locale)}
            </span>
          </p>
          {verification.can_reapply_after ? (
            <p className="text-foreground/70">
              {canReapply
                ? t('canReapplyNow')
                : t('blockedUntil', {
                    date: new Date(verification.can_reapply_after).toLocaleString(
                      locale === 'ar' ? 'ar-SA' : 'en-US',
                    ),
                  })}
            </p>
          ) : null}
        </div>

        {canReapply ? (
          <Link
            href="/company/verification/reapply"
            className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            {t('reapplyCta')}
          </Link>
        ) : (
          <p className="mt-6 rounded-md bg-background p-3 text-sm text-foreground/70">
            {t('blockedMessage')}
          </p>
        )}
      </div>
    </div>
  )
}
