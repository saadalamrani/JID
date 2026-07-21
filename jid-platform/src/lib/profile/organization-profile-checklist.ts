export type OrganizationProfileKind = 'business' | 'university'

export type ChecklistItemStatus = 'required' | 'added' | 'optional'

export type ProfileChecklistItem = {
  id: string
  section: string
  status: ChecklistItemStatus
}

type BusinessChecklistInput = {
  display_name_ar: string
  display_name_en: string | null
  about_ar: string | null
  about_en: string | null
  tagline_ar?: string | null
  cover_image_url?: string | null
}

type UniversityChecklistInput = {
  display_name_ar: string
  display_name_en: string | null
  about_ar: string | null
  about_en: string | null
  university_type?: string | null
  cover_image_url?: string | null
}

function hasText(value: string | null | undefined): boolean {
  return Boolean(value?.trim())
}

function itemStatus(present: boolean, required: boolean): ChecklistItemStatus {
  if (present) return 'added'
  return required ? 'required' : 'optional'
}

/** Checklist uses only fields that exist on the owned Profile schema. */
export function buildBusinessProfileChecklist(profile: BusinessChecklistInput): ProfileChecklistItem[] {
  const hasAbout = hasText(profile.about_ar) || hasText(profile.about_en)

  return [
    {
      id: 'display_name_ar',
      section: 'identity',
      status: itemStatus(hasText(profile.display_name_ar), true),
    },
    {
      id: 'display_name_en',
      section: 'identity',
      status: itemStatus(hasText(profile.display_name_en), true),
    },
    {
      id: 'about',
      section: 'story',
      status: itemStatus(hasAbout, true),
    },
    {
      id: 'tagline_ar',
      section: 'story',
      status: itemStatus(hasText(profile.tagline_ar), false),
    },
    {
      id: 'cover_image',
      section: 'media',
      status: itemStatus(hasText(profile.cover_image_url), false),
    },
  ]
}

export function buildUniversityProfileChecklist(
  profile: UniversityChecklistInput,
): ProfileChecklistItem[] {
  const hasAbout = hasText(profile.about_ar) || hasText(profile.about_en)

  return [
    {
      id: 'display_name_ar',
      section: 'identity',
      status: itemStatus(hasText(profile.display_name_ar), true),
    },
    {
      id: 'display_name_en',
      section: 'identity',
      status: itemStatus(hasText(profile.display_name_en), true),
    },
    {
      id: 'about',
      section: 'institution',
      status: itemStatus(hasAbout, true),
    },
    {
      id: 'university_type',
      section: 'institution',
      status: itemStatus(hasText(profile.university_type), true),
    },
    {
      id: 'cover_image',
      section: 'media',
      status: itemStatus(hasText(profile.cover_image_url), false),
    },
  ]
}
