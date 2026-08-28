import { describe, expect, it } from 'vitest'
import { identityKey, normalizeIdentity } from '@/lib/career-record/normalize'

/**
 * P2-A pinned normalization vectors. The DB mirror is
 * `private.jid_normalize_identity(text)` in migration 20260827120000; any change
 * here must change both.
 */
describe('normalizeIdentity — pinned deterministic vectors', () => {
  it('returns null for null/undefined/empty/whitespace-only', () => {
    expect(normalizeIdentity(null)).toBeNull()
    expect(normalizeIdentity(undefined)).toBeNull()
    expect(normalizeIdentity('')).toBeNull()
    expect(normalizeIdentity('   ')).toBeNull()
    expect(normalizeIdentity('\t\n   ')).toBeNull()
  })

  it('trims outer whitespace and collapses internal runs to a single space', () => {
    expect(normalizeIdentity('  King   Saud    University  ')).toBe('king saud university')
    expect(normalizeIdentity('React\t\tJS')).toBe('react js')
  })

  it('casefolds for case-insensitive identity', () => {
    expect(normalizeIdentity('TypeScript')).toBe('typescript')
    expect(normalizeIdentity('POSTGRESQL')).toBe(normalizeIdentity('postgresql'))
  })

  it('strips Arabic tatweel (kashida)', () => {
    expect(normalizeIdentity('جامعـــة المـلك سعـود')).toBe(normalizeIdentity('جامعة الملك سعود'))
  })

  it('strips Arabic diacritics / harakat', () => {
    expect(normalizeIdentity('مُحَمَّد')).toBe(normalizeIdentity('محمد'))
    expect(normalizeIdentity('بَرْمَجَة')).toBe(normalizeIdentity('برمجة'))
  })

  it('applies Unicode NFKC normalization (compatibility forms fold)', () => {
    // U+FB01 LATIN SMALL LIGATURE FI -> "fi"
    expect(normalizeIdentity('ﬁnance')).toBe('finance')
    // full-width latin -> ascii
    expect(normalizeIdentity('Ｔｓ')).toBe('ts')
  })

  it('does NOT fold distinct factual values together', () => {
    expect(normalizeIdentity('React')).not.toBe(normalizeIdentity('React Native'))
    expect(normalizeIdentity('BSc Computer Science')).not.toBe(
      normalizeIdentity('MSc Computer Science'),
    )
  })

  it('is idempotent', () => {
    const once = normalizeIdentity('  Jāmiʿat   al-Malik  Saʿūd  ')
    expect(normalizeIdentity(once ?? '')).toBe(once)
  })
})

describe('identityKey — composite key', () => {
  it('joins normalized parts with a pipe', () => {
    expect(identityKey('King Saud University', 'BSc', 'Computer Science')).toBe(
      'king saud university|bsc|computer science',
    )
  })

  it('returns null when every part is empty', () => {
    expect(identityKey('', null, undefined)).toBeNull()
    expect(identityKey('  ', '\t')).toBeNull()
  })

  it('keeps partial keys when at least one part is non-empty', () => {
    expect(identityKey('React', null, '')).toBe('react||')
    expect(identityKey('King Saud University', null)).toBe('king saud university|')
  })
})
