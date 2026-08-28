/**
 * P2-A — pinned deterministic normalization for legacy dedupe identity keys.
 *
 * This is the canonical reference implementation of the identity-normalization
 * algorithm. The database mirror is `private.jid_normalize_identity(text)` in
 * migration 20260827120000. Both must stay in lock-step.
 *
 * Steps, in order:
 *   1. return null for null/undefined
 *   2. strip Arabic tatweel (U+0640)
 *   3. strip Arabic diacritics / harakat (U+064B..U+0652, U+0670)
 *   4. collapse every run of Unicode whitespace to a single ASCII space
 *   5. trim outer whitespace
 *   6. Unicode NFKC normalization
 *   7. casefold (locale-independent lower-case) for case-insensitive identity
 *   8. empty string -> null (never an invented value)
 *
 * It deliberately does NOT transliterate, strip punctuation, or fold distinct
 * factual values together beyond the steps above.
 */
const TATWEEL = /ـ/g
const HARAKAT = /[ً-ْٰ]/g
const WHITESPACE_RUN = /\s+/g

export function normalizeIdentity(input: string | null | undefined): string | null {
  if (input === null || input === undefined) return null

  const stripped = input.replace(TATWEEL, '').replace(HARAKAT, '')
  const collapsed = stripped.replace(WHITESPACE_RUN, ' ').trim()
  const normalized = collapsed.normalize('NFKC').toLowerCase()

  return normalized.length === 0 ? null : normalized
}

/** Build a composite identity key from ordered parts (mirrors concat_ws('|', ...)). */
export function identityKey(...parts: (string | null | undefined)[]): string | null {
  const normalizedParts = parts.map((p) => normalizeIdentity(p) ?? '')
  const key = normalizedParts.join('|')
  // all-empty -> null (e.g. "||" for three empty parts)
  return key.replace(/\|/g, '').length === 0 ? null : key
}
