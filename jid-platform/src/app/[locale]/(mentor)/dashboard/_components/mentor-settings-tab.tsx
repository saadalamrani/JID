'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from '@/lib/i18n/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { MentorShareCardButton } from '@/components/mentor/mentor-share-card-button'
import {
  MENTOR_MEDIUM_OPTIONS,
  type MentorMediumValue,
} from '@/lib/mentor-application/constants'
import type { MentorHubSettings } from '@/lib/mentor-hub/queries'
import { cn } from '@/lib/utils'

type MentorSettingsTabProps = {
  settings: MentorHubSettings
}

export function MentorSettingsTab({ settings }: MentorSettingsTabProps) {
  const t = useTranslations('mentorship.hub.settings')
  const locale = useLocale()
  const router = useRouter()
  const [isAccepting, setIsAccepting] = useState(settings.is_accepting_requests)
  const [bioLong, setBioLong] = useState(settings.bio_long ?? '')
  const [expertiseDraft, setExpertiseDraft] = useState('')
  const [expertiseAreas, setExpertiseAreas] = useState(settings.expertise_areas)
  const [preferredMediums, setPreferredMediums] = useState<string[]>(settings.preferred_mediums)
  const [saving, setSaving] = useState(false)

  function addExpertise() {
    const value = expertiseDraft.trim()
    if (!value || expertiseAreas.length >= 5) return
    if (expertiseAreas.includes(value)) return
    setExpertiseAreas([...expertiseAreas, value])
    setExpertiseDraft('')
  }

  function toggleMedium(value: MentorMediumValue) {
    setPreferredMediums((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    )
  }

  async function handleSave() {
    setSaving(true)
    try {
      const response = await fetch('/api/mentor/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          is_accepting_requests: isAccepting,
          bio_long: bioLong,
          expertise_areas: expertiseAreas,
          preferred_mediums: preferredMediums,
        }),
      })
      const body = (await response.json().catch(() => null)) as { error?: string } | null
      if (!response.ok) throw new Error(body?.error ?? t('saveError'))
      toast.success(t('saveSuccess'))
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('saveError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-jid-line bg-white p-5 shadow-sm">
        <label className="flex items-center justify-between gap-4 font-arabic">
          <span>
            <span className="block text-sm font-medium text-jid-ink">{t('acceptingLabel')}</span>
            <span className="mt-0.5 block text-xs text-jid-ink/55">{t('acceptingHint')}</span>
          </span>
          <input
            type="checkbox"
            checked={isAccepting}
            onChange={(event) => setIsAccepting(event.target.checked)}
            className="h-5 w-5 rounded border-jid-line text-jid-olive focus:ring-jid-olive"
          />
        </label>
      </section>

      <section className="rounded-xl border border-jid-line bg-white p-5 shadow-sm space-y-2">
        <label htmlFor="mentor-bio" className="font-arabic text-sm font-medium text-jid-ink">
          {t('bioLabel')}
        </label>
        <textarea
          id="mentor-bio"
          value={bioLong}
          onChange={(event) => setBioLong(event.target.value)}
          rows={5}
          className="w-full rounded-lg border border-jid-line px-3 py-2 font-arabic text-sm"
        />
      </section>

      <section className="rounded-xl border border-jid-line bg-white p-5 shadow-sm space-y-3">
        <h3 className="font-arabic text-sm font-medium text-jid-ink">{t('expertiseLabel')}</h3>
        <div className="flex flex-wrap gap-1">
          {expertiseAreas.map((tag) => (
            <button
              key={tag}
              type="button"
              className="rounded-full bg-jid-olive/10 px-2 py-0.5 font-arabic text-xs text-jid-olive"
              onClick={() => setExpertiseAreas(expertiseAreas.filter((item) => item !== tag))}
            >
              {tag} ×
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={expertiseDraft}
            onChange={(event) => setExpertiseDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                addExpertise()
              }
            }}
            placeholder={t('expertisePlaceholder')}
            className="flex-1 rounded-lg border border-jid-line px-3 py-2 font-arabic text-sm"
          />
          <Button type="button" variant="outline" onClick={addExpertise} className="font-arabic">
            {t('addExpertise')}
          </Button>
        </div>
      </section>

      <section className="rounded-xl border border-jid-line bg-white p-5 shadow-sm space-y-3">
        <h3 className="font-arabic text-sm font-medium text-jid-ink">{t('mediumsLabel')}</h3>
        <div className="flex flex-wrap gap-2">
          {MENTOR_MEDIUM_OPTIONS.map((option) => {
            const active = preferredMediums.includes(option.value)
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleMedium(option.value)}
                className={cn(
                  'rounded-lg border px-3 py-2 font-arabic text-sm transition-colors',
                  active
                    ? 'border-jid-olive bg-jid-olive/10 text-jid-olive'
                    : 'border-jid-line text-jid-ink/70',
                )}
              >
                {locale === 'en' ? option.labelEn : option.labelAr}
              </button>
            )
          })}
        </div>
      </section>

      <Button
        type="button"
        disabled={saving}
        onClick={() => void handleSave()}
        className="bg-jid-olive font-arabic hover:bg-jid-olive/90"
      >
        {saving ? t('saving') : t('save')}
      </Button>
    </div>
  )
}
