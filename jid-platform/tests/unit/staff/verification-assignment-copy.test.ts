/**
 * Spec 02-C — AR/EN parity for view-only banner and override checkbox copy.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = join(__dirname, '../../..')

type Json = Record<string, unknown>

function load(locale: 'en' | 'ar'): Json {
  return JSON.parse(readFileSync(join(root, 'messages', `${locale}.json`), 'utf8')) as Json
}

function placeholders(value: string): string[] {
  const found: string[] = []
  const re = /\{(\w+)\}/g
  let match: RegExpExecArray | null
  while ((match = re.exec(value)) !== null) {
    found.push(match[1]!)
  }
  return found.sort()
}

function assertParity(enNode: unknown, arNode: unknown, path: string) {
  expect(typeof enNode, path).toBe(typeof arNode)
  if (typeof enNode === 'string' && typeof arNode === 'string') {
    expect(placeholders(enNode), path).toEqual(placeholders(arNode))
    expect(enNode.toLowerCase()).not.toMatch(/\bclaims?\b/)
    expect(arNode).not.toMatch(/مطالب/)
    return
  }
  expect(enNode && typeof enNode === 'object').toBe(true)
  expect(arNode && typeof arNode === 'object').toBe(true)
  const enObj = enNode as Json
  const arObj = arNode as Json
  expect(Object.keys(enObj).sort(), path).toEqual(Object.keys(arObj).sort())
  for (const key of Object.keys(enObj)) {
    assertParity(enObj[key], arObj[key], `${path}.${key}`)
  }
}

describe('Spec 02-C assignment UI copy parity', () => {
  it('matches assignedToOther and overrideAssignment keys/placeholders in EN and AR', () => {
    const en = load('en') as {
      staff: { verificationReview: { workspace: Json } }
    }
    const ar = load('ar') as {
      staff: { verificationReview: { workspace: Json } }
    }

    assertParity(
      en.staff.verificationReview.workspace.assignedToOther,
      ar.staff.verificationReview.workspace.assignedToOther,
      'assignedToOther',
    )
    assertParity(
      (en.staff.verificationReview.workspace.decision as Json).overrideAssignment,
      (ar.staff.verificationReview.workspace.decision as Json).overrideAssignment,
      'decision.overrideAssignment',
    )
  })
})
