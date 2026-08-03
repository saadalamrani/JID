export const GLEIF_SOURCE_KEY = 'gleif.lei-records-v1'
export const GLEIF_COUNTRY = 'SA'
export const CATALOG_GLEIF_PAGE_DELAY_MS = 750
export const CATALOG_GLEIF_REQUEST_TIMEOUT_MS = 15_000
export const CATALOG_GLEIF_RETRY_LIMIT = 3

type JsonObject = Record<string, unknown>

export type GleifFact = {
  normalized_value: unknown
  original_value: unknown
  source_field: string
  transformation: string
  confidence: 'high' | 'medium' | 'low'
  confidence_reason: string
  authority_level: 'official' | 'authoritative'
  observed_at: string
  effective_at?: string
  reviewer_edit_state: 'proposed'
}

export type ParsedGleifRecord = {
  lei: string
  sourceRecordKey: string
  normalizedIdentity: string
  checksumInput: string
  legalName: string
  city: string | null
  creationDate: string | null
  registrationIdentifier: string | null
  registrationAuthority: string | null
  entityStatus: string
  registrationStatus: string
  reviewFlags: string[]
  quarantined: boolean
  ignored: boolean
  intakeFacts: Record<string, GleifFact>
  extendedFacts: Record<string, GleifFact>
  payload: JsonObject
}

function object(value: unknown): JsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonObject)
    : {}
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.normalize('NFC').trim() : null
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((entry) => text(entry)).filter((entry): entry is string => entry !== null)
}

function compactObject(value: JsonObject): JsonObject {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry != null))
}

export function normalizeLegalName(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('und')
    .replace(
      /[\u0000-\u002f\u003a-\u0040\u005b-\u0060\u007b-\u00bf\u2000-\u206f\u2e00-\u2e7f\u3000-\u303f\uff00-\uff65]+/g,
      ' ',
    )
    .replace(/\s+/g, ' ')
    .trim()
}

export function isValidLei(lei: string): boolean {
  if (!/^[A-Z0-9]{20}$/.test(lei)) return false
  let remainder = 0
  for (const character of lei) {
    const encoded = /[A-Z]/.test(character) ? String(character.charCodeAt(0) - 55) : character
    for (const digit of encoded) remainder = (remainder * 10 + Number(digit)) % 97
  }
  return remainder === 1
}

function fact(
  normalizedValue: unknown,
  originalValue: unknown,
  sourceField: string,
  observedAt: string,
  transformation = 'none',
): GleifFact {
  return {
    normalized_value: normalizedValue,
    original_value: originalValue,
    source_field: sourceField,
    transformation,
    confidence: 'high',
    confidence_reason: 'Direct GLEIF LEI Records API field',
    authority_level: 'authoritative',
    observed_at: observedAt,
    reviewer_edit_state: 'proposed',
  }
}

function relationshipLeis(record: JsonObject): string[] {
  const relationships = object(record.relationships)
  return ['direct-parent', 'ultimate-parent']
    .flatMap((key) => {
      const relationship = object(relationships[key])
      const data = relationship.data
      if (Array.isArray(data)) return data.map((item) => text(object(item).id))
      return [text(object(data).id)]
    })
    .filter((entry): entry is string => entry !== null && /^[A-Z0-9]{20}$/.test(entry))
}

