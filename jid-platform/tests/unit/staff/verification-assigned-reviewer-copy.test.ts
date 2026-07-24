/**
 * Spec 02-B — AR/EN parity for the not_assigned_reviewer decision copy.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = join(__dirname, '../../..')

function loadMessages(locale: 'en' | 'ar') {
  return JSON.parse(readFileSync(join(root, 'messages', `${locale}.json`), 'utf8')) as {
    staff: {
      verificationReview: {
        workspace: {
          decision: Record<string, unknown>
        }
      }
    }
  }
}

describe('Spec 02-B not_assigned_reviewer copy parity', () => {
  it('adds matching notAssignedReviewer keys under verificationReview.workspace.decision', () => {
    const en = loadMessages('en').staff.verificationReview.workspace.decision
    const ar = loadMessages('ar').staff.verificationReview.workspace.decision

    expect(typeof en.notAssignedReviewer).toBe('string')
    expect(typeof ar.notAssignedReviewer).toBe('string')
    expect(String(en.notAssignedReviewer).length).toBeGreaterThan(0)
    expect(String(ar.notAssignedReviewer).length).toBeGreaterThan(0)
    expect(String(en.notAssignedReviewer)).not.toMatch(/claim/i)
    expect(String(ar.notAssignedReviewer)).not.toMatch(/مطالب/)
  })
})
