'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from '@/lib/i18n/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  MENTOR_MEDIUM_OPTIONS,
  type MentorMediumValue,
} from '@/lib/mentor-application/constants'
import { track } from '@/lib/analytics/track'
import type { MentorHubSettings } from '@/lib/mentor-hub/queries'
import { cn } from '@/lib/utils'

type MentorPostApprovalSetupProps = {
  settings: MentorHubSettings
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Task 3 — one-time mentor expertise/availability setup after staff approval. */
export function MentorPostApprovalSetup({
  settings,
  open,
  onOpenChange,
}: MentorPostApprovalSetupProps) {
  const t = useTranslations('mentorship.hub.postApprovalSetup')
  const locale = useLocale()
  const router = useRouter()
  const [expertiseDraft, setExpertiseDraft] = useState('')
  const [expertiseAreas, setExpertiseAreas] = useState(settings.expertise_areas)
  const [preferredMediums, setPreferredMediums] = useState<string[]>(settings.preferred_mediums)
  const [saving, setSaving] = useState(false)

  function addExpertise() {
    const value = expertiseDraft.trim()
    if (!value || expertiseAreas.length >= 5 || expertiseAreas.includes(value)) return
    setExpertiseAreas([...expertiseAreas, value])
    setExpertiseDraft('')
  }

  function toggleMedium(value: MentorMediumValue) {
    setPreferredMediums((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    )
  }

  async function handleSave() {
    if (expertiseAreas.length === 0 || preferredMediums.length === 0) {
      toast.error(t('validation'))
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/mentor/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          expertise_areas: expertiseAreas,
          preferred_mediums: preferredMediums,
          finalize_mentor_setup: true,
        }),
      })
      const body = (await response.json().catch(() => null)) as { error?: string } | null
      if (!response.ok) throw new Error(body?.error ?? t('saveError'))

      track('mentor_setup_completed', { expertise_count: expertiseAreas.length })
      toast.success(t('saveSuccess'))
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('saveError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-arabic">{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <p className="font-arabic text-sm font-medium text-jid-ink">{t('expertiseLabel')}</p>
            <div className="flex gap-2">
              <Input
                value={expertiseDraft}
                onChange={(event) => setExpertiseDraft(event.target.value)}
                placeholder={t('expertisePlaceholder')}
              />
              <Button type="button" variant="outline" onClick={addExpertise} disabled={expertiseAreas.length >= 5}>
                {t('add')}
              </Button>
            </div>
            {expertiseAreas.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {expertiseAreas.map((area) => (
                  <li
                    key={area}
                    className="rounded-full bg-jid-beige px-3 py-1 text-xs font-medium text-jid-ink"
                  >
                    {area}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <fieldset className="space-y-2">
            <legend className="font-arabic text-sm font-medium text-jid-ink">{t('mediumsLabel')}</legend>
            <div className="flex flex-wrap gap-2">
              {MENTOR_MEDIUM_OPTIONS.map((option) => {
                const label = locale === 'ar' ? option.labelAr : option.labelEn
                const active = preferredMediums.includes(option.value)
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleMedium(option.value)}
                    className={cn(
                      'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                      active
                        ? 'border-jid-olive bg-jid-olive/10 text-jid-olive'
                        : 'border-jid-line text-jid-ink/70 hover:bg-jid-beige/50',
                    )}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </fieldset>
        </div>

        <DialogFooter>
          <Button type="button" onClick={handleSave} disabled={saving} className="bg-jid-olive hover:bg-jid-olive/90">
            {saving ? t('saving') : t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
