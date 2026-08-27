import { describe, expect, it } from 'vitest'
import {
  INDIVIDUAL_QUICK_ACTIONS,
  PUBLIC_GUEST_QUICK_ACTIONS,
} from '@/lib/navigation/individual-quick-actions'

describe('Wave 1 — individual quick actions integrity', () => {
  it('does not expose retired Pulse in active quick actions', () => {
    expect(INDIVIDUAL_QUICK_ACTIONS.some((action) => action.key === 'pulse')).toBe(false)
    expect(INDIVIDUAL_QUICK_ACTIONS.some((action) => action.href === '/pulse')).toBe(false)
    expect(PUBLIC_GUEST_QUICK_ACTIONS.some((action) => action.key === 'pulse')).toBe(false)
  })

  it('keeps core individual destinations', () => {
    const keys = INDIVIDUAL_QUICK_ACTIONS.map((action) => action.key)
    expect(keys).toEqual([
      'opportunities',
      'mentors',
      'catalog',
      'profile',
      'radar',
      'careerRecord',
      'cvProjection',
      'cv',
      'notifications',
      'settings',
    ])
  })
})
