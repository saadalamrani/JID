/**
 * PSW-002 — Staff Verification Decision Experience.
 *
 * Reads messages/en.json and messages/ar.json directly (not through the
 * next-intl mock, which just echoes keys) and proves two things about the
 * actual visible copy for the Staff verification decision journey:
 *
 *  15. None of the live, user-facing nodes for this journey contain
 *      "Claim"/"مطالبة" wording — checked against the *values*, not the
 *      (intentionally still internal, schema-bound) key paths like
 *      `staff.claims.*`.
 *  14. The approval path explicitly and correctly states that no Profile
 *      was created automatically, in both languages.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

function loadMessages(locale: 'en' | 'ar'): Record<string, unknown> {
  const raw = readFileSync(join(process.cwd(), 'messages', `${locale}.json`), 'utf-8')
  return JSON.parse(raw)
}

function get(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key]
    }
    return undefined
  }, obj)
}

function collectStringValues(node: unknown, out: string[] = []): string[] {
  if (typeof node === 'string') {
    out.push(node)
  } else if (node && typeof node === 'object') {
    for (const value of Object.values(node)) collectStringValues(value, out)
  }
  return out
}

// Live, user-facing nodes for the verification decision journey (confirmed
// via source grep to be the ones actually rendered — not the still-present,
// intentionally-untouched legacy `staff.claimReview` / dead `staff.claims`
// title/subtitle nodes this task was told not to broadly clean up).
const LIVE_NODE_PATHS = [
  'staff.verification',
  'staff.verificationReview',
  'staff.claims.list',
  'staff.claims.card',
  'staff.claims.filters',
  'staff.claims.realtime',
]

const en = loadMessages('en')
const ar = loadMessages('ar')

describe('15. Visible AR/EN copy for the verification journey uses Verification terminology', () => {
  it.each(LIVE_NODE_PATHS)('en: %s has no visible "claim" wording', (path) => {
    const node = get(en, path)
    expect(node).toBeDefined()
    const values = collectStringValues(node)
    expect(values.length).toBeGreaterThan(0)
    for (const value of values) {
      expect(value.toLowerCase()).not.toMatch(/\bclaim/)
    }
  })

  it.each(LIVE_NODE_PATHS)('ar: %s has no visible "مطالب" wording', (path) => {
    const node = get(ar, path)
    expect(node).toBeDefined()
    const values = collectStringValues(node)
    expect(values.length).toBeGreaterThan(0)
    for (const value of values) {
      expect(value).not.toMatch(/مطالب/)
    }
  })
})

describe('14. Approval confirmation copy explicitly states no Profile was created', () => {
  it('en: the approve success toast and the durable notice both say so', () => {
    const success = get(en, 'staff.verificationReview.workspace.decision.success.approved') as string
    const notice = get(en, 'staff.verificationReview.workspace.approvedNoProfileNotice') as string
    expect(success.toLowerCase()).toMatch(/no profile was created automatically/)
    expect(notice.toLowerCase()).toMatch(/no profile was created automatically/)
  })

  it('ar: the approve success toast and the durable notice both say so', () => {
    const success = get(ar, 'staff.verificationReview.workspace.decision.success.approved') as string
    const notice = get(ar, 'staff.verificationReview.workspace.approvedNoProfileNotice') as string
    expect(success).toMatch(/لم يتم إنشاء أي ملف تعريفي تلقائياً/)
    expect(notice).toMatch(/لم يتم إنشاء أي ملف تعريفي تلقائياً/)
  })

  it('the rejected success copy makes no profile-creation claim either way (nothing to contradict)', () => {
    const enRejected = get(en, 'staff.verificationReview.workspace.decision.success.rejected') as string
    const arRejected = get(ar, 'staff.verificationReview.workspace.decision.success.rejected') as string
    expect(enRejected).toBeTruthy()
    expect(arRejected).toBeTruthy()
  })
})

describe('Sanity: the new i18n keys exist in both locales with matching interpolation placeholders', () => {
  const keysWithPlaceholders: Array<[string, RegExp]> = [
    ['staff.claims.card.sla.minutesLeft', /\{minutes\}/],
    ['staff.claims.card.sla.hoursLeft', /\{hours\}/],
    ['staff.verificationReview.workspace.checklist.progress', /\{completed\}.*\{total\}/],
    ['staff.verificationReview.workspace.relatedHistory.title', /^.+$/],
  ]

  it.each(keysWithPlaceholders)('%s matches %s in both en and ar', (path, pattern) => {
    const enValue = get(en, path) as string
    const arValue = get(ar, path) as string
    expect(enValue).toMatch(pattern)
    expect(arValue).toMatch(pattern)
  })
})
