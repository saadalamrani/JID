import { expect, test } from '@playwright/test'
import {
  RELEASE_SMOKE_AUTH_ACTORS,
  assertPageAlive,
  gotoStable,
  loginWithSeedAccount,
} from './helpers'

test.describe('interview final authenticated runtime @ jid-dev', () => {
  test.describe.configure({ timeout: 120_000 })

  for (const actor of RELEASE_SMOKE_AUTH_ACTORS) {
    test(`@P1 ${actor.id} login + critical route`, async ({ page, baseURL }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      await loginWithSeedAccount(page, actor.email, '/login', baseURL)
      expect(page.url()).toMatch(actor.expectPath)

      await gotoStable(page, actor.allowPath, baseURL)
      await assertPageAlive(page, `${actor.id}:${actor.allowPath}`)
      expect(page.url()).toMatch(new RegExp(actor.allowPath.replace(/\//g, '\\/')))

      const body = await page.locator('body').innerText()
      expect(body).not.toMatch(/ابحث لي|Abhathli/i)

      if (actor.id === 'business' || actor.id === 'university') {
        expect(body).not.toMatch(/\bالرادار\b/)
        expect(body).not.toMatch(/منشئ السيرة/)
      }
      if (actor.id === 'university') {
        expect(body).not.toMatch(/92%|1,240|نسبة الإكمال/)
      }
    })
  }

  test('@P1 mobile 390 Individual login usable', async ({ page, baseURL }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await loginWithSeedAccount(page, 'individual-complete@jidseed.test', '/login', baseURL)
    expect(page.url()).toMatch(/\/(me|profile|radar|dashboard|mentor)/)
  })
})
