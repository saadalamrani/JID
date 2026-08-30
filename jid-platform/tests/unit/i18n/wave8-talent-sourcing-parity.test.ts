import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

function load(locale: 'ar' | 'en') {
  return JSON.parse(readFileSync(join(process.cwd(), 'messages', `${locale}.json`), 'utf8')) as {
    company: { talentSourcing: Record<string, unknown> }
    profile: { privacy: Record<string, unknown>; sourcingInvitations: Record<string, unknown> }
  }
}

function keys(value: Record<string, unknown>): string[] {
  return Object.keys(value).sort()
}

describe('Wave 8 AR/EN parity', () => {
  it('keeps talent sourcing and discoverability keys in parity', () => {
    const en = load('en')
    const ar = load('ar')
    expect(keys(en.company.talentSourcing)).toEqual(keys(ar.company.talentSourcing))
    expect(keys(en.profile.privacy)).toEqual(keys(ar.profile.privacy))
    expect(keys(en.profile.sourcingInvitations)).toEqual(keys(ar.profile.sourcingInvitations))
    expect(JSON.stringify(en.company.talentSourcing)).not.toMatch(/92%|top talent|best candidate/i)
    expect(JSON.stringify(ar.company.talentSourcing)).not.toMatch(/أفضل مرشح|92%/)
  })
})
