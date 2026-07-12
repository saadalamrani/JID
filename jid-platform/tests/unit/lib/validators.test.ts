import { describe, expect, it } from 'vitest'
import {
  bilingualNameSchema,
  isValidSaudiPhone,
  isStrongPassword,
  strongPasswordSchema,
} from '@/lib/utils/validators'

describe('isValidSaudiPhone', () => {
  it('accepts canonical Saudi mobile formats', () => {
    expect(isValidSaudiPhone('0512345678')).toBe(true)
    expect(isValidSaudiPhone('+966512345678')).toBe(true)
    expect(isValidSaudiPhone('966512345678')).toBe(true)
    expect(isValidSaudiPhone('512345678')).toBe(true)
  })

  it('accepts numbers with spaces and dashes after normalization', () => {
    expect(isValidSaudiPhone('051 234 5678')).toBe(true)
    expect(isValidSaudiPhone('05-1234-5678')).toBe(true)
  })

  it('rejects invalid prefixes and lengths', () => {
    expect(isValidSaudiPhone('0412345678')).toBe(false)
    expect(isValidSaudiPhone('051234567')).toBe(false)
    expect(isValidSaudiPhone('05123456789')).toBe(false)
    expect(isValidSaudiPhone('')).toBe(false)
  })
})

describe('bilingualNameSchema', () => {
  it('accepts Arabic and Latin mixed names', () => {
    expect(bilingualNameSchema.safeParse('أحمد Smith').success).toBe(true)
    expect(bilingualNameSchema.safeParse('Sara Al-Rashid').success).toBe(true)
  })

  it('trims and collapses internal whitespace', () => {
    const parsed = bilingualNameSchema.safeParse('  أحمد   علي  ')
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data).toBe('أحمد علي')
    }
  })

  it('rejects names that are too short or contain digits', () => {
    expect(bilingualNameSchema.safeParse('أ').success).toBe(false)
    expect(bilingualNameSchema.safeParse('أحمد123').success).toBe(false)
    expect(bilingualNameSchema.safeParse('أحمد@علي').success).toBe(false)
  })
})

describe('strongPasswordSchema', () => {
  it('accepts a password meeting all rules', () => {
    expect(strongPasswordSchema.safeParse('Secure1!pass').success).toBe(true)
    expect(isStrongPassword('Secure1!pass')).toBe(true)
  })

  it('rejects passwords missing required character classes', () => {
    expect(strongPasswordSchema.safeParse('short1!').success).toBe(false)
    expect(strongPasswordSchema.safeParse('alllowercase1!').success).toBe(false)
    expect(strongPasswordSchema.safeParse('ALLUPPERCASE1!').success).toBe(false)
    expect(strongPasswordSchema.safeParse('NoDigits!Here').success).toBe(false)
    expect(strongPasswordSchema.safeParse('NoSpecial1Here').success).toBe(false)
  })
})
