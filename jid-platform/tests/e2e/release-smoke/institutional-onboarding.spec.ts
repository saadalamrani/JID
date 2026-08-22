import { expect, test } from '@playwright/test'
import {
  INSTITUTIONAL_CHAPTER_LABELS_AR,
  assertNoForbiddenClaimCopy,
  assertPageAlive,
  gotoStable,
  selectors,
  waitForDocumentDirection,
} from './helpers'

/**
 * Institutional onboarding durable contracts.
 * Assert architecture invariants without freezing unfinished owned-shell polish.
 */
test.describe('release-smoke · institutional onboarding', () => {
  test('@P1 entity-type chooser loads for business and university paths', async ({
    page,
    baseURL,
  }, testInfo) => {
    testInfo.annotations.push({ type: 'severity', description: 'P1' })
    await gotoStable(page, '/signup/entity-type', baseURL)
    await assertPageAlive(page, 'entity-type')
    await assertNoForbiddenClaimCopy(page)

    await expect(page.getByRole('link', { name: /منشأة|Business|Company|Employer/i }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /جامعة|University/i }).first()).toBeVisible()
  })

  for (const entity of [
    { type: 'company', path: '/signup/company' },
    { type: 'university', path: '/signup/university' },
  ] as const) {
    test(`@P1 ${entity.type} journey shows identify → verify → prepare chapters`, async ({
      page,
      baseURL,
    }, testInfo) => {
      testInfo.annotations.push({ type: 'severity', description: 'P1' })
      await gotoStable(page, entity.path, baseURL)
      await waitForDocumentDirection(page)
      await assertPageAlive(page, entity.path)
      await assertNoForbiddenClaimCopy(page)

      const chapters = page.locator(selectors.institutionalChapters)
      await expect(chapters).toBeVisible({ timeout: 20_000 })

      await expect(chapters.locator('[data-chapter="identify"]')).toBeVisible()
      await expect(chapters.locator('[data-chapter="verify"]')).toBeVisible()
      await expect(chapters.locator('[data-chapter="prepare"]')).toBeVisible()

      // Arabic product copy for the three chapters when on /ar project.
      if (testInfo.project.name.includes('ar') || baseURL?.includes('/ar')) {
        await expect(chapters.getByText(INSTITUTIONAL_CHAPTER_LABELS_AR.identify)).toBeVisible()
        await expect(chapters.getByText(INSTITUTIONAL_CHAPTER_LABELS_AR.verify)).toBeVisible()
        await expect(chapters.getByText(INSTITUTIONAL_CHAPTER_LABELS_AR.prepare)).toBeVisible()
      }

      const body = await page.locator('body').innerText()
      // Directory selection must not promise automatic owned Profile creation.
      expect(body).not.toMatch(/automatic(ally)? create(s|d)? (your )?profile/i)
      expect(body).not.toMatch(/سيتم إنشاء ملفك تلقائياً/)
      expect(body).not.toMatch(/ملكية الدليل|directory ownership/i)
    })
  }

  test('@P1 prepare chapter is not claimed as Directory ownership', async ({ page, baseURL }, testInfo) => {
    testInfo.annotations.push({ type: 'severity', description: 'P1' })
    await gotoStable(page, '/signup/company', baseURL)
    const body = (await page.locator('body').innerText()).replace(/\s+/g, ' ')

    // Verification approval must not be represented as Directory ownership.
    expect(body).not.toMatch(/verification (equals|=) ownership/i)
    expect(body).not.toMatch(/الموافقة تعني ملكية الدليل/)
    expect(body).not.toMatch(/Claim Existing Profile/i)
    expect(body).not.toMatch(/مطالبة الملف/)
  })
})
