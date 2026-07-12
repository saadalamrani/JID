import { formatDomainsList, normalizeDomain } from '@/lib/entity/domains'

/** Section 6.5 — exact Arabic error copy for domain mismatch. */
export const DOMAIN_MISMATCH_ERROR_AR =
  'يجب أن يكون رابط التقديم الخارجي ضمن أحد النطاقات المعتمدة لجهتك: {domains}'

export function extractUrlHostname(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed) return null

  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
    return new URL(withProtocol).hostname.toLowerCase()
  } catch {
    return null
  }
}

export function hostnameMatchesCompanyDomains(hostname: string, companyDomains: string[]): boolean {
  return companyDomains.some((raw) => {
    const domain = normalizeDomain(raw)
    if (!domain) return false
    return hostname === domain || hostname.endsWith(`.${domain}`)
  })
}

export type DomainMatchResult =
  | { valid: true }
  | { valid: false; message: string }

/**
 * Section 6.5 — validate external_apply_url against an approved domain set.
 * Client-side preview uses validateDomainMatchForDomains with pre-fetched trustedDomains.
 */
export function validateDomainMatchForDomains(
  externalApplyUrl: string,
  companyDomains: string[],
  locale: 'ar' | 'en' = 'ar',
): DomainMatchResult {
  const hostname = extractUrlHostname(externalApplyUrl)
  if (!hostname) {
    return {
      valid: false,
      message:
        locale === 'ar'
          ? 'أدخل رابطاً صالحاً لصفحة التقديم'
          : 'Enter a valid application URL',
    }
  }

  if (hostnameMatchesCompanyDomains(hostname, companyDomains)) {
    return { valid: true }
  }

  const domainsList = formatDomainsList(companyDomains, locale)
  const message =
    locale === 'ar'
      ? DOMAIN_MISMATCH_ERROR_AR.replace('{domains}', domainsList)
      : `The external apply URL must use one of your approved domains: ${domainsList}`

  return { valid: false, message }
}

/** @deprecated Use validateDomainMatchForDomains — kept for scripts/tests. */
export const validateDomainMatch = validateDomainMatchForDomains
