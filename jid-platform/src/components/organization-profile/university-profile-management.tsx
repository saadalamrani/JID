'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Link, useRouter } from '@/lib/i18n/navigation'
import { CorrectionSuggestionForm } from '@/app/[locale]/(public)/catalog/_components/correction-suggestion-form'
import { FormField } from '@/components/auth/form-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { uploadBusinessProfileCover } from '@/lib/profile/business-profile-media'
import { buildUniversityProfileChecklist } from '@/lib/profile/organization-profile-checklist'
import type { OwnerUniversityProfile } from '@/lib/profile/owner-university-profile'
import {
  universityProfileDraftSchema,
  universityProfileIdentitySchema,
  universityProfileInstitutionSchema,
  UNIVERSITY_TYPES,
  type UniversityProfileDraft,
  type UniversityType,
} from '@/lib/validations/university-profile'
import type { Company, CatalogLookupOption } from '@/types/catalog'
import type { DirectoryReferenceData } from '@/types/business-profile-public'
import { updateOwnerUniversityProfileAction } from '@/app/[locale]/(university)/university/create-profile/actions'
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
import { UniversityProfileView } from './university-profile-view'

type UniversityProfileManagementProps = {
  profile: OwnerUniversityProfile
  directory: Company
  sectors: CatalogLookupOption[]
  regions: CatalogLookupOption[]
  initialSection?: OrganizationProfileSection
}

function profileToDraft(profile: OwnerUniversityProfile): UniversityProfileDraft {
  return {
    display_name_ar: profile.display_name_ar,
    display_name_en: profile.display_name_en ?? '',
    about_ar: profile.about_ar ?? '',
    about_en: profile.about_en ?? '',
    university_type: (profile.university_type as UniversityType | null) ?? null,
    established_year: profile.established_year,
    cover_image_url: profile.cover_image_url ?? '',
  }
}

