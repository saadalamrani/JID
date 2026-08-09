import { expect, test } from '@playwright/test'
import path from 'node:path'
import { mkdirSync } from 'node:fs'

/**
 * Wave 1 — representative public routes must render exactly one platform top <header>
 * (SmartHeader via PublicNav). Page-local section <header> elements may still exist.
 * We assert sticky platform chrome count via the SmartHeader sticky landmark.
 */
test.describe('Wave 1 — platform header count', () => {
  const routes = ['/', '/opportunities', '/catalog', '/plus', '/about'] as const

  for (const route of routes) {
    test(`${route} has exactly one sticky platform header`, async ({ page }) => {
      await page.goto(route)
      await page.waitForFunction(() => document.querySelectorAll('header').length >= 1)

      const stickyPlatformHeaders = page.locator('header.sticky.top-0')
      await expect(stickyPlatformHeaders).toHaveCount(1)

      // Guard: no second sticky platform chrome stacked at top.
      const stickyCount = await page.locator('header.sticky').count()
      expect(stickyCount).toBe(1)
    })
  }
})

test.describe('Wave 1 — visual evidence captures', () => {
  test('homepage AR/EN light desktop + mobile screenshots', async ({ page }, testInfo) => {
    const outDir = path.join(
      process.cwd(),
      'docs/command-center/reports/ui-evidence/experience-integrity-wave1',
    )
    mkdirSync(outDir, { recursive: true })

    const locale = testInfo.project.name === 'locale-en' ? 'en' : 'ar'
    const shots: Array<{ name: string; width: number; height: number; dark?: boolean }> = [
      { name: 'desktop', width: 1280, height: 800 },
      { name: 'mobile', width: 375, height: 812 },
    ]

    for (const shot of shots) {
      await page.setViewportSize({ width: shot.width, height: shot.height })
      await page.emulateMedia({ colorScheme: 'light' })
      await page.goto('/')
      await page.waitForSelector('header.sticky.top-0')
      await page.screenshot({
        path: path.join(outDir, `homepage__${locale}__light__${shot.name}.png`),
        fullPage: false,
      })

      await page.emulateMedia({ colorScheme: 'dark' })
      await page.evaluate(() => document.documentElement.classList.add('dark'))
      await page.screenshot({
        path: path.join(outDir, `homepage__${locale}__dark__${shot.name}.png`),
        fullPage: false,
      })
      await page.evaluate(() => document.documentElement.classList.remove('dark'))
    }
  })

  test('university + individual route evidence', async ({ page }, testInfo) => {
    const outDir = path.join(
      process.cwd(),
      'docs/command-center/reports/ui-evidence/experience-integrity-wave1',
    )
    mkdirSync(outDir, { recursive: true })
    const locale = testInfo.project.name === 'locale-en' ? 'en' : 'ar'

    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/university/dashboard')
    await page.waitForTimeout(600)
    await page.screenshot({
      path: path.join(outDir, `university-shell__${locale}__desktop.png`),
      fullPage: false,
    })

    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/university/dashboard')
    await page.waitForTimeout(600)
    await page.screenshot({
      path: path.join(outDir, `university-shell__${locale}__mobile.png`),
      fullPage: false,
    })

    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/profile')
    await page.waitForTimeout(600)
    await page.screenshot({
      path: path.join(outDir, `individual-profile__${locale}__desktop.png`),
      fullPage: false,
    })
  })
})
