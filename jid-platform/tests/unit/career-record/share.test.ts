import { describe, expect, it } from 'vitest'
import { resolveCvSharePresentation } from '@/lib/career-record/share'
import type { OwnerAuthorizationRow } from '@/lib/career-record/share'

function auth(overrides: Partial<OwnerAuthorizationRow> = {}): OwnerAuthorizationRow {
  return {
    id: 'auth-1',
    purpose_code: 'PUBLIC_SHARE',
    recipient_type: 'PUBLIC',
    recipient_ref: null,
    object_ref: { id: 'cv-1' },
    data_category: null,
    state: 'ACTIVE',
    effective_at: '2020-01-01T00:00:00.000Z',
    expires_at: null,
    revoked_at: null,
    ...overrides,
  }
}

describe('resolveCvSharePresentation', () => {
  it('stays private without an exact active authorization', () => {
    expect(resolveCvSharePresentation([], 'cv-1')).toEqual({ kind: 'private' })
  })

  it('does not treat verification, selection, or affiliation as share', () => {
    expect(
      resolveCvSharePresentation(
        [auth({ state: 'REVOKED', revoked_at: '2026-01-01T00:00:00.000Z' })],
        'cv-1',
      ),
    ).toEqual({ kind: 'private' })
  })

  it('returns authorized only for a currently active matching grant', () => {
    const share = resolveCvSharePresentation([auth()], 'cv-1')
    expect(share).toEqual({
      kind: 'authorized',
      purpose: 'PUBLIC_SHARE',
      recipient_label: 'PUBLIC',
      authorization_ref: { id: 'auth-1' },
    })
  })

  it('fail-closes expired, future-effective, and object mismatch grants', () => {
    expect(
      resolveCvSharePresentation(
        [auth({ expires_at: '2020-01-02T00:00:00.000Z' })],
        'cv-1',
        Date.parse('2026-01-01T00:00:00.000Z'),
      ),
    ).toEqual({ kind: 'private' })
    expect(
      resolveCvSharePresentation(
        [auth({ effective_at: '2099-01-01T00:00:00.000Z' })],
        'cv-1',
      ),
    ).toEqual({ kind: 'private' })
    expect(resolveCvSharePresentation([auth({ object_ref: { id: 'cv-other' } })], 'cv-1')).toEqual({
      kind: 'private',
    })
  })
})
