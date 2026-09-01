import type { EntitySignupType, EntityWizardStep } from '@/lib/entity/constants'
import { ENTITY_SIGNUP_STORAGE_KEY } from '@/lib/entity/constants'
import type { OrganizationRegistrationFormValues } from '@/lib/validations/entity'

export type EntityWizardState = {
  step: EntityWizardStep
  accountEmail?: string
  registrationDraft?: Partial<OrganizationRegistrationFormValues>
}

export function getWizardStorageKey(entityType: EntitySignupType): string {
  return ENTITY_SIGNUP_STORAGE_KEY[entityType]
}

export function loadWizardState(entityType: EntitySignupType): EntityWizardState | null {
  if (typeof window === 'undefined') return null
  const raw = sessionStorage.getItem(getWizardStorageKey(entityType))
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as EntityWizardState & {
      companyId?: string
      claimDraft?: unknown
    }
    const legacyStep = parsed.step as string
    if (legacyStep === 'entity') {
      parsed.step = 'org_details'
    }
    delete parsed.companyId
    delete parsed.claimDraft
    return parsed
  } catch {
    return null
  }
}

export function saveWizardState(entityType: EntitySignupType, state: EntityWizardState): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(getWizardStorageKey(entityType), JSON.stringify(state))
}

export function clearWizardState(entityType: EntitySignupType): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(getWizardStorageKey(entityType))
}
