import { fetchJobs } from '@/lib/queries/jobs'
import { DEFAULT_JOB_FILTERS } from '@/types/job'
import { localeConfig, type Locale } from '@/lib/i18n/config'

type OpportunitiesPageProps = {
  params: { locale: string }
}

export default async function OpportunitiesPage({ params }: OpportunitiesPageProps) {
  const locale = params.locale as Locale
  const dir = localeConfig.direction[locale] ?? 'rtl'
  const { jobs } = await fetchJobs({
    ...DEFAULT_JOB_FILTERS,
    limit: 50,
    page: 1,
  })

  return (
    <main dir={dir} className="container-jid py-8" lang={locale}>
      <h1 className="font-arabic text-2xl font-semibold text-jid-ink">الفرص الوظيفية</h1>
      <p className="mt-2 font-arabic text-sm text-jid-ink-400">
        {jobs.length} فرصة نشطة (معاينة الطبقة الاستعلامية)
      </p>
      <ul className="mt-6 space-y-2 font-arabic text-jid-ink">
        {jobs.map((job) => {
          const title = job.title_ar || job.title_en || '—'
          const companyName = job.company.name_ar || job.company.name_en
          return (
            <li key={job.id} className="border-b border-jid-line/30 py-2 text-sm">
              {title} — {companyName}
            </li>
          )
        })}
      </ul>
      {jobs.length === 0 ? (
        <p className="mt-4 font-arabic text-sm text-jid-ink-400">لا توجد فرص منشورة حالياً.</p>
      ) : null}
    </main>
  )
}
