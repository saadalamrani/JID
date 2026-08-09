/**
 * Institutional Onboarding UX Wave 1 — visible journey invariants.
 * Architecture (Directory → Verification → deliberate Profile) stays unchanged;
 * this suite guards presentation-only reconciliation.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  INSTITUTIONAL_JOURNEY_CHAPTERS,
  mapWizardStepToJourneyChapter,
} from '@/lib/entity/journey-chapters'

const root = join(__dirname, '../../..')

type Json = Record<string, unknown>

function load(locale: 'en' | 'ar'): Json {
  return JSON.parse(readFileSync(join(root, 'messages', `${locale}.json`), 'utf8')) as Json
}

function readSrc(relativePath: string): string {
  return readFileSync(join(root, relativePath), 'utf8')
}

function collectStrings(node: unknown, out: string[] = []): string[] {
  if (typeof node === 'string') {
    out.push(node)
    return out
  }
  if (Array.isArray(node)) {
    for (const item of node) collectStrings(item, out)
    return out
  }
  if (node && typeof node === 'object') {
    for (const value of Object.values(node as Json)) collectStrings(value, out)
  }
  return out
}

function entityOnboardingNamespaces(locale: 'en' | 'ar') {
  const messages = load(locale)
  const entity = messages.entity as Json
  const company = messages.company as Json
  const university = messages.university as Json
  return {
    entityType: entity.entityType,
    wizard: entity.wizard,
    pendingReview: entity.pendingReview,
    rejected: entity.rejected,
    reapply: entity.reapply,
    approvedWithoutProfile: entity.approvedWithoutProfile,
    companyProfileCreation: company.profileCreation,
    universityProfileCreation: university.profileCreation,
  }
}

describe('Institutional onboarding UX wave 1', () => {
  it('1. institutional onboarding copy has no visible Claim / مطالبة terminology', () => {
    for (const locale of ['en', 'ar'] as const) {
      const ns = entityOnboardingNamespaces(locale)
      const blob = collectStrings(ns).join('\n')
      if (locale === 'en') {
        expect(blob.toLowerCase()).not.toMatch(/\bclaims?\b/)
        expect(blob.toLowerCase()).not.toMatch(/take control/)
        expect(blob.toLowerCase()).not.toMatch(/own your listing/)
        expect(blob.toLowerCase()).not.toMatch(/licensed/)
      } else {
        expect(blob).not.toMatch(/مطالب/)
      }
    }
  })

  it('2. university selector uses i18n for AR/EN (no hardcoded Arabic in component)', () => {
    const selection = readSrc('src/components/entity/step-entity-selection.tsx')
    expect(selection).not.toMatch(/اختر الجامعة/)
    expect(selection).toMatch(/t\('tabs\.university'\)/)
    expect(selection).toMatch(/universitySearchLabel/)

    const en = load('en') as { entity: { wizard: { entity: { tabs: { university: string } } } } }
    const ar = load('ar') as { entity: { wizard: { entity: { tabs: { university: string } } } } }
    expect(en.entity.wizard.entity.tabs.university).toBe('Select university')
    expect(ar.entity.wizard.entity.tabs.university).toBe('اختر الجامعة')
  })

  it('3. pending is not a visible completed wizard chapter', () => {
    expect([...INSTITUTIONAL_JOURNEY_CHAPTERS]).toEqual(['identify', 'verify', 'prepare'])
    expect(INSTITUTIONAL_JOURNEY_CHAPTERS).not.toContain('pending')

    const shell = readSrc('src/components/entity/wizard-shell.tsx')
    expect(shell).toMatch(/institutional-journey-chapters/)
    expect(shell).toMatch(/grid-cols-3/)
    expect(shell).not.toMatch(/ENTITY_WIZARD_STEPS/)

    const wizard = readSrc('src/components/entity/entity-signup-wizard.tsx')
    expect(wizard).toMatch(/mapWizardStepToJourneyChapter/)
    expect(wizard).toMatch(/currentChapter/)
  })

  it('4. approved state does not imply auto-created Profile', () => {
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

  it('5. verification copy does not imply Directory ownership', () => {
    const en = load('en') as {
      entity: {
        wizard: {
          verification: { intro: string; submit: string }
          entity: { newIntro: string; tabs: { new: string } }
        }
      }
    }
    expect(en.entity.wizard.verification.intro.toLowerCase()).toMatch(/authorized to represent/)
    expect(en.entity.wizard.verification.submit.toLowerCase()).toMatch(/confirm representation/)
    expect(en.entity.wizard.entity.newIntro.toLowerCase()).toMatch(/does not create a profile/)
    expect(en.entity.wizard.entity.newIntro.toLowerCase()).toMatch(/ownership/)
    expect(en.entity.wizard.entity.tabs.new.toLowerCase()).toMatch(/can't find/)
  })

  it('6. pending outcome has no Profile creation CTA', () => {
    const pendingView = readSrc('src/components/entity/pending-review-view.tsx')
    expect(pendingView).not.toMatch(/create-profile/)
    expect(pendingView).not.toMatch(/Prepare .*Profile/)
    expect(pendingView).toMatch(/whatHappened/)
    expect(pendingView).toMatch(/whatNext/)

    const en = load('en') as { entity: { pendingReview: Record<string, string> } }
    const values = Object.values(en.entity.pendingReview).join(' ').toLowerCase()
    expect(values).not.toMatch(/create profile now|create your profile/)
  })

  it('7. reapply uses verification language for Business and University', () => {
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

  it('8. Business and University outcome labels are conceptually aligned', () => {
    const en = load('en') as {
      entity: {
        pendingReview: { title: string }
        rejected: { title: string; reapplyCta: string }
        reapply: { title: string }
        approvedWithoutProfile: {
          business: { cta: string }
          university: { cta: string }
        }
      }
    }
    expect(en.entity.pendingReview.title.toLowerCase()).toMatch(/reviewing your representation/)
    expect(en.entity.rejected.title.toLowerCase()).toMatch(/not approved/)
    expect(en.entity.reapply.title).toBe(en.entity.rejected.reapplyCta)
    expect(en.entity.approvedWithoutProfile.business.cta.toLowerCase()).toMatch(/prepare/)
    expect(en.entity.approvedWithoutProfile.university.cta.toLowerCase()).toMatch(/prepare/)
  })

  it('9. current UI does not link to legacy Claim reapply route', () => {
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

  it('10. draft Profile creation remains deliberate', () => {
    const en = load('en') as {
      company: { profileCreation: { create: string; subtitle: string } }
      university: { profileCreation: { create: string; subtitle: string } }
    }
    expect(en.company.profileCreation.create.toLowerCase()).toMatch(/draft/)
    expect(en.university.profileCreation.create.toLowerCase()).toMatch(/draft/)
    expect(en.company.profileCreation.subtitle.toLowerCase()).toMatch(/draft/)
    expect(en.company.profileCreation.subtitle.toLowerCase()).toMatch(/publish when ready/)
  })

  it('11. publication remains separate and explicit from create-profile copy', () => {
    const en = load('en') as {
      company: { profileCreation: { subtitle: string; create: string } }
      university: { profileCreation: { subtitle: string; create: string } }
    }
    expect(en.company.profileCreation.create.toLowerCase()).not.toMatch(/publish/)
    expect(en.university.profileCreation.create.toLowerCase()).not.toMatch(/publish/)
    expect(en.company.profileCreation.subtitle.toLowerCase()).toMatch(/publish when ready/)
    expect(en.university.profileCreation.subtitle.toLowerCase()).toMatch(/publish when ready/)
  })

  it('maps technical wizard steps onto Identify / Verify chapters only', () => {
    expect(mapWizardStepToJourneyChapter('account')).toBe('identify')
    expect(mapWizardStepToJourneyChapter('entity', 'selection')).toBe('identify')
    expect(mapWizardStepToJourneyChapter('entity', 'claim')).toBe('verify')
    expect(mapWizardStepToJourneyChapter('verify_email')).toBe('verify')
    // Pending remains an outcome redirect; chapter mapping stays Verify (never Prepare).
    expect(mapWizardStepToJourneyChapter('pending')).toBe('verify')
  })

  it('actor entry asks who the user represents', () => {
    const en = load('en') as {
      entity: {
        entityType: {
          title: string
          company: { description: string }
          university: { description: string }
        }
      }
    }
    const ar = load('ar') as {
      entity: { entityType: { title: string } }
    }
    expect(en.entity.entityType.title).toBe('Who do you represent?')
    expect(ar.entity.entityType.title).toBe('من تمثّل؟')
    expect(en.entity.entityType.company.description.toLowerCase()).toMatch(/represent/)
    expect(en.entity.entityType.university.description.toLowerCase()).toMatch(/represent/)
    expect(en.entity.entityType.company.description.toLowerCase()).not.toMatch(/verification request/)
  })
})
