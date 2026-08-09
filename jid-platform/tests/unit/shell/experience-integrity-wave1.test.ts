import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  PUBLIC_SHELL_PREFIXES,
  isPublicProfilePath,
  shouldHideAuthenticatedTopBar,
} from '@/lib/navigation/authenticated-shell-routes'

describe('Wave 1 — university shell navigation', () => {
  it('does not expose University Directory in the active University shell', () => {
    const layout = readFileSync(
      join(process.cwd(), 'src/app/[locale]/(company)/_components/university-layout.tsx'),
      'utf8',
    )
    expect(layout).not.toMatch(/href:\s*'\/universities'/)
    expect(layout).not.toMatch(/t\('directory'\)/)
    expect(layout).toMatch(/href:\s*'\/university\/dashboard'/)

    const en = JSON.parse(readFileSync(join(process.cwd(), 'messages/en.json'), 'utf8')) as {
      university: { nav: Record<string, string> }
    }
    const ar = JSON.parse(readFileSync(join(process.cwd(), 'messages/ar.json'), 'utf8')) as {
      university: { nav: Record<string, string> }
    }
    expect(en.university.nav.directory).toBeUndefined()
    expect(ar.university.nav.directory).toBeUndefined()
    expect(en.university.nav.dashboard).toBeTruthy()
    expect(ar.university.nav.dashboard).toBeTruthy()
  })
})

describe('Wave 1 — single platform header shell routing', () => {
  it('hides AuthenticatedAppShell bar on public shells that already render PublicNav', () => {
    for (const prefix of PUBLIC_SHELL_PREFIXES) {
      expect(shouldHideAuthenticatedTopBar(prefix)).toBe(true)
      expect(shouldHideAuthenticatedTopBar(`${prefix}/nested`)).toBe(true)
    }
    expect(shouldHideAuthenticatedTopBar('/plus')).toBe(true)
    expect(shouldHideAuthenticatedTopBar('/companies/acme/profile')).toBe(true)
    expect(shouldHideAuthenticatedTopBar('/u/00000000-0000-0000-0000-000000000001')).toBe(true)
  })

  it('keeps owner profile workspace on AuthenticatedAppShell SmartHeader', () => {
    expect(isPublicProfilePath('/profile')).toBe(false)
    expect(isPublicProfilePath('/profile/edit')).toBe(false)
    expect(isPublicProfilePath('/profile/cv')).toBe(false)
    expect(shouldHideAuthenticatedTopBar('/profile')).toBe(false)
    expect(shouldHideAuthenticatedTopBar('/profile/edit')).toBe(false)
    expect(shouldHideAuthenticatedTopBar('/profile/cv')).toBe(false)
  })

  it('treats public profile projections as PublicNav-only', () => {
    expect(isPublicProfilePath('/profile/abc-public-id')).toBe(true)
    expect(shouldHideAuthenticatedTopBar('/profile/abc-public-id')).toBe(true)
  })
})
