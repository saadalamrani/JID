import { describe, expect, it } from 'vitest'
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  formatRelativeTime,
} from '@/lib/utils/format'
import { TIMEZONE } from '@/lib/utils/constants'

/** Fixed instant: 2024-06-15 12:30:00 Asia/Riyadh (UTC+3) → 09:30 UTC */
const RIYADH_NOON = new Date('2024-06-15T09:30:00.000Z')

describe('formatDate', () => {
  it('formats with Asia/Riyadh timezone and Latin digits in ar locale', () => {
    const result = formatDate(RIYADH_NOON, 'ar', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    expect(result).toMatch(/2024/)
    expect(result).toMatch(/15/)
    expect(result).not.toMatch(/[٠-٩]/)
  })

  it('uses Asia/Riyadh for en locale (same calendar day as Riyadh)', () => {
    const result = formatDate(RIYADH_NOON, 'en-US', {
      timeZone: TIMEZONE,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
    expect(result).toContain('2024')
    expect(result).toMatch(/Jun|June/)
    expect(result).toContain('15')
  })
})

describe('formatDateTime', () => {
  it('includes time components with Latin digits', () => {
    const result = formatDateTime(RIYADH_NOON, 'en-US')
    expect(result).toMatch(/2024/)
    expect(result).not.toMatch(/[٠-٩]/)
    expect(result).toMatch(/12|PM|pm|30/)
  })
})

describe('formatNumber', () => {
  it('uses Latin digit numbering system for Arabic locale', () => {
    const result = formatNumber(1234567.89, 'ar-SA')
    expect(result).toMatch(/1/)
    expect(result).not.toMatch(/[٠-٩]/)
  })
})

describe('formatCurrency', () => {
  it('formats SAR with Latin digits', () => {
    const result = formatCurrency(1500, 'ar-SA', 'SAR')
    expect(result).toMatch(/1.?500|1,500/)
    expect(result).not.toMatch(/[٠-٩]/)
    expect(result.toUpperCase()).toMatch(/SAR|ر\.س|﷼/)
  })
})

describe('formatRelativeTime', () => {
  it('returns relative minutes when difference is under one hour', () => {
    const base = new Date('2024-06-15T09:00:00.000Z')
    const target = new Date('2024-06-15T09:15:00.000Z')
    const result = formatRelativeTime(target, 'en', base)
    expect(result).toMatch(/15|minute/i)
  })

  it('returns relative days when difference is over one day', () => {
    const base = new Date('2024-06-15T09:00:00.000Z')
    const target = new Date('2024-06-17T09:00:00.000Z')
    const result = formatRelativeTime(target, 'en', base)
    expect(result).toMatch(/2|day/i)
  })
})
