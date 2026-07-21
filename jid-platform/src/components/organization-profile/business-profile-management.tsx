'use client'

import { useCallback, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link, useRouter } from '@/lib/i18n/navigation'
import { CorrectionSuggestionForm } from '@/app/[locale]/(public)/catalog/_components/correction-suggestion-form'
import { ProfileStepIdentity } from '@/app/[locale]/(company)/company/create-profile/_components/profile-step-identity'
import { ProfileStepStory } from '@/app/[locale]/(company)/company/create-profile/_components/profile-step-story'
import { BusinessProfileView } from '@/components/profiles/business-profile-view'
import { Button } from '@/components/ui/button'
import { buildBusinessProfileChecklist } from '@/lib/profile/organization-profile-checklist'
import type { OwnerBusinessProfile } from '@/lib/profile/owner-business-profile'
import {
  businessProfileDraftSchema,
  businessProfileIdentitySchema,
  businessProfileStorySchema,
  type BusinessProfileDraft,
} from '@/lib/validations/business-profile'
import type { Company } from '@/types/catalog'
import {
  draftToBusinessProfileData,
  parseBusinessProfileGallery,
  type DirectoryReferenceData,
} from '@/types/business-profile-public'
import type { CatalogLookupOption } from '@/types/catalog'
import { updateOwnerBusinessProfileAction } from '@/app/[locale]/(company)/company/create-profile/actions'
import { DirectoryReferenceCard } from './directory-reference-card'
import { HonestEmptyState } from './honest-empty-state'
import {
  OrganizationProfilePanel,
  OrganizationProfileShell,
  type OrganizationProfileSection,
} from './organization-profile-shell'
import { ProfileSectionNav } from './profile-section-nav'
import { RequiredInformationChecklist } from './required-information-checklist'
import { UnsavedChangesDialog } from './unsaved-changes-dialog'

type BusinessProfileManagementProps = {
  profile: OwnerBusinessProfile
  directory: Company
  sectors: CatalogLookupOption[]
  regions: CatalogLookupOption[]
  initialSection?: OrganizationProfileSection
}

function profileToDraft(profile: OwnerBusinessProfile): BusinessProfileDraft {
  return {
    display_name_ar: profile.display_name_ar,
    display_name_en: profile.display_name_en ?? '',
    tagline_ar: profile.tagline_ar ?? '',
    about_ar: profile.about_ar ?? '',
    about_en: profile.about_en ?? '',
    founded_year: profile.founded_year,
    employee_count_range:
      (profile.employee_count_range as BusinessProfileDraft['employee_count_range']) ?? null,
    cover_image_url: profile.cover_image_url ?? '',
  }
}

function zodFieldErrors(error: { path: (string | number)[]; message: string }[]) {
  const map: Partial<Record<keyof BusinessProfileDraft, string>> = {}
  for (const issue of error) {
    const key = issue.path[0]
    if (typeof key === 'string' && !map[key as keyof BusinessProfileDraft]) {
      map[key as keyof BusinessProfileDraft] = issue.message
    }
  }
  return map
}

function mapDirectoryReference(directory: Company): DirectoryReferenceData {
  return {
    id: directory.id,
    slug: directory.slug,
    name_en: directory.name_en,
    name_ar: directory.name_ar,
    logo_url: directory.logo_url,
    ownership_type: directory.ownership_type,
    sector: directory.sector,
    region: directory.region,
  }
}

