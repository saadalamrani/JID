import type { ContractId, ContractReference, LocaleCode, VersionedContract } from './common'

export type CountryCode = string
export type SubdivisionCode = string
export type CurrencyCode = string

export const WORK_MODES = ['ONSITE', 'HYBRID', 'REMOTE', 'OTHER'] as const
export type WorkMode = (typeof WORK_MODES)[number]

export type LocationContext = VersionedContract & {
  country_code: CountryCode
  subdivision_code?: SubdivisionCode
  city_ref?: string
  city_text?: string
  work_mode: WorkMode
  timezone?: string
}

export type MarketContext = VersionedContract & {
  jurisdiction_code: string
  currency_code?: CurrencyCode
  locale?: LocaleCode
  language_code?: string
  policy_or_taxonomy_ref?: ContractReference
  market_adapter_ref?: ContractReference
}

export type MarketPresence = VersionedContract & {
  presence_id: ContractId
  subject_kind: 'ORGANIZATION' | 'INSTITUTION'
  subject_ref: ContractReference
  market_context_ref: ContractReference
  presence_state: 'ACTIVE' | 'INACTIVE' | 'HISTORICAL'
}

/** Operating default only; MarketContext remains country-neutral. */
export const SAUDI_OPERATING_MARKET = {
  jurisdiction_code: 'SA',
  locale: 'ar-SA',
} as const
