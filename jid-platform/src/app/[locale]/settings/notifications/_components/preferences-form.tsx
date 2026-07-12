'use client'

import { useMemo, useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import { updatePreference } from '@/app/[locale]/settings/notifications/actions'
import { Switch } from '@/components/ui/switch'
import { CATEGORY_GROUPS } from '@/lib/notifications/category-groups'
import type { NotificationPreferenceChannel } from '@/lib/notifications/preference-defaults'
import type { ResolvedNotificationPreference } from '@/lib/notifications/preference-defaults'
import type { NotificationCategory } from '@/lib/notifications/types'
import { cn } from '@/lib/utils'

type PreferencesFormProps = {
  initialPreferences: ResolvedNotificationPreference[]
}

type PreferenceState = Record<
  NotificationCategory,
  ResolvedNotificationPreference
>

function toPreferenceState(rows: ResolvedNotificationPreference[]): PreferenceState {
  return Object.fromEntries(rows.map((row) => [row.category, row])) as PreferenceState
}

export function PreferencesForm({ initialPreferences }: PreferencesFormProps) {
  const t = useTranslations('settings.notifications')
  const [preferences, setPreferences] = useState<PreferenceState>(() =>
    toPreferenceState(initialPreferences),
  )
  const [pendingKey, setPendingKey] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const matrixCategoryCount = useMemo(
    () => CATEGORY_GROUPS.reduce((sum, group) => sum + group.categories.length, 0),
    [],
  )

  const handleToggle = (
    category: NotificationCategory,
    channel: NotificationPreferenceChannel,
    value: boolean,
  ) => {
    const current = preferences[category]
    if (!current || current.is_mandatory) return

    const column =
      channel === 'in_app'
        ? 'in_app_enabled'
        : channel === 'email'
          ? 'email_enabled'
          : 'include_in_digest'

    const previous = { ...current }
    const optimistic = {
      ...current,
      [column]: value,
      has_user_override: true,
    }

    setPreferences((state) => ({ ...state, [category]: optimistic }))
    setPendingKey(`${category}:${channel}`)

    startTransition(async () => {
      const result = await updatePreference({ category, channel, value })
      setPendingKey(null)

      if (!result.ok) {
        setPreferences((state) => ({ ...state, [category]: previous }))
        toast.error(result.error || t('updateError'))
        return
      }

      toast.success(t('updateSaved'))
    })
  }

  return (
    <div className="space-y-4">
      <div
        role="status"
        className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
      >
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <p className="font-arabic leading-relaxed">{t('securityBanner')}</p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-white">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-background/30 text-start">
              <th scope="col" className="px-4 py-3 font-medium text-foreground">
                {t('columns.category')}
              </th>
              <th scope="col" className="px-4 py-3 text-center font-medium text-foreground">
                {t('columns.inApp')}
              </th>
              <th scope="col" className="px-4 py-3 text-center font-medium text-foreground">
                {t('columns.email')}
              </th>
              <th scope="col" className="px-4 py-3 text-center font-medium text-foreground">
                {t('columns.digest')}
              </th>
            </tr>
          </thead>
          <tbody>
            {CATEGORY_GROUPS.map((group) => (
              <GroupSection
                key={group.id}
                groupId={group.id}
                categories={group.categories}
                preferences={preferences}
                pendingKey={pendingKey}
                onToggle={handleToggle}
                t={t}
              />
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        {t('matrixMeta', { count: matrixCategoryCount })}
      </p>
    </div>
  )
}

function GroupSection({
  groupId,
  categories,
  preferences,
  pendingKey,
  onToggle,
  t,
}: {
  groupId: string
  categories: readonly NotificationCategory[]
  preferences: PreferenceState
  pendingKey: string | null
  onToggle: (
    category: NotificationCategory,
    channel: NotificationPreferenceChannel,
    value: boolean,
  ) => void
  t: ReturnType<typeof useTranslations<'settings.notifications'>>
}) {
  return (
    <>
      <tr className="border-b border-border bg-background/20">
        <td colSpan={4} className="px-4 py-2 text-xs font-semibold uppercase text-primary">
          {t(`groups.${groupId}`)}
        </td>
      </tr>
      {categories.map((category) => {
        const row = preferences[category]
        if (!row) return null

        return (
          <tr key={category} className="border-b border-border/70 last:border-b-0">
            <td className="px-4 py-3 align-middle">
              <div className="min-w-[12rem]">
                <p className="font-medium text-foreground">{t(`categories.${category}`)}</p>
                {row.is_mandatory ? (
                  <p className="mt-0.5 text-[11px] text-amber-700">{t('mandatoryBadge')}</p>
                ) : null}
              </div>
            </td>
            <ChannelCell
              category={category}
              channel="in_app"
              checked={row.in_app_enabled}
              disabled={row.is_mandatory}
              pending={pendingKey === `${category}:in_app`}
              label={t('columns.inApp')}
              categoryLabel={t(`categories.${category}`)}
              onToggle={onToggle}
            />
            <ChannelCell
              category={category}
              channel="email"
              checked={row.email_enabled}
              disabled={row.is_mandatory}
              pending={pendingKey === `${category}:email`}
              label={t('columns.email')}
              categoryLabel={t(`categories.${category}`)}
              onToggle={onToggle}
            />
            <ChannelCell
              category={category}
              channel="digest"
              checked={row.include_in_digest}
              disabled={row.is_mandatory}
              pending={pendingKey === `${category}:digest`}
              label={t('columns.digest')}
              categoryLabel={t(`categories.${category}`)}
              onToggle={onToggle}
            />
          </tr>
        )
      })}
    </>
  )
}

function ChannelCell({
  category,
  channel,
  checked,
  disabled,
  pending,
  label,
  categoryLabel,
  onToggle,
}: {
  category: NotificationCategory
  channel: NotificationPreferenceChannel
  checked: boolean
  disabled: boolean
  pending: boolean
  label: string
  categoryLabel: string
  onToggle: (
    category: NotificationCategory,
    channel: NotificationPreferenceChannel,
    value: boolean,
  ) => void
}) {
  return (
    <td className="px-4 py-3 text-center align-middle">
      <div
        className={cn(
          'inline-flex items-center justify-center',
          pending && 'opacity-60',
        )}
      >
        <Switch
          checked={checked}
          disabled={disabled || pending}
          onCheckedChange={(value) => onToggle(category, channel, value)}
          aria-label={`${categoryLabel} — ${label}`}
        />
      </div>
    </td>
  )
}
