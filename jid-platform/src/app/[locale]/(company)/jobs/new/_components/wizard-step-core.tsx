'use client'

import { Label } from '@/components/ui/label'
import type { JobPostingDraft } from '@/lib/validations/job-posting'
import { getDeadlineInputBounds } from '@/lib/validations/job-posting'
import { cn } from '@/lib/utils'
import { ExternalApplyUrlField, TagInput } from './domain-validator'

type WizardStepCoreProps = {
  draft: JobPostingDraft
  errors: Partial<Record<keyof JobPostingDraft, string>>
  companyDomains: string[]
  onChange: (patch: Partial<JobPostingDraft>) => void
}

/** Section 6.3 — apply URL, deadline, description, skills. */
export function WizardStepCore({ draft, errors, companyDomains, onChange }: WizardStepCoreProps) {
  const { min, max } = getDeadlineInputBounds()

  return (
    <div className="space-y-5">
      <ExternalApplyUrlField
        value={draft.external_apply_url}
        companyDomains={companyDomains}
        onChange={(external_apply_url) => onChange({ external_apply_url })}
        error={errors.external_apply_url}
      />

      <div className="space-y-2">
        <Label htmlFor="application-deadline" className="font-arabic text-foreground">
          الموعد النهائي للتقديم <span className="text-red-600">*</span>
        </Label>
        <p className="font-arabic text-xs text-foreground/60">
          من غداً حتى ستة أشهر من اليوم
        </p>
        <input
          id="application-deadline"
          type="date"
          min={min}
          max={max}
          value={draft.application_deadline}
          onChange={(event) => onChange({ application_deadline: event.target.value })}
          aria-invalid={Boolean(errors.application_deadline)}
          className={cn(
            'flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
            errors.application_deadline && 'border-red-500',
          )}
        />
        {errors.application_deadline ? (
          <p className="font-arabic text-xs text-red-600" role="alert">
            {errors.application_deadline}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description-ar" className="font-arabic text-foreground">
          وصف الفرصة (عربي) <span className="text-red-600">*</span>
        </Label>
        <textarea
          id="description-ar"
          rows={6}
          value={draft.description_ar}
          onChange={(event) => onChange({ description_ar: event.target.value })}
          placeholder="صف المسؤوليات والمتطلبات والمزايا..."
          aria-invalid={Boolean(errors.description_ar)}
          className={cn(
            'w-full rounded-md border border-border bg-white px-3 py-2 font-arabic text-sm text-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
            errors.description_ar && 'border-red-500',
          )}
        />
        {errors.description_ar ? (
          <p className="font-arabic text-xs text-red-600" role="alert">
            {errors.description_ar}
          </p>
        ) : null}
      </div>

      <TagInput
        label="المهارات المطلوبة"
        hint="أضف مهارة واحدة على الأقل (حتى 20 مهارة)"
        items={draft.required_skills}
        onChange={(required_skills) => onChange({ required_skills })}
        error={errors.required_skills as string | undefined}
      />
    </div>
  )
}
