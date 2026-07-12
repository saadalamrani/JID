'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from '@/lib/i18n/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { updateIndividualPrivacy } from '@/lib/profile/mutations'
import type { IndividualPrivacyValues } from '@/lib/validations/profile'

type GraduateBadgeControlCardProps = {
  visibleInDirectory: boolean
  hasGraduateBadge: boolean
  privacySettings?: IndividualPrivacyValues
}

export function GraduateBadgeControlCard({
  visibleInDirectory,
  hasGraduateBadge,
  privacySettings,
}: GraduateBadgeControlCardProps) {
  const t = useTranslations('profile.workspace.rail.graduateBadge')
  const router = useRouter()

  const status = !hasGraduateBadge
    ? 'needsReview'
    : visibleInDirectory
      ? 'active'
      : 'hidden'

  async function handleToggle(checked: boolean) {
    if (!privacySettings) return
    try {
      await updateIndividualPrivacy({
        ...privacySettings,
        show_profile_in_university_stats: checked,
      })
      toast.success(t('saved'))
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('saveFailed'))
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t('title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{t(`status.${status}`)}</p>
        {hasGraduateBadge ? (
          <label className="flex items-center justify-between gap-3">
            <span className="text-sm text-foreground">{t('directoryToggle')}</span>
            <Switch
              checked={visibleInDirectory}
              onCheckedChange={(checked) => void handleToggle(checked)}
              aria-label={t('directoryToggle')}
            />
          </label>
        ) : (
          <p className="text-xs text-muted-foreground">{t('earnHint')}</p>
        )}
      </CardContent>
    </Card>
  )
}
