/**
 * Remaining institutional onboarding outcome invariants after the registration correction.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = join(__dirname, '../../..')

type Json = Record<string, unknown>

function load(locale: 'en' | 'ar'): Json {
  return JSON.parse(readFileSync(join(root, 'messages', `${locale}.json`), 'utf8')) as Json
}

function readSrc(relativePath: string): string {
  return readFileSync(join(root, relativePath), 'utf8')
}

describe('Institutional onboarding outcomes', () => {
  it('approved state does not imply auto-created Profile', () => {
    const en = load('en') as {
      entity: {
        approvedWithoutProfile: {
          business: { message: string; cta: string }
          university: { message: string; cta: string }
        }
      }
    }
    for (const node of [
      en.entity.approvedWithoutProfile.business,
      en.entity.approvedWithoutProfile.university,
    ]) {
      expect(node.message.toLowerCase()).toMatch(/when you choose to prepare/)
      expect(node.message.toLowerCase()).not.toMatch(/automatically created|created automatically/)
      expect(node.cta.toLowerCase()).toMatch(/prepare/)
    }
  })

  it('reapply uses verification language for Business and University', () => {
    const en = load('en') as {
      entity: { reapply: { title: string }; rejected: { reapplyCta: string } }
    }
    const ar = load('ar') as {
      entity: { reapply: { title: string }; rejected: { reapplyCta: string } }
    }
    expect(en.entity.reapply.title.toLowerCase()).toMatch(/verification/)
    expect(en.entity.rejected.reapplyCta.toLowerCase()).toMatch(/verification/)
    expect(ar.entity.reapply.title).toMatch(/تحقق/)
    expect(ar.entity.rejected.reapplyCta).toMatch(/تحقق/)
    expect(en.entity.reapply.title.toLowerCase()).not.toMatch(/claim/)
  })

  it('current UI does not link to legacy Claim reapply route', () => {
    const rejectedBusiness = readSrc(
      'src/app/[locale]/(company)/company/verification-rejected/page.tsx',
    )
    const rejectedUniversity = readSrc(
      'src/app/[locale]/(university)/university/rejected/page.tsx',
    )
    expect(rejectedBusiness).toMatch(/\/company\/verification\/reapply/)
    expect(rejectedBusiness).not.toMatch(/\/company\/claim\/reapply/)
    expect(rejectedUniversity).toMatch(/\/university\/reapply/)
    expect(rejectedUniversity).not.toMatch(/\/company\/claim\/reapply/)

    const legacy = readSrc('src/app/[locale]/(company)/company/claim/reapply/page.tsx')
    expect(legacy).toMatch(/redirect\('\/company\/verification\/reapply'\)/)
  })

  it('draft Profile creation remains deliberate', () => {
    const en = load('en') as {
      company: { profileCreation: { create: string; subtitle: string } }
      university: { profileCreation: { create: string; subtitle: string } }
    }
    expect(en.company.profileCreation.create.toLowerCase()).toMatch(/draft/)
    expect(en.university.profileCreation.create.toLowerCase()).toMatch(/draft/)
    expect(en.company.profileCreation.subtitle.toLowerCase()).toMatch(/draft/)
    expect(en.company.profileCreation.subtitle.toLowerCase()).toMatch(/publish when ready/)
  })

  it('publication remains separate and explicit from create-profile copy', () => {
    const en = load('en') as {
      company: { profileCreation: { subtitle: string; create: string } }
      university: { profileCreation: { subtitle: string; create: string } }
    }
    expect(en.company.profileCreation.create.toLowerCase()).not.toMatch(/publish/)
    expect(en.university.profileCreation.create.toLowerCase()).not.toMatch(/publish/)
    expect(en.company.profileCreation.subtitle.toLowerCase()).toMatch(/publish when ready/)
    expect(en.university.profileCreation.subtitle.toLowerCase()).toMatch(/publish when ready/)
  })
})
