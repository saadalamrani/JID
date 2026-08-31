import { describe, expect, it } from 'vitest'
import { findMatchingGuard } from '@/lib/auth/guards'
import {
  isPostLoginNextAllowedForRole,
  resolvePostLoginDestination,
} from '@/lib/auth/portal-routes'

describe('Interview functional hardening — actor route guards', () => {
  it('guards Individual-only capability routes', () => {
    expect(findMatchingGuard('/radar')?.id).toBe('individual-radar')
    expect(findMatchingGuard('/radar')?.allowedRoles).toEqual(['individual'])
    expect(findMatchingGuard('/abhathli')?.id).toBe('individual-abhathli')
    expect(findMatchingGuard('/abhathli')?.allowedRoles).toEqual(['individual'])
    expect(findMatchingGuard('/en/abhathli')?.id).toBe('individual-abhathli')
    expect(findMatchingGuard('/network')?.id).toBe('individual-professional-network')
    expect(findMatchingGuard('/en/network')?.allowedRoles).toEqual(['individual'])

    expect(findMatchingGuard('/profile/cv')?.id).toBe('individual-profile')
    expect(findMatchingGuard('/profile/edit')?.id).toBe('individual-profile')
    expect(findMatchingGuard('/notifications')?.id).toBe('individual-notifications-inbox')
    expect(findMatchingGuard('/settings/verify-phone')?.id).toBe('individual-settings')
    expect(findMatchingGuard('/settings/sessions')?.id).toBe('individual-settings')
  })

  it('keeps public UUID profiles public (not owner-gated)', () => {
    const guard = findMatchingGuard('/profile/11111111-1111-4111-8111-111111111111')
    expect(guard?.id).toBe('public-individual-profile')
    expect(guard?.allowedRoles).toBeNull()
  })

  it('guards Business billing and cross-actor conversations', () => {
    const billing = findMatchingGuard('/billing')
    expect(billing?.id).toBe('company-billing')
    expect(billing?.allowedRoles).toEqual(['entity', 'company_admin'])
    expect(billing?.conditions).toContain('organization_profile')

    const conversations = findMatchingGuard('/conversations')
    expect(conversations?.id).toBe('authenticated-conversations')
    expect(conversations?.allowedRoles).toContain('individual')
    expect(conversations?.allowedRoles).toContain('company_admin')
    expect(conversations?.allowedRoles).toContain('university_admin')
  })

  it('drops incompatible post-login next targets for org actors', () => {
    expect(isPostLoginNextAllowedForRole('company_admin', '/radar')).toBe(false)
    expect(isPostLoginNextAllowedForRole('university_admin', '/profile/cv')).toBe(false)
    expect(isPostLoginNextAllowedForRole('individual', '/radar')).toBe(true)

    expect(
      resolvePostLoginDestination('company_admin', { next: '/radar' }),
    ).toBe('/company/dashboard')
    expect(
      resolvePostLoginDestination('university_admin', { next: '/profile/cv' }),
    ).toBe('/university/dashboard')
    expect(resolvePostLoginDestination('individual', { next: '/radar' })).toBe('/radar')
  })
})
