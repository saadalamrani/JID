/**
 * Desktop + mobile SmartHeader actor boundaries (AR/EN, focus affordances).
 */
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SmartHeader } from '@/components/layout/smart-header'
import en from '../../../messages/en.json'
import ar from '../../../messages/ar.json'

const pathnameState = vi.hoisted(() => ({ pathname: '/company/dashboard' }))

vi.mock('next/dynamic', () => ({
  default: () => {
    function MockDynamic() {
      return null
    }
    return MockDynamic
  },
}))

vi.mock('next/image', () => ({
  default: ({ alt, ...props }: { alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} {...props} />
  ),
}))

vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light', setTheme: vi.fn() }),
}))

vi.mock('@/components/ui/theme-toggle-lazy', () => ({
  ThemeToggleLazy: () => null,
}))

vi.mock('@/components/layout/language-switcher', () => ({
  LanguageSwitcher: () => null,
}))

vi.mock('@/components/brand/logo', () => ({
  Logo: () => <span>JID</span>,
}))

vi.mock('@/components/shared/command-palette', () => ({
  useCommandPaletteHotkey: () => undefined,
}))

vi.mock('@/lib/i18n/navigation', () => ({
  Link: ({
    href,
    children,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: ReactNode }) => (
    <a href={typeof href === 'string' ? href : '#'} {...props}>
      {children}
    </a>
  ),
  usePathname: () => pathnameState.pathname,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}))

vi.mock('next-intl', async () => {
  const actual = await vi.importActual<typeof import('next-intl')>('next-intl')
  return {
    ...actual,
    useLocale: () => 'en',
    useTranslations: (namespace: string) => {
      const messages = en as Record<string, unknown>
      const parts = namespace.split('.')
      let cursor: unknown = messages
      for (const part of parts) {
        cursor = (cursor as Record<string, unknown>)[part]
      }
      const bag = cursor as Record<string, unknown>
      return (key: string, values?: Record<string, string>) => {
        const keyParts = key.split('.')
        let resolved: unknown = bag
        for (const part of keyParts) {
          resolved = (resolved as Record<string, unknown>)?.[part]
        }
        let message = typeof resolved === 'string' ? resolved : key
        for (const [name, value] of Object.entries(values ?? {})) {
          message = message.replace(`{${name}}`, value)
        }
        return message
      }
    },
  }
})

function renderHeader(overrides: Partial<Parameters<typeof SmartHeader>[0]> = {}) {
  return render(
    <SmartHeader
      isAuthenticated
      userId="user-1"
      fullName="Test User"
      avatarUrl={null}
      roleLabel="Company admin"
      dashboardHref="/company/dashboard"
      hasMentorRole={false}
      role="company_admin"
      {...overrides}
    />,
  )
}

afterEach(() => {
  cleanup()
})

describe('SmartHeader actor boundaries — Business', () => {
  beforeEach(() => {
    pathnameState.pathname = '/company/dashboard'
  })

  it('desktop + mobile omit Radar/Mentorship and keep Business destinations (EN)', async () => {
    const user = userEvent.setup()
    renderHeader({ role: 'company_admin', roleLabel: en.profileDropdown.roles.company_admin })

    const desktopNav = screen.getByRole('navigation', {
      name: en.publicShell.nav.primaryAria,
    })
    expect(within(desktopNav).queryByText(en.publicShell.nav.radar)).toBeNull()
    expect(within(desktopNav).queryByText(en.publicShell.nav.mentorship)).toBeNull()
    expect(
      within(desktopNav).getByRole('link', { name: en.publicShell.nav.businessDashboard }),
    ).toHaveAttribute('href', '/company/dashboard')
    expect(
      within(desktopNav).getByRole('link', { name: en.publicShell.nav.businessProfile }),
    ).toHaveAttribute('href', '/company/profile')
    expect(
      within(desktopNav).getByRole('link', { name: en.publicShell.nav.businessJobs }),
    ).toHaveAttribute('href', '/jobs')

    const menuTrigger = screen.getByRole('button', { name: en.profileDropdown.menuAria })
    expect(menuTrigger).toHaveAccessibleName(en.profileDropdown.menuAria)
    await user.click(menuTrigger)
    expect(screen.queryByRole('menuitem', { name: en.profileDropdown.actions.radar })).toBeNull()
    expect(screen.queryByRole('menuitem', { name: en.profileDropdown.actions.cv })).toBeNull()
    expect(
      screen.getByRole('menuitem', { name: en.profileDropdown.actions.dashboard }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('menuitem', { name: en.profileDropdown.actions.jobs }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: en.profileDropdown.settings })).toBeNull()
    await user.keyboard('{Escape}')

    await user.click(screen.getByRole('button', { name: en.publicShell.nav.menuOpen }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).queryByText(en.publicShell.nav.radar)).toBeNull()
    expect(within(dialog).queryByText(en.publicShell.nav.mentorship)).toBeNull()
    expect(
      within(dialog).getByRole('link', { name: en.publicShell.nav.businessDashboard }),
    ).toBeInTheDocument()
  })
})

