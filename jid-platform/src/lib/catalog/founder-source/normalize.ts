/**
 * Deterministic normalization for founder source rows.
 * Display forms are preserved separately; matching forms are normalized here.
 */

const DOMAIN_LABEL_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/

export function normalizeCatalogDomain(raw: string): string | null {
  let value = raw.trim().toLowerCase()
  if (!value) return null

  value = value.replace(/^@/, '')
  value = value.replace(/^https?:\/\//, '')
  value = value.replace(/^www\./, '')
  value = value.split('/')[0]?.split('?')[0]?.split('#')[0] ?? ''
  value = value.replace(/\.+$/, '')

  if (!value || value.includes(' ') || value.includes('@')) return null
  if (!DOMAIN_LABEL_PATTERN.test(value)) return null
  return value
}

export function normalizeMatchingName(value: string): string {
  return value
    .normalize('NFKC')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

export function normalizeWebsiteUrl(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null
  const trimmed = raw.trim()
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export function isPlaceholderDomain(domain: string | null): boolean {
  if (!domain) return true
  return (
    domain === 'stub.local' ||
    domain.endsWith('.jid-seed.local') ||
    domain.endsWith('.jidseed.test') ||
    domain.endsWith('-test.jid.local') ||
    domain.endsWith('.test.jid.local')
  )
}
