const ROOT_PATHS = new Set(['', '/'])

function stripWww(host: string): string {
  return host.replace(/^www\./i, '').toLowerCase()
}

export function normalizeOpportunityUrl(url: string | null | undefined): string | null {
  const value = url?.trim().split('#')[0] ?? ''
  if (!value || /\s/.test(value) || !/^https?:\/\//i.test(value)) return null

  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    return null
  }

  const host = stripWww(parsed.host)
  if (!host || host.includes('@') || !host.includes('.')) return null

  const tail = `${parsed.pathname}${parsed.search}`
  if (ROOT_PATHS.has(tail) || tail === '/') return null

  const normalizedTail = parsed.search ? tail : tail.replace(/\/+$/, '')
  return `${host}${normalizedTail}` || null
}

export function urlHost(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    return stripWww(new URL(url.trim()).host)
  } catch {
    return null
  }
}

export function hostAllowed(url: string, allowedHosts: readonly string[]): boolean {
  const host = urlHost(url)
  if (!host) return false
  return allowedHosts.some((allowed) => {
    const needle = allowed.trim().toLowerCase()
    return host === needle || host.endsWith(`.${needle}`)
  })
}

export function isGenericHomepage(url: string): boolean {
  return normalizeOpportunityUrl(url) === null && Boolean(urlHost(url))
}

export function sourceAndApplyAreSeparated(
  sourceUrl: string,
  applyUrl: string,
): { identical: boolean; sourceIsHomepage: boolean; applyIsHomepage: boolean } {
  return {
    identical: normalizeOpportunityUrl(sourceUrl) === normalizeOpportunityUrl(applyUrl)
      && normalizeOpportunityUrl(sourceUrl) !== null,
    sourceIsHomepage: isGenericHomepage(sourceUrl),
    applyIsHomepage: isGenericHomepage(applyUrl),
  }
}