describe('SmartHeader actor boundaries — University', () => {
  beforeEach(() => {
    pathnameState.pathname = '/university/dashboard'
  })

  it('desktop + mobile omit Individual leaks and keep institutional destinations', async () => {
    const user = userEvent.setup()
    renderHeader({
      role: 'university_admin',
      roleLabel: en.profileDropdown.roles.university_admin,
      dashboardHref: '/university/dashboard',
    })

    const desktopNav = screen.getByRole('navigation', {
      name: en.publicShell.nav.primaryAria,
    })
    expect(within(desktopNav).queryByText(en.publicShell.nav.radar)).toBeNull()
    expect(within(desktopNav).queryByText(en.publicShell.nav.mentorship)).toBeNull()
    expect(
      within(desktopNav).getByRole('link', { name: en.publicShell.nav.universityDashboard }),
    ).toHaveAttribute('href', '/university/dashboard')
    expect(
      within(desktopNav).getByRole('link', { name: en.publicShell.nav.universityProfile }),
    ).toHaveAttribute('href', '/university/profile')

    await user.click(screen.getByRole('button', { name: en.publicShell.nav.menuOpen }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).queryByText(en.publicShell.nav.catalog)).toBeNull()
    expect(
      within(dialog).getByRole('link', { name: en.publicShell.nav.universityProfile }),
    ).toBeInTheDocument()
  })
})

describe('SmartHeader actor boundaries — Individual regression', () => {
  beforeEach(() => {
    pathnameState.pathname = '/profile'
  })

  it('keeps Radar, Mentorship, and CV for Individual (EN)', async () => {
    const user = userEvent.setup()
    renderHeader({
      role: 'individual',
      roleLabel: en.profileDropdown.roles.individual,
      dashboardHref: '/me',
    })

    const desktopNav = screen.getByRole('navigation', {
      name: en.publicShell.nav.primaryAria,
    })
    expect(within(desktopNav).getByRole('link', { name: en.publicShell.nav.radar })).toHaveAttribute(
      'href',
      '/radar',
    )
    expect(
      within(desktopNav).getByRole('link', { name: en.publicShell.nav.abhathli }),
    ).toHaveAttribute('href', '/abhathli')

    await user.click(screen.getByRole('button', { name: en.profileDropdown.menuAria }))
    expect(
      screen.getByRole('menuitem', { name: en.profileDropdown.actions.radar }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('menuitem', { name: en.profileDropdown.actions.cv }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('menuitem', { name: en.profileDropdown.settings }),
    ).toBeInTheDocument()
  })
})

describe('SmartHeader actor boundaries — AR/EN + RTL', () => {
  it('keeps Claim/مطالبة out of shell nav copy and supports RTL wrapper', () => {
    expect(JSON.stringify(ar.publicShell.nav)).not.toMatch(/مطالبة/)
    expect(JSON.stringify(en.publicShell.nav)).not.toMatch(/Claim/i)
    expect(ar.publicShell.nav.businessDashboard).toBeTruthy()
    expect(ar.publicShell.nav.universityProfile).toBeTruthy()
    expect(en.publicShell.nav.businessJobs).toBeTruthy()

    pathnameState.pathname = '/company/dashboard'
    const { container } = render(
      <div dir="rtl" lang="ar">
        <SmartHeader
          isAuthenticated
          userId="user-1"
          fullName="مستخدم"
          avatarUrl={null}
          roleLabel={ar.profileDropdown.roles.company_admin}
          dashboardHref="/company/dashboard"
          hasMentorRole={false}
          role="company_admin"
        />
      </div>,
    )
    expect(container.querySelector('[dir="rtl"]')).toBeTruthy()
    expect(
      screen.getByRole('navigation', { name: en.publicShell.nav.primaryAria }),
    ).toBeInTheDocument()
  })
})
