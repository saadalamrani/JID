'use client'

import { useTranslations } from 'next-intl'
import type { BusinessProfileDraft } from '@/lib/validations/business-profile'
import { BusinessProfileView } from '@/components/profiles/business-profile-view'
import { draftToBusinessProfileData, type DirectoryReferenceData } from '@/types/business-profile-public'

type ProfileStepPreviewProps = {
  draft: BusinessProfileDraft
  directory: DirectoryReferenceData
}

export function ProfileStepPreview({ draft, directory }: ProfileStepPreviewProps) {
  const t = useTranslations('company.profileCreation.preview')

  return (
    <div className="space-y-4">
      <p className="text-sm text-foreground/70">{t('intro')}</p>
      <BusinessProfileView
        mode="preview"
        profile={draftToBusinessProfileData(draft, { directoryId: directory.id })}
        directory={directory}
        openings={[]}
      />
    </div>
  )
}
