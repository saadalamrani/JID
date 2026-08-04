export const EU_CAREERS_SOURCE_KEY = 'eu_careers_cast'
export const EU_CAREERS_PARSER_VERSION = '1.0.0'
export const EU_CAREERS_MAX_RECORDS = 20
export const EU_CAREERS_MIN_DELAY_MS = 1_500
export const EU_CAREERS_REQUEST_TIMEOUT_MS = 15_000
export const EU_CAREERS_RETRY_LIMIT = 3
export const EU_CAREERS_MAX_REDIRECTS = 3
export const EU_CAREERS_MAX_RESPONSE_BYTES = 5 * 1024 * 1024

const textEncoder = new TextEncoder()

export type EuCareersListItem = {
  detailUrl: string
  title: string
}

export type EuCareersRecord = {
  sourceRecordId: string
  titleOriginal: string
  titleEn: string
  organizationRawName: string
  locationCountry: string | null
  locationCity: string | null
  sourceDeadlineAt: string | null
  sourcePageUrl: string
  applyUrl: string
  sanitizedProjection: Record<string, string | null>
}

function decodeHtml(value: string): string {
  const named: Record<string, string> = {
    amp: '&',
    apos: "'",
    gt: '>',
    lt: '<',
    nbsp: ' ',
    quot: '"',
  }
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (entity, token: string) => {
    if (token[0] === '#') {
      const hexadecimal = token[1]?.toLowerCase() === 'x'
      const digits = token.slice(hexadecimal ? 2 : 1)
      const codePoint = Number.parseInt(digits, hexadecimal ? 16 : 10)
      return Number.isFinite(codePoint) && codePoint >= 0 && codePoint <= 0x10ffff
        ? String.fromCodePoint(codePoint)
        : entity
    }
    return named[token.toLowerCase()] ?? entity
  })
}

export function htmlToText(value: string): string {
  return decodeHtml(
    value
      .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/\s+/g, ' ')
    .trim()
}

const hostileInstructionPatterns = [
  /\bignore\s+(?:all\s+)?previous\s+instructions\b/i,
  /\breveal\s+(?:the\s+)?system\s+prompt\b/i,
  /\boverride\s+(?:the\s+)?system\s+prompt\b/i,
  /\bjailbreak\b/i,
]

export function containsHostileInstruction(value: string): boolean {
  const text = htmlToText(value).slice(0, 100_000)
  return hostileInstructionPatterns.some((pattern) => pattern.test(text))
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function extractClassBlock(html: string, className: string): string | null {
  const marker = escapeRegExp(className)
  const match = html.match(
    new RegExp(
      `<(?:div|section|article|h[1-6])[^>]*class=["'][^"']*${marker}[^"']*["'][^>]*>([\\s\\S]*?)(?=<(?:div|section|article|h[1-6])[^>]*class=["'][^"']*field--name-|<\\/article>|$)`,
      'i',
    ),
  )
  return match?.[1] ?? null
}

function extractFieldText(html: string, className: string, labels: string[]): string | null {
  const block = extractClassBlock(html, className)
  if (!block) return null
  let value = htmlToText(block)
  for (const label of labels) {
    value = value.replace(new RegExp(`^${escapeRegExp(label)}\\s*:?\\s*`, 'i'), '')
  }
  return value || null
}

function extractFieldHref(html: string, className: string): string | null {
  const block = extractClassBlock(html, className)
  return block?.match(/<a\b[^>]*href=["']([^"']+)["']/i)?.[1] ?? null
}

function normalizeEuCareersDetailUrl(raw: string, baseUrl: string): string | null {
  try {
    const url = new URL(raw, baseUrl)
    if (url.protocol !== 'https:' || url.hostname.toLowerCase() !== 'eu-careers.europa.eu') return null
    if (!/^\/en\/job-opportunities\/[a-z0-9][a-z0-9/-]*$/i.test(url.pathname)) return null
    if (url.pathname.includes('/open-vacancies/')) return null
    url.hash = ''
    return url.toString()
  } catch {
    return null
  }
}

export function parseEuCareersList(
  html: string,
  baseUrl: string,
  limit = EU_CAREERS_MAX_RECORDS,
): EuCareersListItem[] {
  const results: EuCareersListItem[] = []
  const seen = new Set<string>()
  const anchors = html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)
  for (const anchor of anchors) {
    const detailUrl = normalizeEuCareersDetailUrl(anchor[1], baseUrl)
    const title = htmlToText(anchor[2])
    if (!detailUrl || title.length < 2 || seen.has(detailUrl)) continue
    seen.add(detailUrl)
    results.push({ detailUrl, title })
    if (results.length >= Math.min(Math.max(limit, 1), EU_CAREERS_MAX_RECORDS)) break
  }
  return results
}

function timezoneParts(timestamp: number, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(timestamp))
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  }
}

function brusselsLocalToIso(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): string {
  const intendedUtc = Date.UTC(year, month - 1, day, hour, minute, 0)
  let candidate = intendedUtc
  for (let iteration = 0; iteration < 3; iteration += 1) {
    const actual = timezoneParts(candidate, 'Europe/Brussels')
    const actualUtc = Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day,
      actual.hour,
      actual.minute,
      actual.second,
    )
    candidate += intendedUtc - actualUtc
  }
  return new Date(candidate).toISOString()
}

