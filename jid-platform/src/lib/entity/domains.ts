/**
 * Domain-email validation for entity claims (Section 4.3).
 * Matches exact domain or subdomain via endsWith('.' + d).
 */

export function extractEmailDomain(email: string): string | null {
  const parts = email.trim().toLowerCase().split('@')
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null
  return parts[1]
}

export function normalizeDomain(domain: string): string {
  return domain.trim().toLowerCase().replace(/^@/, '')
}

export function emailDomainMatchesAllowed(email: string, allowedDomains: string[]): boolean {
  const emailDomain = extractEmailDomain(email)
  if (!emailDomain) return false

  return allowedDomains.some((raw) => {
    const domain = normalizeDomain(raw)
    if (!domain) return false
    return emailDomain === domain || emailDomain.endsWith(`.${domain}`)
  })
}

export function formatDomainsList(domains: string[], locale: 'ar' | 'en' = 'ar'): string {
  const normalized = domains.map(normalizeDomain).filter(Boolean)
  if (locale === 'ar') {
    return normalized.join('، ')
  }
  return normalized.join(', ')
}

export function buildDomainMismatchMessage(
  allowedDomains: string[],
  locale: 'ar' | 'en' = 'ar',
): string {
  const list = formatDomainsList(allowedDomains, locale)
  if (locale === 'ar') {
    return `يجب أن يكون بريدك المؤسسي من أحد النطاقات المعتمدة: ${list}`
  }
  return `Your business email must use one of these approved domains: ${list}`
}

export function parseDomainsInput(input: string): string[] {
  return input
    .split(/[,;\n]+/)
    .map((value) => normalizeDomain(value))
    .filter(Boolean)
}
