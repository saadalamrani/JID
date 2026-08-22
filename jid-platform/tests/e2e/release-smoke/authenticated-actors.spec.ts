import { expect, test } from '@playwright/test'
import {
  RELEASE_SMOKE_AUTH_ACTORS,
  assertPageAlive,
  authSmokeEnabled,
  gotoStable,
  loginWithSeedAccount,
  waitForDocumentDirection,
} from './helpers'

/**
 * Authenticated actor smoke — only when deterministic nonprod seed fixtures are available.
 * Does NOT encode unfinished Organization Shell behavior as permanent contracts.
 */
test.describe('release-smoke · authenticated actors', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeEach(() => {
    test.skip(!authSmokeEnabled(), 'RELEASE_SMOKE_AUTH=0 — authenticated smoke skipped')
  })

  for (const actor of RELEASE_SMOKE_AUTH_ACTORS) {
    test(`@P1 ${actor.id} critical route smoke`, async ({ page, baseURL }, testInfo) => {
      testInfo.annotations.push({ type: 'severity', description: 'P1' })
      test.setTimeout(120_000)

      await loginWithSeedAccount(page, actor.email, '/login', baseURL)
      const afterLogin = page.url()
      expect(afterLogin, `${actor.id} unexpected post-login surface`).toMatch(actor.expectPath)

      await gotoStable(page, actor.allowPath, baseURL)
      await page.waitForTimeout(800)
      await assertPageAlive(page, `${actor.id}:${actor.allowPath}`)

      // Stable availability only — avoid locking unfinished shell chrome.
      const pathname = new URL(page.url()).pathname
      expect(
        pathname.includes(actor.allowPath) || actor.expectPath.test(pathname),
        `${actor.id} bounced away from stable critical route: ${page.url()}`,
      ).toBeTruthy()

      const dir = await waitForDocumentDirection(page)
      expect(['rtl', 'ltr']).toContain(dir)
    })
  }
})
