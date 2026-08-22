import { expect, test } from '@playwright/test'
import {
  PUBLIC_SMOKE_ROUTES,
  VIEWPORTS,
  assertEssentialLandmarks,
  assertNoFatalRuntimeErrors,
  assertPageAlive,
  collectPrimaryNavHrefs,
  createRuntimeErrorCollector,
  gotoStable,
  isKnownDeadLinkCandidate,
  selectors,
  waitForDocumentDirection,
} from './helpers'

/**
 * Public / guest durable release smoke.
 * Annotations mark promotion severity: only @P0/@P1 block by default.
 */
test.describe('release-smoke · public guest', () => {
  for (const route of PUBLIC_SMOKE_ROUTES) {
    test(`@P1 ${route.id} loads with direction + landmarks`, async ({ page, baseURL }, testInfo) => {
      testInfo.annotations.push({ type: 'severity', description: 'P1' })
      const locale = testInfo.project.name.includes('en') ? 'en' : 'ar'
      const collector = createRuntimeErrorCollector(page)
      collector.attach()

      await page.setViewportSize(VIEWPORTS.desktop)
      await gotoStable(page, route.path, baseURL)
      const dir = await waitForDocumentDirection(page)
      await assertPageAlive(page, `${locale}:${route.id}`)

      if (locale === 'ar') {
        expect(dir, 'Arabic route must render RTL').toBe('rtl')
      } else {
        expect(dir, 'English route must render LTR').toBe('ltr')
      }

      // Auth shells may omit sticky public header; still require page body + form/entry.
      if (route.id === 'login' || route.id === 'signup' || route.id === 'entity-type') {
        await expect(page.locator('form, a[href*="signup"], a[href*="login"], h1').first()).toBeVisible()
      } else {
        await assertEssentialLandmarks(page)
      }

      assertNoFatalRuntimeErrors(collector, `${locale}:${route.id}`)
      collector.detach()
    })
  }

  test('@P1 sign-in and sign-up entry controls work', async ({ page, baseURL }, testInfo) => {
    testInfo.annotations.push({ type: 'severity', description: 'P1' })
    await gotoStable(page, '/login', baseURL)
    await expect(page.locator(selectors.emailInput)).toBeVisible()
    await expect(page.locator(selectors.passwordInput)).toBeVisible()
    await expect(page.locator('form button[type="submit"]')).toBeVisible()

    await gotoStable(page, '/signup', baseURL)
    await expect(page.locator(selectors.signupFullName)).toBeVisible()
    await expect(page.locator(selectors.emailInput)).toBeVisible()
    await expect(page.locator('form button[type="submit"]')).toBeVisible()
  })

  test('@P1 locale navigation does not break critical surfaces', async ({ page, baseURL }, testInfo) => {
    testInfo.annotations.push({ type: 'severity', description: 'P1' })
    const origin = baseURL?.replace(/\/(ar|en)\/?$/, '') ?? ''

    await gotoStable(page, `${origin}/ar/catalog`)
    expect(await waitForDocumentDirection(page)).toBe('rtl')
    await assertPageAlive(page, 'ar/catalog')

    await gotoStable(page, `${origin}/en/catalog`)
    expect(await waitForDocumentDirection(page)).toBe('ltr')
    await assertPageAlive(page, 'en/catalog')

    await gotoStable(page, `${origin}/ar/opportunities`)
    expect(await waitForDocumentDirection(page)).toBe('rtl')
    await assertPageAlive(page, 'ar/opportunities')

    await gotoStable(page, `${origin}/en/opportunities`)
    expect(await waitForDocumentDirection(page)).toBe('ltr')
    await assertPageAlive(page, 'en/opportunities')
  })

  test('@P1 primary nav has no known dead links in tested scope', async ({ page, baseURL }, testInfo) => {
    testInfo.annotations.push({ type: 'severity', description: 'P1' })
    await gotoStable(page, '/', baseURL)
    await page.waitForSelector(selectors.stickyPlatformHeader, { timeout: 20_000 })
    const hrefs = await collectPrimaryNavHrefs(page)
    const dead = hrefs.filter(isKnownDeadLinkCandidate)
    expect(dead, `known dead links in primary nav: ${dead.join(', ')}`).toEqual([])
    expect(hrefs.length, 'primary nav should expose at least one link').toBeGreaterThan(0)

    // Guest chrome must not advertise deferred Abhathli or paid visibility.
    const joined = hrefs.join(' ')
    expect(joined).not.toMatch(/abhathli|boost|discovery/i)
  })

  test('@P1 mobile viewport does not create catastrophic navigation failure', async ({
    page,
    baseURL,
  }, testInfo) => {
    testInfo.annotations.push({ type: 'severity', description: 'P1' })
    const collector = createRuntimeErrorCollector(page)
    collector.attach()
    await page.setViewportSize(VIEWPORTS.mobile)
    await gotoStable(page, '/', baseURL)
    await assertPageAlive(page, 'mobile-home')
    await expect(page.locator(selectors.stickyPlatformHeader).first()).toBeVisible()

    // Mobile menu affordance or compressed nav must remain usable.
    const menuToggle = page.getByRole('button', { name: /menu|قائمة|التنقل|open/i })
    if (await menuToggle.count()) {
      await menuToggle.first().click()
      const mobileNav = page.getByRole('dialog').filter({ has: page.getByRole('navigation') })
      await expect(mobileNav).toBeVisible({ timeout: 10_000 })
      await expect(
        mobileNav.getByRole('link').filter({ hasNotText: /^(AR|EN)$/ }).first(),
      ).toBeVisible()
    } else {
      await expect(page.locator('header a[href]').locator('visible=true').first()).toBeVisible()
    }

    assertNoFatalRuntimeErrors(collector, 'mobile-home')
    collector.detach()
  })
})
