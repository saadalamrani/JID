import { describe, expect, it } from 'vitest'
import ar from '../../../messages/ar.json'
import en from '../../../messages/en.json'

/**
 * Spec 04-C — duplicate top-level `company` keys previously shadowed nav/shell
 * (JSON last-key-wins), breaking StandardCompanyLayout.
 */
describe('company message namespace integrity (Spec 04-C)', () => {
  it('keeps company.nav and monetization keys together in EN and AR', () => {
    for (const [locale, messages] of [
      ['en', en],
      ['ar', ar],
    ] as const) {
      expect(messages.company?.nav?.dashboard, locale).toBeTruthy()
      expect(messages.company?.shell?.errorTitle, locale).toBeTruthy()
      expect(messages.company?.boost?.teaserTitle, locale).toBeTruthy()
      expect(messages.company?.ssis?.pageTitle, locale).toBeTruthy()
      expect(messages.company?.profileCreation?.title, locale).toBeTruthy()
    }
  })
})