export function BusinessProfileManagement({
  profile,
  directory,
  sectors,
  regions,
  initialSection = 'overview',
}: BusinessProfileManagementProps) {
  const t = useTranslations('organizationProfile')
  const router = useRouter()
  const [section, setSection] = useState<OrganizationProfileSection>(initialSection)
  const [draft, setDraft] = useState<BusinessProfileDraft>(() => profileToDraft(profile))
  const [savedDraft, setSavedDraft] = useState<BusinessProfileDraft>(() => profileToDraft(profile))
  const [errors, setErrors] = useState<Partial<Record<keyof BusinessProfileDraft, string>>>({})
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<'idle' | 'success' | 'error'>('idle')
  const [pendingSection, setPendingSection] = useState<OrganizationProfileSection | null>(null)

  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(savedDraft),
    [draft, savedDraft],
  )

  const checklist = useMemo(() => buildBusinessProfileChecklist(profile), [profile])

  const patchDraft = useCallback((patch: Partial<BusinessProfileDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }))
    setErrors({})
    setSaveMessage('idle')
  }, [])

  function validateAll() {
    const identity = businessProfileIdentitySchema.safeParse(draft)
    const story = businessProfileStorySchema.safeParse(draft)
    if (!identity.success) {
      setErrors(zodFieldErrors(identity.error.errors))
      return false
    }
    if (!story.success) {
      setErrors(zodFieldErrors(story.error.errors))
      return false
    }
    return true
  }

  async function handleSave() {
    if (!validateAll()) {
      setSaveMessage('error')
      return
    }

    const full = businessProfileDraftSchema.safeParse(draft)
    if (!full.success) {
      setErrors(zodFieldErrors(full.error.errors))
      setSaveMessage('error')
      return
    }

    setSaving(true)
    setSaveMessage('idle')
    try {
      await updateOwnerBusinessProfileAction(profile.id, full.data)
      setSavedDraft(full.data)
      setSaveMessage('success')
      router.refresh()
    } catch {
      setSaveMessage('error')
    } finally {
      setSaving(false)
    }
  }

  function navigate(next: OrganizationProfileSection) {
    setSection(next)
    setPendingSection(null)
  }

  function requestNavigate(next: OrganizationProfileSection) {
    if (dirty) {
      setPendingSection(next)
      return
    }
    navigate(next)
  }

  const previewProfile = {
    ...draftToBusinessProfileData(draft, { id: profile.id, directoryId: profile.directory_id }),
    gallery: parseBusinessProfileGallery(profile.gallery),
    verified_badge: profile.verified_badge,
  }

  return (
    <>
      <OrganizationProfileShell
        orgKind="business"
        displayName={profile.display_name_ar}
        status={profile.status}
        sectionNav={
          <ProfileSectionNav
            activeSection={section}
            onNavigate={navigate}
            dirty={dirty}
            onDirtyNavigate={requestNavigate}
          />
        }
      >
        {section === 'overview' ? (
          <div className="space-y-6">
            <OrganizationProfilePanel title={t('overview.checklistTitle')} description={t('overview.checklistDescription')}>
              <RequiredInformationChecklist items={checklist} onGoToSection={(s) => requestNavigate(s as OrganizationProfileSection)} />
            </OrganizationProfilePanel>
            <OrganizationProfilePanel title={t('overview.directoryTitle')} description={t('overview.directoryDescription')}>
              <DirectoryReferenceCard directory={directory} />
            </OrganizationProfilePanel>
            <OrganizationProfilePanel title={t('overview.opportunitiesTitle')}>
              <HonestEmptyState
                title={t('overview.opportunitiesEmptyTitle')}
                description={t('overview.opportunitiesEmptyDescription')}
              />
            </OrganizationProfilePanel>
            <div className="flex flex-wrap gap-3">
              <Button type="button" className="min-h-11" onClick={() => requestNavigate('identity')}>
                {t('overview.manageProfile')}
              </Button>
              <Button type="button" variant="outline" asChild className="min-h-11">
                <Link href="/company/profile/preview">{t('overview.openPreview')}</Link>
              </Button>
            </div>
          </div>
        ) : null}

        {section === 'identity' || section === 'details' ? (
          <OrganizationProfilePanel
            title={section === 'identity' ? t('sections.identityTitle') : t('sections.detailsTitle')}
            description={t('sections.profileOnlyNote')}
          >
            {section === 'identity' ? (
              <ProfileStepIdentity
                draft={draft}
                directoryNameAr={profile.directory_name_ar}
                errors={errors}
                onChange={patchDraft}
              />
            ) : (
              <ProfileStepStory draft={draft} errors={errors} onChange={patchDraft} />
            )}
            <div className="mt-6 space-y-2">
              <Button type="button" className="min-h-11 w-full sm:w-auto" disabled={saving} onClick={() => void handleSave()}>
                {saving ? t('save.saving') : t('save.action')}
              </Button>
              {saveMessage === 'success' ? (
                <p role="status" className="text-sm text-emerald-700">
                  {t('save.success')}
                </p>
              ) : null}
              {saveMessage === 'error' ? (
                <p role="alert" className="text-sm text-red-600">
                  {t('save.failure')}
                </p>
              ) : null}
            </div>
          </OrganizationProfilePanel>
        ) : null}

        {section === 'media' ? (
          <OrganizationProfilePanel title={t('sections.mediaTitle')} description={t('sections.mediaDescription')}>
            <ProfileStepStory draft={draft} errors={errors} onChange={patchDraft} />
            <p className="mt-3 text-xs text-foreground/60">{t('sections.logoDirectoryNote')}</p>
            <div className="mt-6">
              <Button type="button" className="min-h-11" disabled={saving} onClick={() => void handleSave()}>
                {saving ? t('save.saving') : t('save.action')}
              </Button>
            </div>
          </OrganizationProfilePanel>
        ) : null}

        {section === 'preview' ? (
          <OrganizationProfilePanel title={t('sections.previewTitle')}>
            <BusinessProfileView
              profile={previewProfile}
              directory={mapDirectoryReference(directory)}
              openings={[]}
              mode="preview"
            />
            <div className="mt-6">
              <Button type="button" variant="outline" asChild className="min-h-11">
                <Link href="/company/profile/edit?section=identity">{t('preview.returnToEdit')}</Link>
              </Button>
            </div>
          </OrganizationProfilePanel>
        ) : null}

        {section === 'reference' ? (
          <OrganizationProfilePanel title={t('sections.referenceTitle')} description={t('sections.referenceDescription')}>
            <DirectoryReferenceCard directory={directory} />
          </OrganizationProfilePanel>
        ) : null}

        {section === 'correction' ? (
          <OrganizationProfilePanel title={t('sections.correctionTitle')} description={t('sections.correctionDescription')}>
            <CorrectionSuggestionForm company={directory} sectors={sectors} regions={regions} />
          </OrganizationProfilePanel>
        ) : null}
      </OrganizationProfileShell>

      <UnsavedChangesDialog
        open={pendingSection !== null}
        onStay={() => setPendingSection(null)}
        onDiscard={() => {
          if (pendingSection) {
            setDraft(savedDraft)
            navigate(pendingSection)
          }
        }}
      />
    </>
  )
}
