import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  BUSINESS_SHELL_NAV_ITEMS,
  getShellAccountActions,
  getSmartHeaderNavItems,
  INDIVIDUAL_SHELL_NAV_ITEMS,
  resolveShellActor,
  shellAccountHrefs,
  shellNavHrefs,
  shellShowsIndividualCommandPalette,
  shellShowsIndividualSettings,
  UNIVERSITY_SHELL_NAV_ITEMS,
} from '@/lib/navigation/actor-shell'
import { shouldHideAuthenticatedTopBar } from '@/lib/navigation/authenticated-shell-routes'
import en from '../../../messages/en.json'
import ar from '../../../messages/ar.json'

const INDIVIDUAL_LEAK_HREFS = [
  '/radar',
  '/mentors',
  '/profile/cv',
  '/profile/career-record',
  '/profile/cv-projection',
  '/profile',
] as const

describe('Organization shell separation — actor resolution', () => {
  it('maps existing roles without inventing parallel RBAC', () => {
    expect(resolveShellActor(null)).toBe('guest')
    expect(resolveShellActor('individual')).toBe('individual')
    expect(resolveShellActor('entity')).toBe('business')
    expect(resolveShellActor('company_admin')).toBe('business')
    expect(resolveShellActor('university_admin')).toBe('university')
    expect(resolveShellActor('staff')).toBe('staff')
  })
})

describe('Organization shell separation — Individual chrome unchanged', () => {
  it('keeps Radar, Mentorship, and CV in Individual primary + account contracts', () => {
    const nav = getSmartHeaderNavItems('individual')
    expect(nav).toEqual(INDIVIDUAL_SHELL_NAV_ITEMS)
    expect(shellNavHrefs('individual')).toEqual([
      '/',
      '/opportunities',
      '/radar',
      '/mentors',
      '/catalog',
    ])

    const account = getShellAccountActions({
      actor: 'individual',
      dashboardHref: '/me',
      hasMentorRole: false,
    })
    expect(account.map((a) => a.href)).toEqual([
      '/profile',
      '/radar',
      '/profile/career-record',
      '/profile/cv-projection',
      '/profile/cv',
      '/me',
    ])
    expect(shellShowsIndividualSettings('individual')).toBe(true)
    expect(shellShowsIndividualCommandPalette('individual')).toBe(true)
  })

  it('keeps mentor dashboard action only for Individual mentor capability', () => {
    const withMentor = shellAccountHrefs({
      actor: 'individual',
      dashboardHref: '/me',
      hasMentorRole: true,
    })
    expect(withMentor).toContain('/mentor/dashboard')

    const business = shellAccountHrefs({
      actor: 'business',
      dashboardHref: '/company/dashboard',
      hasMentorRole: true,
    })
    expect(business).not.toContain('/mentor/dashboard')
  })

  it('preserves guest/public primary nav (same Individual discovery set)', () => {
    expect(getSmartHeaderNavItems('guest')).toEqual(INDIVIDUAL_SHELL_NAV_ITEMS)
    expect(shellShowsIndividualCommandPalette('guest')).toBe(true)
  })
})

describe('Organization shell separation — Business chrome', () => {
  it('excludes Radar, Mentorship, and CV from primary nav', () => {
    const hrefs = shellNavHrefs('business')
    expect(hrefs).toEqual(['/company/dashboard', '/company/profile', '/jobs'])
    for (const leak of INDIVIDUAL_LEAK_HREFS) {
      expect(hrefs).not.toContain(leak)
    }
    expect(getSmartHeaderNavItems('business')).toEqual(BUSINESS_SHELL_NAV_ITEMS)
  })

  it('account menu is durable Business destinations only', () => {
    const hrefs = shellAccountHrefs({
      actor: 'business',
      dashboardHref: '/company/dashboard',
      hasMentorRole: false,
    })
    expect(hrefs).toEqual(['/company/dashboard', '/company/profile', '/jobs'])
    for (const leak of ['/radar', '/profile/cv', '/mentors', '/profile', '/profile/edit']) {
      expect(hrefs).not.toContain(leak)
    }
    expect(shellShowsIndividualSettings('business')).toBe(false)
    expect(shellShowsIndividualCommandPalette('business')).toBe(false)
  })
})

