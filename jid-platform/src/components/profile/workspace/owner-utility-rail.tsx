'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GraduateBadgeControlCard } from '@/components/profile/workspace/graduate-badge-control-card'
import type { CompletionBreakdownItem } from '@/lib/profile/completion-breakdown'
import type { IndividualPrivacyValues } from '@/lib/validations/profile'

type OwnerUtilityRailProps = {
  completionPct: number
  missing: CompletionBreakdownItem[]
  graduateBadgeVisible: boolean
  hasGraduateBadge: boolean
  privacySettings?: IndividualPrivacyValues
  publicPreviewHref: string
}

export function OwnerUtilityRail({
  completionPct,
  missing,
  graduateBadgeVisible,
  hasGraduateBadge,
  privacySettings,
  publicPreviewHref,
}: OwnerUtilityRailProps) {
  const t = useTranslations('profile.workspace.rail')
  const [showBreakdown, setShowBreakdown] = useState(false)

  return (
    <div className="sticky top-4 space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('completionTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <button
            type="button"
            className="w-full text-start"
            onClick={() => setShowBreakdown((v) => !v)}
            aria-expanded={showBreakdown}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-2xl font-semibold text-foreground">{completionPct}%</span>
              {showBreakdown ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" aria-hidden />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden />
              )}
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </button>

          {showBreakdown ? (
            <ul className="space-y-2 border-t border-border pt-3">
              {missing.length === 0 ? (
                <li className="text-sm text-muted-foreground">{t('completionComplete')}</li>
              ) : (
                missing.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/profile/edit?focus=${item.editFocus ?? item.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {t(`missing.${item.id}`)}
                    </Link>
                  </li>
                ))
              )}
            </ul>
          ) : null}
        </CardContent>
      </Card>

      <GraduateBadgeControlCard
        visibleInDirectory={graduateBadgeVisible}
        hasGraduateBadge={hasGraduateBadge}
        privacySettings={privacySettings}
      />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('previewTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Link
            href={publicPreviewHref}
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            {t('previewLink')}
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
