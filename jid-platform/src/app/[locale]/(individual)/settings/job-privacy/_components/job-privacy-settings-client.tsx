'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useRouter } from '@/lib/i18n/navigation'
import type { JobPrivacyValues } from '@/lib/validations/me'
import { cn } from '@/lib/utils'

export function JobPrivacySettingsClient() {
  const t = useTranslations('settings.jobPrivacy')
  const router = useRouter()
  const [values, setValues] = useState<JobPrivacyValues>({
    show_profile_to_recruiters: false,
    allow_company_direct_contact: false,
    show_application_history: false,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch('/api/me/privacy', { credentials: 'include' })
        const body = (await response.json()) as JobPrivacyValues & { error?: string }
        if (!response.ok) throw new Error(body.error ?? 'تعذّر التحميل')
        setValues({
          show_profile_to_recruiters: body.show_profile_to_recruiters,
          allow_company_direct_contact: body.allow_company_direct_contact,
          show_application_history: body.show_application_history,
        })
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'تعذّر التحميل')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  async function onSave() {
    setSaving(true)
    try {
      const response = await fetch('/api/me/privacy', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(values),
      })
      const body = (await response.json()) as { error?: string }
      if (!response.ok) throw new Error(body.error ?? 'تعذّر الحفظ')
      toast.success(t('saved'))
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'تعذّر الحفظ')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="container-jid py-8 font-arabic text-sm text-muted-foreground">{t('loading')}</p>
  }

  return (
    <div className="container-jid max-w-2xl space-y-6 py-8">
      <div>
        <h1 className="font-arabic text-xl font-semibold text-foreground">{t('title')}</h1>
        <p className="mt-1 font-arabic text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      <ToggleRow
        title={t('showToRecruiters')}
        hint={t('showToRecruitersHint')}
        checked={values.show_profile_to_recruiters}
        onChange={(checked) => setValues((v) => ({ ...v, show_profile_to_recruiters: checked }))}
      />
      <ToggleRow
        title={t('allowDirectContact')}
        hint={t('allowDirectContactHint')}
        checked={values.allow_company_direct_contact}
        onChange={(checked) => setValues((v) => ({ ...v, allow_company_direct_contact: checked }))}
      />
      <ToggleRow
        title={t('showApplicationHistory')}
        hint={t('showApplicationHistoryHint')}
        checked={values.show_application_history}
        onChange={(checked) => setValues((v) => ({ ...v, show_application_history: checked }))}
      />

      <div className="flex gap-3">
        <Button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="bg-primary font-arabic hover:bg-primary/90"
        >
          {t('save')}
        </Button>
        <Button type="button" variant="ghost" className="font-arabic" onClick={() => router.push('/profile')}>
          {t('back')}
        </Button>
      </div>
    </div>
  )
}

function ToggleRow({
  title,
  hint,
  checked,
  onChange,
}: {
  title: string
  hint: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-5 shadow-sm">
      <span>
        <span className="block font-arabic text-sm font-medium text-foreground">{title}</span>
        <span className="mt-1 block font-arabic text-xs leading-relaxed text-muted-foreground">{hint}</span>
      </span>
      <input
        type="checkbox"
        className={cn('mt-1 h-4 w-4 accent-jid-olive')}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={title}
      />
    </label>
  )
}