describe('Organization shell separation — University chrome', () => {
  it('excludes Radar, Mentorship, and CV from primary nav', () => {
    const hrefs = shellNavHrefs('university')
    expect(hrefs).toEqual(['/university/dashboard', '/university/profile'])
    for (const leak of INDIVIDUAL_LEAK_HREFS) {
      expect(hrefs).not.toContain(leak)
    }
    expect(getSmartHeaderNavItems('university')).toEqual(UNIVERSITY_SHELL_NAV_ITEMS)
  })

  it('account menu is institutional destinations only (no Verification nav)', () => {
    const hrefs = shellAccountHrefs({
      actor: 'university',
      dashboardHref: '/university/dashboard',
      hasMentorRole: false,
    })
    expect(hrefs).toEqual(['/university/dashboard', '/university/profile'])
    expect(hrefs.join(' ')).not.toMatch(/verification|claim|pending|rejected/i)
    expect(shellShowsIndividualSettings('university')).toBe(false)
    expect(shellShowsIndividualCommandPalette('university')).toBe(false)
  })
})

describe('Organization shell separation — AR/EN label parity', () => {
  const orgKeys = [
    'businessDashboard',
    'businessProfile',
    'businessJobs',
    'universityDashboard',
    'universityProfile',
  ] as const

  it('exposes org nav keys in EN and AR without Claim/مطالبة labels', () => {
    for (const key of orgKeys) {
      expect(en.publicShell.nav[key].length).toBeGreaterThan(0)
      expect(ar.publicShell.nav[key].length).toBeGreaterThan(0)
      expect(en.publicShell.nav[key]).not.toMatch(/claim/i)
      expect(ar.publicShell.nav[key]).not.toMatch(/مطالبة|claim/i)
    }
    expect(en.profileDropdown.actions.jobs).toBeTruthy()
    expect(ar.profileDropdown.actions.jobs).toBeTruthy()
  })
})

describe('Organization shell separation — shell routing + onboarding', () => {
  it('keeps AuthenticatedAppShell top bar on /company and /university portals', () => {
    expect(shouldHideAuthenticatedTopBar('/company/dashboard')).toBe(false)
    expect(shouldHideAuthenticatedTopBar('/company/profile')).toBe(false)
    expect(shouldHideAuthenticatedTopBar('/university/dashboard')).toBe(false)
    expect(shouldHideAuthenticatedTopBar('/university/profile')).toBe(false)
  })

  it('does not regress onboarding shell hide rules', () => {
    expect(shouldHideAuthenticatedTopBar('/welcome')).toBe(true)
    expect(shouldHideAuthenticatedTopBar('/individual')).toBe(true)
    expect(shouldHideAuthenticatedTopBar('/company/entity')).toBe(true)
    expect(shouldHideAuthenticatedTopBar('/company/entity/team')).toBe(true)
  })
})

describe('Organization shell separation — Business sidebar Settings duplicate', () => {
  it('removes false Settings item that duplicated Profile edit href', () => {
    const layout = readFileSync(
      join(process.cwd(), 'src/app/[locale]/(company)/_components/standard-company-layout.tsx'),
      'utf8',
    )
    expect(layout).not.toMatch(/t\('settings'\)/)
    expect(layout).toMatch(/href: '\/company\/profile\/edit'/)
    expect(layout).toMatch(/href: '\/company\/dashboard'/)
    expect(layout).toMatch(/href: '\/jobs'/)
  })
})

describe('Organization shell separation — University shell preserve', () => {
  it('keeps University sidebar at dashboard only (no Verification permanent nav)', () => {
    const layout = readFileSync(
      join(process.cwd(), 'src/app/[locale]/(company)/_components/university-layout.tsx'),
      'utf8',
    )
    expect(layout).toMatch(/href:\s*'\/university\/dashboard'/)
    expect(layout).not.toMatch(/verification|claim|\/universities/i)
  })
})

describe('Organization shell separation — no dead primary links in contract', () => {
  it('Business and University primary hrefs are real durable modules', () => {
    const businessPages = [
      'src/app/[locale]/(company)/company/dashboard/page.tsx',
      'src/app/[locale]/(company)/company/profile/page.tsx',
    ]
    const universityPages = [
      'src/app/[locale]/(university)/university/dashboard/page.tsx',
      'src/app/[locale]/(university)/university/profile/page.tsx',
    ]
    for (const relative of [...businessPages, ...universityPages]) {
      expect(() => readFileSync(join(process.cwd(), relative), 'utf8')).not.toThrow()
    }
  })
})
