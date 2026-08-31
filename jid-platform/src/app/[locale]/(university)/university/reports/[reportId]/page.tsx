import { EmptyUniversityState } from '@/app/[locale]/(company)/_components/empty-university-state'
import { UniversityReportMethodology } from '@/app/[locale]/(university)/university/reports/_components/university-report-methodology'
import { UniversityReportResults } from '@/app/[locale]/(university)/university/reports/_components/university-report-results'
import { requireAuthenticatedUser } from '@/lib/auth/require-authenticated-user'
import { fetchUniversityReport } from '@/lib/university/wave12-queries'
import { Link } from '@/lib/i18n/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'

type UniversityReportDetailPageProps = {
  params: { reportId: string }
}

export default async function UniversityReportDetailPage({ params }: UniversityReportDetailPageProps) {
  await requireAuthenticatedUser()
  const t = await getTranslations('university.reports')
  const locale = await getLocale()
  const payload = await fetchUniversityReport(params.reportId)

  if (!payload.ok) {
    if (payload.fail_closed_reason === 'unmapped') {
      return (
        <EmptyUniversityState
          title={t('unmappedTitle')}
          description={t('unmappedDescription')}
          ctaHref="/university/profile"
          ctaLabel={t('unmappedCta')}
        />
      )
    }
    notFound()
  }

  return (
    <article className="space-y-5" data-testid="university-report-snapshot">
      <header className="rounded-2xl border border-border bg-background p-5">
        <h1 className="text-2xl font-semibold text-foreground">{t('snapshotTitle')}</h1>
        <p className="text-foreground/65 mt-2 text-sm">{t('accreditation')}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/university/reports/${params.reportId}/print`}
            className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm font-medium"
          >
            {t('print')}
          </Link>
          <a
            href={`/${locale}/university/reports/${params.reportId}/export`}
            className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            {t('exportCsv')}
          </a>
          <Link
            href="/university/reports"
            className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm font-medium"
          >
            {t('backToReports')}
          </Link>
        </div>
      </header>
      <UniversityReportMethodology payload={payload} />
      <UniversityReportResults payload={payload} />
    </article>
  )
}
