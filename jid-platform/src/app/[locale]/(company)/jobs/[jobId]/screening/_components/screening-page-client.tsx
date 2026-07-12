'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { GeneratePanel } from './_components/generate-panel'
import { ScreeningBuilder } from './_components/screening-builder'
import { InvitePanel } from './_components/invite-panel'
import { ResultsBoard } from './_components/results-board'
import type { SsisResultRow, SsisScreening } from '@/lib/ssis/types'

type ApplicantOption = {
  id: string
  label: string
  status: string
}

type ScreeningPageClientProps = {
  jobId: string
  screening: SsisScreening | null
  results: SsisResultRow[]
  applicants: ApplicantOption[]
  ssisEnabled: boolean
}

export function SsisTeaser() {
  const t = useTranslations('company.ssis')
  return (
    <section className="rounded-xl border border-primary/30 bg-surface/60 p-4">
      <h3 className="font-arabic text-sm font-semibold text-primary">{t('teaserTitle')}</h3>
      <p className="mt-1 font-arabic text-sm text-muted-foreground">{t('teaserBody')}</p>
      <a
        href="mailto:sales@jid.sa?subject=SSIS"
        className="mt-3 inline-block font-arabic text-sm text-primary underline"
      >
        {t('salesCta')}
      </a>
    </section>
  )
}

export function ScreeningPageClient({
  jobId,
  screening,
  results,
  applicants,
  ssisEnabled,
}: ScreeningPageClientProps) {
  const router = useRouter()
  const t = useTranslations('company.ssis')

  function refresh() {
    router.refresh()
  }

  if (!ssisEnabled) {
    return <SsisTeaser />
  }

  return (
    <div className="space-y-8">
      {!screening ? (
        <GeneratePanel jobId={jobId} onGenerated={refresh} />
      ) : (
        <>
          {screening.status !== 'active' ? (
            <ScreeningBuilder jobId={jobId} screening={screening} onRefresh={refresh} />
          ) : (
            <p className="rounded-lg bg-emerald-50 px-4 py-2 font-arabic text-sm text-emerald-800">
              {t('activeBanner')}
            </p>
          )}

          {screening.status === 'active' ? (
            <>
              <InvitePanel
                jobId={jobId}
                screening={screening}
                applicants={applicants}
                onInvited={refresh}
              />
              <ResultsBoard
                jobId={jobId}
                results={results}
                passThreshold={screening.pass_threshold}
                onRefresh={refresh}
              />
            </>
          ) : null}
        </>
      )}
    </div>
  )
}