export function parseGleifRecord(
  value: unknown,
  observedAt = new Date().toISOString(),
): ParsedGleifRecord {
  const payload = object(value)
  const attributes = object(payload.attributes)
  const entity = object(attributes.entity)
  const registration = object(attributes.registration)
  const legalNameObject = object(entity.legalName)
  const legalAddress = object(entity.legalAddress)
  const registeredAt = object(entity.registeredAt)
  const legalForm = object(entity.legalForm)

  const lei = (text(attributes.lei) ?? text(payload.id) ?? '').toUpperCase()
  if (!isValidLei(lei)) throw new Error('invalid_lei')

  const legalName = text(legalNameObject.name)
  if (!legalName) throw new Error('legal_name_missing')
  const country = text(legalAddress.country)?.toUpperCase() ?? ''
  if (country !== GLEIF_COUNTRY) throw new Error('outside_saudi_scope')

  const entityStatus = text(entity.status)?.toUpperCase() ?? ''
  const registrationStatus = text(registration.status)?.toUpperCase() ?? ''
  if (!entityStatus) throw new Error('entity_status_missing')
  if (!registrationStatus) throw new Error('registration_status_missing')

  const ignored = ['ANNULLED', 'DUPLICATE'].includes(registrationStatus)
  const quarantined =
    entityStatus === 'INACTIVE' || ['RETIRED', 'MERGED'].includes(registrationStatus)
  const jurisdiction = text(entity.jurisdiction)?.toUpperCase()
  const city = text(legalAddress.city)
  const region = text(legalAddress.region)
  const creationDate = text(entity.creationDate)
  const registrationIdentifier = text(entity.registeredAs)
  const registrationAuthority = text(registeredAt.id) ?? text(registeredAt.other)
  const nameLanguage = text(legalNameObject.language)
  const otherNames = Array.isArray(entity.otherNames) ? entity.otherNames : []
  const transliteratedNames = Array.isArray(entity.transliteratedOtherNames)
    ? entity.transliteratedOtherNames
    : []
  const parentLeis = relationshipLeis(payload)
  const addressRaw = compactObject({
    language: text(legalAddress.language),
    addressLines: stringArray(legalAddress.addressLines),
    city,
    region,
    country,
    postalCode: text(legalAddress.postalCode),
  })

  const reviewFlags: string[] = []
  if (registrationStatus === 'LAPSED') reviewFlags.push('lapsed_registration')
  if (jurisdiction && jurisdiction !== GLEIF_COUNTRY) reviewFlags.push('jurisdiction_mismatch')
  if (region && !/^SA-[A-Z0-9]{1,3}$/.test(region)) reviewFlags.push('unmapped_region')
  if (quarantined) reviewFlags.push('inactive_entity')

  const intakeFacts: Record<string, GleifFact> = {
    legal_name: fact(
      legalName,
      legalNameObject.name,
      'entity.legalName.name',
      observedAt,
      'nfc_trim',
    ),
  }
  if (city)
    intakeFacts.city = fact(
      city,
      legalAddress.city,
      'entity.legalAddress.city',
      observedAt,
      'nfc_trim',
    )
  if (creationDate && /^\d{4}-\d{2}-\d{2}$/.test(creationDate)) {
    intakeFacts.entity_creation_date = fact(
      creationDate,
      entity.creationDate,
      'entity.creationDate',
      observedAt,
      'extract_year_exact_entity_creation_date',
    )
  }

  const extendedFacts: Record<string, GleifFact> = {
    lei: fact(lei, attributes.lei, 'lei', observedAt, 'uppercase'),
    address_country: fact(
      country,
      legalAddress.country,
      'entity.legalAddress.country',
      observedAt,
      'uppercase',
    ),
    address_raw: fact(
      addressRaw,
      legalAddress,
      'entity.legalAddress',
      observedAt,
      'sanitized_projection',
    ),
    entity_status: fact(entityStatus, entity.status, 'entity.status', observedAt, 'uppercase'),
    registration_status: fact(
      registrationStatus,
      registration.status,
      'registration.status',
      observedAt,
      'uppercase',
    ),
  }
  if (nameLanguage)
    extendedFacts.legal_name_language = fact(
      nameLanguage,
      legalNameObject.language,
      'entity.legalName.language',
      observedAt,
      'lowercase',
    )
  if (otherNames.length)
    extendedFacts.other_names = fact(otherNames, otherNames, 'entity.otherNames', observedAt)
  if (transliteratedNames.length)
    extendedFacts.transliterated_names = fact(
      transliteratedNames,
      transliteratedNames,
      'entity.transliteratedOtherNames',
      observedAt,
    )
  if (region)
    extendedFacts.address_region = fact(
      region,
      legalAddress.region,
      'entity.legalAddress.region',
      observedAt,
      'uppercase',
    )
  if (registrationIdentifier)
    extendedFacts.registration_identifier = fact(
      registrationIdentifier,
      entity.registeredAs,
      'entity.registeredAs',
      observedAt,
    )
  if (registrationAuthority)
    extendedFacts.registration_authority = fact(
      registrationAuthority,
      entity.registeredAt,
      'entity.registeredAt',
      observedAt,
    )
  if (Object.keys(legalForm).length)
    extendedFacts.legal_form = fact(legalForm, entity.legalForm, 'entity.legalForm', observedAt)
  if (jurisdiction)
    extendedFacts.jurisdiction = fact(
      jurisdiction,
      entity.jurisdiction,
      'entity.jurisdiction',
      observedAt,
      'uppercase',
    )
  if (parentLeis.length)
    extendedFacts.parent_leis = fact(
      parentLeis,
      parentLeis,
      'relationships.direct-parent|ultimate-parent',
      observedAt,
    )

  return {
    lei,
    sourceRecordKey: `${lei}:${observedAt.slice(0, 10).replaceAll('-', '')}`,
    normalizedIdentity: normalizeLegalName(legalName),
    checksumInput: JSON.stringify(payload),
    legalName,
    city,
    creationDate: creationDate && /^\d{4}-\d{2}-\d{2}$/.test(creationDate) ? creationDate : null,
    registrationIdentifier,
    registrationAuthority,
    entityStatus,
    registrationStatus,
    reviewFlags,
    quarantined,
    ignored,
    intakeFacts,
    extendedFacts,
    payload,
  }
}

export async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function buildGleifPageUrl(baseUrl: string, pageNumber: number, pageSize: number): URL {
  const url = new URL(baseUrl)
  url.searchParams.set('filter[entity.legalAddress.country]', GLEIF_COUNTRY)
  url.searchParams.set('page[number]', String(pageNumber))
  url.searchParams.set('page[size]', String(Math.min(Math.max(pageSize, 1), 200)))
  return url
}
