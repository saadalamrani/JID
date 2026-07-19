import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  hasUnseenCompanyStatusChange,
  useGlowState,
} from '@/lib/hooks/use-glow-state'

const baseApplication = {
  applicant_id: 'applicant-1',
  status_changed_at: '2026-07-19T10:00:00.000Z',
  last_seen_by_user_at: '2026-07-19T09:00:00.000Z',
  status_changed_by: 'company-user',
}

describe('hasUnseenCompanyStatusChange', () => {
  it('reports an unseen company update only when it is newer than the user view', () => {
    expect(hasUnseenCompanyStatusChange(baseApplication, 'applicant-1')).toBe(true)
    expect(
      hasUnseenCompanyStatusChange(
        {
          ...baseApplication,
          last_seen_by_user_at: '2026-07-19T11:00:00.000Z',
        },
        'applicant-1',
      ),
    ).toBe(false)
  })

  it('does not glow for applicant-initiated changes', () => {
    expect(
      hasUnseenCompanyStatusChange(
        { ...baseApplication, status_changed_by: 'applicant-1' },
        'applicant-1',
      ),
    ).toBe(false)
  })
})

describe('useGlowState', () => {
  it('recomputes when a tracked application field changes', () => {
    const { result, rerender } = renderHook(
      ({ application }) => useGlowState(application, 'applicant-1'),
      { initialProps: { application: baseApplication } },
    )

    expect(result.current).toBe(true)

    rerender({
      application: {
        ...baseApplication,
        last_seen_by_user_at: '2026-07-19T11:00:00.000Z',
      },
    })

    expect(result.current).toBe(false)
  })
})
