'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useCatalogSectors } from '@/hooks/use-catalog-metadata'
import type { ExperienceLevel } from '@/types/job'
import { EXPERIENCE_LEVELS, EXPERIENCE_LEVEL_LABELS } from '@/types/job'
import type { JobPostingDraft } from '@/lib/validations/job-posting'
import { cn } from '@/lib/utils'
import { RegionCityPicker } from './region-city-picker'

type WizardStepBasicProps = {
  draft: JobPostingDraft
  errors: Partial<Record<keyof JobPostingDraft, string>>
  onChange: (patch: Partial<JobPostingDraft>) => void
}

/** Section 6.2 — title, experience, sector, region/city. */
export function WizardStepBasic({ draft, errors, onChange }: WizardStepBasicProps) {
  const { data: sectors = [], isLoading } = useCatalogSectors()

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="title-ar" className="font-arabic text-foreground">
          عنوان الفرصة (عربي) <span className="text-red-600">*</span>
        </Label>
        <Input
          id="title-ar"
          value={draft.title_ar}
          onChange={(event) => onChange({ title_ar: event.target.value })}
          placeholder="مثال: مهندس برمجيات"
          aria-invalid={Boolean(errors.title_ar)}
          className={cn('font-arabic border-border', errors.title_ar && 'border-red-500')}
        />
        {errors.title_ar ? (
          <p className="font-arabic text-xs text-red-600" role="alert">
            {errors.title_ar}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="title-en" className="font-arabic text-foreground">
          عنوان الفرصة (إنجليزي)
        </Label>
        <Input
          id="title-en"
          dir="ltr"
          value={draft.title_en ?? ''}
          onChange={(event) => onChange({ title_en: event.target.value })}
          placeholder="e.g. Software Engineer"
          className="border-border"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="experience-level" className="font-arabic text-foreground">
          مستوى الخبرة <span className="text-red-600">*</span>
        </Label>
        <select
          id="experience-level"
          value={draft.experience_level}
          onChange={(event) =>
            onChange({ experience_level: event.target.value as ExperienceLevel })
          }
          className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 font-arabic text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {EXPERIENCE_LEVELS.map((level) => (
            <option key={level} value={level}>
              {EXPERIENCE_LEVEL_LABELS[level]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sector" className="font-arabic text-foreground">
          القطاع <span className="text-red-600">*</span>
        </Label>
        <select
          id="sector"
          value={draft.sector_slug}
          onChange={(event) => onChange({ sector_slug: event.target.value })}
          disabled={isLoading}
          aria-invalid={Boolean(errors.sector_slug)}
          className={cn(
            'flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 font-arabic text-sm text-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
            errors.sector_slug && 'border-red-500',
          )}
        >
          <option value="">اختر القطاع</option>
          {sectors.map((sector) => (
            <option key={sector.slug} value={sector.slug}>
              {sector.name_ar ?? sector.name_en}
            </option>
          ))}
        </select>
        {errors.sector_slug ? (
          <p className="font-arabic text-xs text-red-600" role="alert">
            {errors.sector_slug}
          </p>
        ) : null}
      </div>

      <RegionCityPicker
        regionSlug={draft.region_slug}
        city={draft.city}
        onRegionChange={(region_slug) => onChange({ region_slug })}
        onCityChange={(city) => onChange({ city })}
        regionError={errors.region_slug}
        cityError={errors.city}
      />
    </div>
  )
}
