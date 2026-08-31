import { UniversityReportMethodology } from '@/app/[locale]/(university)/university/reports/_components/university-report-methodology'
import { UniversityReportResults } from '@/app/[locale]/(university)/university/reports/_components/university-report-results'
import { requireAuthenticatedUser } from '@/lib/auth/require-authenticated-user'
import { fetchUniversityReport } from '@/lib/university/wave12-queries'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'

type UniversityReportPrintPageProps = {
  params: { reportId: string }
}

export default async function UniversityReportPrintPage({ params }: UniversityReportPrintPageProps) {
  await requireAuthenticatedUser()
  const t = await getTranslations('university.reports')
  const payload = await fetchUniversityReport(params.reportId)
  if (!payload.ok) notFound()

  return (
    <article className="mx-auto max-w-3xl space-y-5 p-4 print:p-0" data-testid="university-report-print">
      <header className="print:block">
        <h1 className="text-2xl font-semibold text-foreground">{t('printTitle')}</h1>
        <p className="text-foreground/65 mt-2 text-sm">{t('accreditation')}</p>
        <p className="text-foreground/65 mt-1 text-sm">
          {t('methodologyVersion')}: {payload.methodology_version}
        </p>
      </header>
      <UniversityReportMethodology payload={payload} />
      <UniversityReportResults payload={payload} />
    </article>
  )
}
