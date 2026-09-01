/**
 * Organization registration + representative verification product contract.
 * Replaces the rejected public Directory/Catalog search → select → claim flow.
 */
import { existsSync, readFileSync } from 'node:fs'
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

describe('Organization registration onboarding contract', () => {
  it('removes public Directory/Catalog selection and claim UI', () => {
    expect(existsSync(join(root, 'src/components/entity/step-entity-selection.tsx'))).toBe(false)
    expect(existsSync(join(root, 'src/components/entity/claim-submission-form.tsx'))).toBe(false)

    const wizard = readSrc('src/components/entity/entity-signup-wizard.tsx')
    expect(wizard).not.toContain('StepEntitySelection')
    expect(wizard).not.toContain('ClaimSubmissionForm')
    expect(wizard).not.toContain('searchCompanies')
    expect(wizard).not.toContain('searchUniversitiesCatalog')
    expect(wizard).not.toContain('createUnverifiedCompany')
    expect(wizard).not.toContain('ensureUniversityCompany')
    expect(wizard).toContain('OrganizationRegistrationForm')
    expect(wizard).toContain('verify_email')
    expect(wizard).toContain('org_details')
  })

  it('keeps public signup helpers unreachable from the wizard', () => {
    const signup = readSrc('src/components/entity/organization-registration-form.tsx')
    expect(signup).not.toContain('searchCompanies')
    expect(signup).not.toContain('searchUniversitiesCatalog')
    expect(signup).not.toContain('createUnverifiedCompany')
    expect(signup).not.toContain('ensureUniversityCompany')
    expect(signup).toContain('submitVerificationRequest')
  })

  it('does not synthesize University domains', () => {
    const companies = readSrc('src/lib/entity/companies.ts')
    expect(companies).not.toMatch(/\$\{university\.short_code\}.*edu\.sa/)
    expect(companies).not.toContain('.edu.sa')
    expect(companies).toContain('is_verified: false')
  })

  it('submits unresolved organization evidence without a directory id', () => {
    const claims = readSrc('src/lib/entity/claims.ts')
    expect(claims).toContain('directory_id: null')
    expect(claims).toContain('submitVerificationRequest')
    expect(claims).not.toContain('emailDomainMatchesAllowed')
    expect(claims).not.toContain('getCompanyById')
  })

  it('requires account email before organization details', () => {
    const wizard = readSrc('src/components/entity/entity-signup-wizard.tsx')
    expect(wizard).toContain("step: emailConfirmed ? 'org_details' : 'verify_email'")
    expect(wizard).toContain('!user.email_confirmed_at')
    expect(wizard).toContain("setStep('verify_email')")

    const verify = readSrc('src/components/entity/step-verify-email.tsx')
    expect(verify).not.toContain('continueToPending')
    expect(verify).not.toContain('pendingReviewPath')
  })

  it('public onboarding copy has no Claim / مطالبة / كيان search language', () => {
    for (const locale of ['en', 'ar'] as const) {
      const messages = load(locale)
      const entity = messages.entity as Json
      const blob = collectStrings({
        entityType: entity.entityType,
        wizard: entity.wizard,
        pendingReview: entity.pendingReview,
      }).join('\n')
      if (locale === 'en') {
        expect(blob.toLowerCase()).not.toMatch(/\bclaims?\b/)
        expect(blob.toLowerCase()).not.toMatch(/claimant/)
        expect(blob.toLowerCase()).not.toMatch(/find your entity/)
        expect(blob.toLowerCase()).not.toMatch(/directory record/)
        expect(blob.toLowerCase()).not.toMatch(/catalog/)
      } else {
        expect(blob).not.toMatch(/مطالب/)
        expect(blob).not.toMatch(/كيانك/)
        expect(blob).not.toMatch(/ابحث عن كيان/)
      }
    }
  })

  it('exposes Individual, Employer, and University as public actors', () => {
    const en = load('en') as {
      entity: {
        entityType: {
          individual: { title: string }
          company: { title: string }
          university: { title: string }
        }
      }
    }
    const ar = load('ar') as {
      entity: {
        entityType: {
          individual: { title: string }
          company: { title: string }
          university: { title: string }
        }
      }
    }
    expect(en.entity.entityType.individual.title).toBe('Individual')
    expect(en.entity.entityType.company.title).toBe('Employer')
    expect(en.entity.entityType.university.title).toBe('University')
    expect(ar.entity.entityType.individual.title).toBe('فرد')
    expect(ar.entity.entityType.company.title).toBe('جهة توظيف')
    expect(ar.entity.entityType.university.title).toBe('جامعة')
  })

  it('pending outcome is honest and has no claim/SLA theatre', () => {
    const pendingView = readSrc('src/components/entity/pending-review-view.tsx')
    expect(pendingView).not.toMatch(/SlaProgressBar/)
    expect(pendingView).not.toMatch(/create-profile/)
    expect(pendingView).toMatch(/whatHappened/)

    const en = load('en') as { entity: { pendingReview: Record<string, string> } }
    const title = en.entity.pendingReview.title ?? ''
    expect(title.toLowerCase()).toMatch(/under review/)
    expect(Object.keys(en.entity.pendingReview)).not.toContain('slaLabel')
  })

  it('maps wizard steps onto Identify then Verify', () => {
    expect([...INSTITUTIONAL_JOURNEY_CHAPTERS]).toEqual(['identify', 'verify', 'prepare'])
    expect(mapWizardStepToJourneyChapter('account')).toBe('identify')
    expect(mapWizardStepToJourneyChapter('verify_email')).toBe('verify')
    expect(mapWizardStepToJourneyChapter('org_details')).toBe('verify')
    expect(mapWizardStepToJourneyChapter('pending')).toBe('verify')
  })
})
