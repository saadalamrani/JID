import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'
import { FlagResolutionForm } from '@/app/[locale]/(staff)/staff/moderation/_components/flag-resolution-form'
import {
  fetchStaffFlagDetail,
  fetchStaffFlagTargetPreview,
} from '@/lib/staff/moderation-queries'

type FlagDetailPageProps = {
  params: Promise<{ id: string }>
}

export default async function StaffFlagDetailPage({ params }: FlagDetailPageProps) {
  const { id } = await params
  const t = await getTranslations('staff.moderation.detail')

  const flag = await fetchStaffFlagDetail(id)
  if (!flag) notFound()

  const preview = await fetchStaffFlagTargetPreview(flag.target_type, flag.target_id)

  return (
    <div className="space-y-6">
      <Link href="/staff/moderation" className="text-sm text-jid-olive hover:underline">
        {t('back')}
      </Link>

      <header>
        <h1 className="text-2xl font-semibold text-jid-ink">{t('title')}</h1>
        <p className="mt-1 text-sm text-jid-ink/60">
          {t('meta', {
            type: flag.target_type,
            reason: flag.reason,
            status: flag.status,
          })}
        </p>
      </header>

      <section className="rounded-lg border border-jid-line bg-white p-5">
        <h2 className="text-sm font-semibold text-jid-ink">{t('reportTitle')}</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-jid-ink/50">{t('reporter')}</dt>
            <dd>{flag.reporter_name ?? t('unknownReporter')}</dd>
          </div>
          <div>
            <dt className="text-jid-ink/50">{t('submitted')}</dt>
            <dd>{new Date(flag.created_at).toLocaleString()}</dd>
          </div>
          {flag.details ? (
            <div className="sm:col-span-2">
              <dt className="text-jid-ink/50">{t('details')}</dt>
              <dd className="whitespace-pre-wrap">{flag.details}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      <section className="rounded-lg border border-jid-line bg-white p-5">
        <h2 className="text-sm font-semibold text-jid-ink">{t('previewTitle')}</h2>
        {preview ? (
          <div className="mt-4 space-y-2">
            <p className="font-medium text-jid-ink">{preview.title}</p>
            {preview.subtitle ? <p className="text-sm text-jid-ink/60">{preview.subtitle}</p> : null}
            {preview.body ? (
              <p className="whitespace-pre-wrap text-sm text-jid-ink/75 line-clamp-6">{preview.body}</p>
            ) : null}
            {preview.href ? (
              <Link href={preview.href} className="text-sm text-jid-olive hover:underline">
                {t('openTarget')}
              </Link>
            ) : null}
          </div>
        ) : (
          <p className="mt-4 text-sm text-jid-ink/50">{t('previewMissing')}</p>
        )}
      </section>

      <FlagResolutionForm flag={flag} />
    </div>
  )
}