export function parseBrusselsDeadline(value: string | null): string | null {
  if (!value) return null
  const match = value.match(/\b(\d{2})\/(\d{2})\/(\d{4})\s*-?\s*(\d{2}):(\d{2})\b/)
  if (!match) return null
  const [, day, month, year, hour, minute] = match.map(Number)
  if (
    year < 2020 || month < 1 || month > 12 || day < 1 || day > 31 ||
    hour < 0 || hour > 23 || minute < 0 || minute > 59
  ) return null
  const calendarCheck = new Date(Date.UTC(year, month - 1, day))
  if (
    calendarCheck.getUTCFullYear() !== year ||
    calendarCheck.getUTCMonth() !== month - 1 ||
    calendarCheck.getUTCDate() !== day
  ) return null
  return brusselsLocalToIso(year, month, day, hour, minute)
}

function parseLocation(value: string | null): { country: string | null; city: string | null } {
  if (!value) return { country: null, city: null }
  const match = value.match(/^(.+?)\s*\(([^()]+)\)\s*$/)
  if (!match) return { country: null, city: value }
  return { city: match[1].trim() || null, country: match[2].trim() || null }
}

export function parseEuCareersDetail(html: string, sourcePageUrl: string): EuCareersRecord {
  const title = extractFieldText(html, 'job-title', [])
    ?? htmlToText(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? '')
  const sourceRecordId = extractFieldText(
    html,
    'field--name-field-epso-ref-temp-number',
    ['Reference number', 'Reference'],
  )
  const organization = extractFieldText(
    html,
    'field--name-field-epso-institution',
    ['Institution/Agency', 'Institution', 'Agency'],
  )
  const locationText = extractFieldText(html, 'locations', ['Location'])
  const deadlineText = extractFieldText(
    html,
    'field--name-field-epso-deadline',
    ['Deadline', 'Application deadline'],
  )
  const rawApplyUrl = extractFieldHref(html, 'field--name-field-epso-link')
  const location = parseLocation(locationText)

  if (!title || title.length > 300) throw new Error('eu_careers_title_missing_or_invalid')
  if (!sourceRecordId || sourceRecordId.length > 200) throw new Error('eu_careers_reference_missing_or_invalid')
  if (!organization || organization.length > 300) throw new Error('eu_careers_organization_missing_or_invalid')
  if (!rawApplyUrl) throw new Error('eu_careers_apply_url_missing')

  let applyUrl: string
  try {
    applyUrl = new URL(rawApplyUrl, sourcePageUrl).toString()
  } catch {
    throw new Error('eu_careers_apply_url_invalid')
  }

  const sourceDeadlineAt = parseBrusselsDeadline(deadlineText)
  if (deadlineText && !sourceDeadlineAt) throw new Error('eu_careers_deadline_unparseable')

  return {
    sourceRecordId,
    titleOriginal: title,
    titleEn: title,
    organizationRawName: organization,
    locationCountry: location.country,
    locationCity: location.city,
    sourceDeadlineAt,
    sourcePageUrl,
    applyUrl,
    sanitizedProjection: {
      source_record_id: sourceRecordId,
      title,
      organization,
      location: locationText,
      deadline: deadlineText,
      apply_url: applyUrl,
    },
  }
}

export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', textEncoder.encode(input))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function hostAllowed(urlValue: string, allowedHosts: string[]): boolean {
  try {
    const url = new URL(urlValue)
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return false
    const host = url.hostname.toLowerCase().replace(/^www\./, '')
    return allowedHosts.some((allowed) => {
      const normalized = allowed.toLowerCase()
      return host === normalized || host.endsWith(`.${normalized}`)
    })
  } catch {
    return false
  }
}

function parseIpv4(value: string): number[] | null {
  const parts = value.split('.')
  if (parts.length !== 4) return null
  const octets = parts.map((part) => Number(part))
  if (octets.some((octet, index) => !Number.isInteger(octet) || octet < 0 || octet > 255 || String(octet) !== parts[index])) return null
  return octets
}

export function isPublicIpAddress(value: string): boolean {
  const ipv4 = parseIpv4(value)
  if (ipv4) {
    const [first, second] = ipv4
    return !(
      first === 0 || first === 10 || first === 127 ||
      (first === 100 && second >= 64 && second <= 127) ||
      (first === 169 && second === 254) ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && (second === 0 || second === 168)) ||
      (first === 198 && (second === 18 || second === 19)) ||
      first >= 224
    )
  }

  const ipv6 = value.toLowerCase().replace(/^\[|\]$/g, '')
  if (!ipv6.includes(':')) return false
  if (ipv6 === '::' || ipv6 === '::1') return false
  if (ipv6.startsWith('fc') || ipv6.startsWith('fd')) return false
  if (/^fe[89ab]/.test(ipv6)) return false
  const mappedIpv4 = ipv6.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1]
  return mappedIpv4 ? isPublicIpAddress(mappedIpv4) : true
}
