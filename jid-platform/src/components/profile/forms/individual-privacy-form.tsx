'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/lib/i18n/navigation'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { updateIndividualPrivacy } from '@/lib/profile/mutations'
import type { ProfileRecord } from '@/lib/profile/types'
import {
  individualPrivacySchema,
  type IndividualPrivacyValues,
} from '@/lib/validations/profile'
import { cn } from '@/lib/utils'

type IndividualPrivacyFormProps = {
  profile: ProfileRecord
}

export function IndividualPrivacyForm({ profile }: IndividualPrivacyFormProps) {
  const t = useTranslations('profile.privacy')
  const router = useRouter()

  const form = useForm<IndividualPrivacyValues>({
    resolver: zodResolver(individualPrivacySchema),
    defaultValues: {
      visibility:
        profile.visibility === 'private' ? 'private' : ('discoverable' as const),
      show_profile_to_companies: profile.show_profile_to_companies,
      show_profile_in_university_stats: profile.show_profile_in_university_stats,
    },
  })

  const visibility = form.watch('visibility')

  async function onSubmit(values: IndividualPrivacyValues) {
    try {
      await updateIndividualPrivacy(values)
      toast.success(t('saved'))
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('saveFailed'))
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="container-jid max-w-2xl space-y-6 py-8">
      <h1 className="text-xl font-semibold text-foreground">{t('title')}</h1>
      <p className="text-sm text-muted-foreground">{t('subtitle')}</p>

      <fieldset className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
        <legend className="px-1 text-sm font-medium text-muted-foreground">{t('visibilityLabel')}</legend>
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4">
          <input
            type="radio"
            value="private"
            className="mt-1"
            {...form.register('visibility')}
          />
          <span>
            <span className="block text-sm font-medium text-foreground">{t('visibilityPrivate')}</span>
            <span className="mt-1 block text-xs text-muted-foreground">{t('visibilityPrivateHint')}</span>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4">
          <input
            type="radio"
            value="discoverable"
            className="mt-1"
            {...form.register('visibility')}
          />
          <span>
            <span className="block text-sm font-medium text-foreground">{t('visibilityDiscoverable')}</span>
            <span className="mt-1 block text-xs text-muted-foreground">{t('visibilityDiscoverableHint')}</span>
          </span>
        </label>
      </fieldset>

      <ToggleRow
        checked={form.watch('show_profile_to_companies')}
        disabled={visibility === 'private'}
        onChange={(checked) => form.setValue('show_profile_to_companies', checked, { shouldDirty: true })}
        title={t('showToCompanies')}
        hint={t('showToCompaniesHint')}
      />

      <ToggleRow
        checked={form.watch('show_profile_in_university_stats')}
        disabled={visibility === 'private'}
        onChange={(checked) =>
          form.setValue('show_profile_in_university_stats', checked, { shouldDirty: true })
        }
        title={t('showInUniversityStats')}
        hint={t('showInUniversityStatsHint')}
      />

      <div className="flex gap-3">
        <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={form.formState.isSubmitting}>
          {t('save')}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push('/profile')}>
          {t('backToProfile')}
        </Button>
      </div>
    </form>
  )
}

function ToggleRow({
  checked,
  disabled,
  onChange,
  title,
  hint,
}: {
  checked: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
  title: string
  hint: string
}) {
  return (
    <label
      className={cn(
        'flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-5 shadow-sm',
        disabled && 'opacity-60',
      )}
    >
      <span>
        <span className="block text-sm font-medium text-foreground">{title}</span>
        <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{hint}</span>
      </span>
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 accent-jid-olive"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  )
}