function zodFieldErrors(error: { path: (string | number)[]; message: string }[]) {
  const map: Partial<Record<keyof UniversityProfileDraft, string>> = {}
  for (const issue of error) {
    const key = issue.path[0]
    if (typeof key === 'string' && !map[key as keyof UniversityProfileDraft]) {
      map[key as keyof UniversityProfileDraft] = issue.message
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

export function UniversityProfileManagement({
  profile,
  directory,
  sectors,
  regions,
  initialSection = 'overview',
}: UniversityProfileManagementProps) {
  const t = useTranslations('organizationProfile')
  const tIdentity = useTranslations('university.profileCreation.identity')
  const tInstitution = useTranslations('organizationProfile.universityInstitution')
  const tMedia = useTranslations('company.profileCreation.media')
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [section, setSection] = useState<OrganizationProfileSection>(initialSection)
  const [draft, setDraft] = useState<UniversityProfileDraft>(() => profileToDraft(profile))
  const [savedDraft, setSavedDraft] = useState<UniversityProfileDraft>(() => profileToDraft(profile))
  const [errors, setErrors] = useState<Partial<Record<keyof UniversityProfileDraft, string>>>({})
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saveMessage, setSaveMessage] = useState<'idle' | 'success' | 'error'>('idle')
  const [pendingSection, setPendingSection] = useState<OrganizationProfileSection | null>(null)

  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(savedDraft),
    [draft, savedDraft],
  )

  const checklist = useMemo(() => buildUniversityProfileChecklist(profile), [profile])

  const patchDraft = useCallback((patch: Partial<UniversityProfileDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }))
    setErrors({})
    setSaveMessage('idle')
  }, [])

  function validateAll() {
    const identity = universityProfileIdentitySchema.safeParse(draft)
    const institution = universityProfileInstitutionSchema.safeParse(draft)
    if (!identity.success) {
      setErrors(zodFieldErrors(identity.error.errors))
      return false
    }
    if (!institution.success) {
      setErrors(zodFieldErrors(institution.error.errors))
      return false
    }
    return true
  }

  async function handleSave() {
    if (!validateAll()) {
      setSaveMessage('error')
      return
    }

    const full = universityProfileDraftSchema.safeParse(draft)
    if (!full.success) {
      setErrors(zodFieldErrors(full.error.errors))
      setSaveMessage('error')
      return
    }

    setSaving(true)
    setSaveMessage('idle')
    try {
      await updateOwnerUniversityProfileAction(profile.id, full.data)
      setSavedDraft(full.data)
      setSaveMessage('success')
      router.refresh()
    } catch {
      setSaveMessage('error')
    } finally {
      setSaving(false)
    }
  }

  async function handleCoverSelect(file: File | undefined) {
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadBusinessProfileCover(file)
      patchDraft({ cover_image_url: url })
      toast.success(tMedia('uploaded'))
    } catch (error) {
      const message = error instanceof Error ? error.message : tMedia('uploadFailed')
      toast.error(message)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
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

  return (
    <>
      <OrganizationProfileShell
        orgKind="university"
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
              <RequiredInformationChecklist
                items={checklist}
                onGoToSection={(s) => requestNavigate(s as OrganizationProfileSection)}
              />
            </OrganizationProfilePanel>
            <OrganizationProfilePanel title={t('overview.directoryTitle')} description={t('overview.directoryDescription')}>
              <DirectoryReferenceCard directory={directory} />
            </OrganizationProfilePanel>
            <OrganizationProfilePanel title={t('overview.programsTitle')}>
              <HonestEmptyState
                title={t('overview.programsEmptyTitle')}
                description={t('overview.programsEmptyDescription')}
              />
            </OrganizationProfilePanel>
            <div className="flex flex-wrap gap-3">
              <Button type="button" className="min-h-11" onClick={() => requestNavigate('identity')}>
                {t('overview.manageProfile')}
              </Button>
              <Button type="button" variant="outline" asChild className="min-h-11">
                <Link href="/university/profile/preview">{t('overview.openPreview')}</Link>
              </Button>
            </div>
          </div>
        ) : null}

        {section === 'identity' ? (
          <OrganizationProfilePanel title={t('sections.identityTitle')} description={t('sections.profileOnlyNote')}>
            <div className="space-y-4">
              {profile.directory_name_ar ? (
                <p className="rounded-md bg-background p-3 text-sm text-foreground/70">
                  {tIdentity('directoryHint', { name: profile.directory_name_ar })}
                </p>
              ) : null}
              <FormField id="display_name_ar" label={tIdentity('displayNameAr')} error={errors.display_name_ar}>
                <Input
                  id="display_name_ar"
                  value={draft.display_name_ar}
                  onChange={(e) => patchDraft({ display_name_ar: e.target.value })}
                />
              </FormField>
              <FormField id="display_name_en" label={tIdentity('displayNameEn')} error={errors.display_name_en}>
                <Input
                  id="display_name_en"
                  dir="ltr"
                  className="text-start"
                  value={draft.display_name_en ?? ''}
                  onChange={(e) => patchDraft({ display_name_en: e.target.value })}
                />
              </FormField>
            </div>
            <SaveRow saving={saving} saveMessage={saveMessage} onSave={() => void handleSave()} labels={t} />
          </OrganizationProfilePanel>
        ) : null}

        {section === 'details' ? (
          <OrganizationProfilePanel title={t('sections.institutionTitle')} description={t('sections.profileOnlyNote')}>
            <div className="space-y-4">
              <FormField id="about_ar" label={tIdentity('aboutAr')} error={errors.about_ar}>
                <Textarea
                  id="about_ar"
                  rows={5}
                  value={draft.about_ar ?? ''}
                  onChange={(e) => patchDraft({ about_ar: e.target.value })}
                />
              </FormField>
              <FormField id="about_en" label={tIdentity('aboutEn')} error={errors.about_en}>
                <Textarea
                  id="about_en"
                  rows={5}
                  dir="ltr"
                  className="text-start"
                  value={draft.about_en ?? ''}
                  onChange={(e) => patchDraft({ about_en: e.target.value })}
                />
              </FormField>
              <FormField id="university_type" label={tInstitution('type')} error={errors.university_type as string}>
                <select
                  id="university_type"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={draft.university_type ?? ''}
                  onChange={(e) =>
                    patchDraft({
                      university_type:
                        e.target.value === '' ? null : (e.target.value as UniversityType),
                    })
                  }
                >
                  <option value="">{tInstitution('typePlaceholder')}</option>
                  {UNIVERSITY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {tInstitution(`types.${type}`)}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField id="established_year" label={tInstitution('establishedYear')} error={errors.established_year as string}>
                <Input
                  id="established_year"
                  type="number"
                  min={1800}
                  max={new Date().getFullYear()}
                  value={draft.established_year ?? ''}
                  onChange={(e) =>
                    patchDraft({
                      established_year: e.target.value === '' ? null : Number(e.target.value),
                    })
                  }
                />
              </FormField>
            </div>
            <SaveRow saving={saving} saveMessage={saveMessage} onSave={() => void handleSave()} labels={t} />
          </OrganizationProfilePanel>
        ) : null}

        {section === 'media' ? (
          <OrganizationProfilePanel title={t('sections.mediaTitle')} description={t('sections.mediaDescription')}>
            <FormField id="cover_image" label={tInstitution('coverImage')}>
              <div className="space-y-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => void handleCoverSelect(e.target.files?.[0])}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploading}
                  className="min-h-11"
                  onClick={() => fileRef.current?.click()}
                >
                  {uploading ? tMedia('uploading') : tInstitution('coverUpload')}
                </Button>
                {draft.cover_image_url ? (
                  <div
                    className="h-28 rounded-md border border-border bg-cover bg-center"
                    style={{ backgroundImage: `url(${draft.cover_image_url})` }}
                    role="img"
                    aria-label={tInstitution('coverPreviewAlt')}
                  />
                ) : (
                  <p className="text-sm text-foreground/60">{tInstitution('coverEmpty')}</p>
                )}
                <p className="text-xs text-muted-foreground">{tMedia('hint')}</p>
              </div>
            </FormField>
            <p className="mt-3 text-xs text-foreground/60">{t('sections.logoDirectoryNote')}</p>
            <SaveRow saving={saving} saveMessage={saveMessage} onSave={() => void handleSave()} labels={t} />
          </OrganizationProfilePanel>
        ) : null}

        {section === 'preview' ? (
          <OrganizationProfilePanel title={t('sections.previewTitle')}>
            <UniversityProfileView
              profile={{
                id: profile.id,
                display_name_ar: draft.display_name_ar,
                display_name_en: draft.display_name_en?.trim() || null,
                about_ar: draft.about_ar?.trim() || null,
                about_en: draft.about_en?.trim() || null,
                university_type: draft.university_type ?? null,
                established_year: draft.established_year ?? null,
                cover_image_url: draft.cover_image_url?.trim() || null,
                verified_badge: profile.verified_badge,
              }}
              directory={mapDirectoryReference(directory)}
              mode="preview"
            />
            <div className="mt-6">
              <Button type="button" variant="outline" className="min-h-11" onClick={() => requestNavigate('identity')}>
                {t('preview.returnToEdit')}
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

function SaveRow({
  saving,
  saveMessage,
  onSave,
  labels,
}: {
  saving: boolean
  saveMessage: 'idle' | 'success' | 'error'
  onSave: () => void
  labels: ReturnType<typeof useTranslations<'organizationProfile'>>
}) {
  return (
    <div className="mt-6 space-y-2">
      <Button type="button" className="min-h-11 w-full sm:w-auto" disabled={saving} onClick={onSave}>
        {saving ? labels('save.saving') : labels('save.action')}
      </Button>
      {saveMessage === 'success' ? (
        <p role="status" className="text-sm text-emerald-700">
          {labels('save.success')}
        </p>
      ) : null}
      {saveMessage === 'error' ? (
        <p role="alert" className="text-sm text-red-600">
          {labels('save.failure')}
        </p>
      ) : null}
    </div>
  )
}
