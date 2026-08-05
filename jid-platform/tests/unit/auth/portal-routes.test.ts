import { describe, expect, it } from 'vitest'
import {
  getPortalHomeForRole,
  resolvePostLoginDestination,
  sanitizePostLoginPath,
} from '@/lib/auth/portal-routes'

describe('portal post-login destinations', () => {
  it('maps the three public actors and internal roles to portal homes', () => {
    expect(getPortalHomeForRole('individual')).toBe('/me')
    expect(getPortalHomeForRole('company_admin')).toBe('/company/dashboard')
    expect(getPortalHomeForRole('university_admin')).toBe('/university/dashboard')
    expect(getPortalHomeForRole('entity')).toBe('/company/dashboard')
    expect(getPortalHomeForRole('staff')).toBe('/staff')
    expect(getPortalHomeForRole('super_admin')).toBe('/sys/dashboard')
  })

  it('routes approved mentors to the mentor hub without inventing a fourth actor', () => {
    expect(resolvePostLoginDestination('individual', { mentorApproved: true })).toBe(
      '/mentor/dashboard',
    )
    expect(resolvePostLoginDestination('individual')).toBe('/me')
  })

  it('prefers a safe next path over the role home', () => {
    expect(resolvePostLoginDestination('individual', { next: '/me/applications' })).toBe(
      '/me/applications',
    )
  })

  it('routes MFA challenges before portal homes', () => {
    expect(resolvePostLoginDestination('staff', { needsMfa: true, next: '/staff' })).toBe(
      '/login/mfa?next=%2Fstaff',
    )
    expect(resolvePostLoginDestination('staff', { needsMfa: true, needsMfaSetup: true })).toBe(
      '/login/mfa?setup=1',
    )
  })

  it('rejects open redirects', () => {
    expect(sanitizePostLoginPath('https://evil.example')).toBeNull()
    expect(sanitizePostLoginPath('//evil.example')).toBeNull()
    expect(sanitizePostLoginPath('/login')).toBeNull()
    expect(sanitizePostLoginPath('/me')).toBe('/me')
  })
})
