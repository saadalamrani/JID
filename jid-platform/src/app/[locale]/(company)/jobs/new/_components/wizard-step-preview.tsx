'use client'

import { useMemo } from 'react'
import { JobCard } from '@/app/[locale]/(public)/opportunities/_components/job-card'
import { Button } from '@/components/ui/button'
import { computeDeadlineDaysLeft } from '@/lib/jobs/deadline'
import type { ApprovedCompanyPoster } from '@/lib/jobs/poster-types'
import type { JobPostingDraft } from '@/lib/validations/job-posting'
import type { JobCardData } from '@/types/job'
import { useCatalogRegions, useCatalogSectors } from '@/hooks/use-catalog-metadata'

type WizardStepPreviewProps = {
  draft: JobPostingDraft
  poster: ApprovedCompanyPoster
  submitting: boolean
  onSaveDraft: () => void
  onPublish: () => void
}

function buildPreviewJob(
  draft: JobPostingDraft,
  poster: ApprovedCompanyPoster,
  sectorName: { name_ar: string | null; name_en: string } | null,
  regionName: { name_ar: string | null; name_en: string } | null,
): JobCardData {
  const deadlineIso = draft.application_deadline
    ? new Date(`${draft.application_deadline}T12:00:00`).toISOString()
    : new Date().toISOString()

  return {
    id: 'preview',
    slug: null,
    title_ar: draft.title_ar,
    title_en: draft.title_en?.trim() || null,
    experience_level: draft.experience_level,
    status: 'active',
    city: draft.city || null,
    is_remote: false,
    salary_min: null,
    salary_max: null,
    salary_currency: 'SAR',
    application_deadline: deadlineIso,
    deadlineDaysLeft: computeDeadlineDaysLeft(deadlineIso),
    published_at: null,
    applicant_count: 0,
    applyUrl: draft.external_apply_url.trim() || null,
    company: {
      id: poster.company.id,
      slug: null,
      name_en: poster.company.name,
      name_ar: poster.company.name_ar,
      logo_url: poster.company.logo_url,
      ownership_type: poster.company.ownership_type,
      career_portal_url: null,
    },
    sector: sectorName
      ? {
          slug: draft.sector_slug,
          name_en: sectorName.name_en,
          name_ar: sectorName.name_ar,
        }
      : null,
    region: regionName
      ? {
          slug: draft.region_slug,
          name_en: regionName.name_en,
          name_ar: regionName.name_ar,
        }
      : null,
    tier: 'normal',
    isBoosted: false,
    boostStartsAt: null,
    boostEndsAt: null,
  }
}

/** Section 6.4 — live JobCard preview + draft/publish actions. */
export function WizardStepPreview({
  draft,
  poster,
  submitting,
  onSaveDraft,
  onPublish,
}: WizardStepPreviewProps) {
  const { data: sectors = [] } = useCatalogSectors()
  const { data: regions = [] } = useCatalogRegions()

  const sector = sectors.find((item) => item.slug === draft.sector_slug) ?? null
  const region = regions.find((item) => item.slug === draft.region_slug) ?? null

  const previewJob = useMemo(
    () => buildPreviewJob(draft, poster, sector, region),
    [draft, poster, sector, region],
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-arabic text-sm font-medium text-jid-ink/70">معاينة البطاقة</h2>
        <p className="mt-1 font-arabic text-xs text-jid-ink/50">
          هكذا ستظهر الفرصة في لوحة الفرص العامة
        </p>
      </div>

      <div className="mx-auto max-w-sm" aria-live="polite">
        <JobCard job={previewJob} previewMode />
      </div>

      {draft.description_ar ? (
        <div className="rounded-lg border border-jid-line/60 bg-jid-beige/30 p-4">
          <h3 className="mb-2 font-arabic text-sm font-medium text-jid-ink">الوصف</h3>
          <p className="whitespace-pre-wrap font-arabic text-sm leading-relaxed text-jid-ink/80">
            {draft.description_ar}
          </p>
          {draft.required_skills.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {draft.required_skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-white px-2.5 py-0.5 font-arabic text-xs text-jid-ink/70"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={submitting}
          onClick={onSaveDraft}
          className="font-arabic border-jid-line"
        >
          حفظ كمسودة
        </Button>
        <Button
          type="button"
          disabled={submitting}
          onClick={onPublish}
          className="bg-jid-olive font-arabic hover:bg-jid-olive/90"
        >
          نشر الفرصة الآن
        </Button>
      </div>
    </div>
  )
}
