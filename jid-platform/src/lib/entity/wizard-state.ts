import type { EntitySignupType, EntityWizardStep } from '@/lib/entity/constants'
import { ENTITY_SIGNUP_STORAGE_KEY } from '@/lib/entity/constants'
import type { ClaimSubmissionFormValues } from '@/lib/validations/entity'

export type EntityWizardState = {
  step: EntityWizardStep
  accountEmail?: string
  companyId?: string
  companyName?: string
  companyDomains?: string[]
  claimDraft?: ClaimSubmissionFormValues
}

export function getWizardStorageKey(entityType: EntitySignupType): string {
  return ENTITY_SIGNUP_STORAGE_KEY[entityType]
}

export function loadWizardState(entityType: EntitySignupType): EntityWizardState | null {
  if (typeof window === 'undefined') return null
  const raw = sessionStorage.getItem(getWizardStorageKey(entityType))
  if (!raw) return null
  try {
    return JSON.parse(raw) as EntityWizardState
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
