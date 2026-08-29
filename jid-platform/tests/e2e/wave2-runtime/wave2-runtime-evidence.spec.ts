import { expect, test, type ConsoleMessage, type Page } from '@playwright/test'

import { loginWithSeedAccount } from '../release-smoke/helpers/auth'
import {
  assertPageAlive,
  gotoStable,
  waitForDocumentDirection,
} from '../release-smoke/helpers/routes'

const SEED_EMAIL = 'individual-complete@jidseed.test'

function collectRuntimeErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (error) => {
    errors.push(`pageerror: ${error.message}`)
  })
  page.on('console', (message: ConsoleMessage) => {
    if (message.type() === 'error') {
      const text = message.text()
      // 409 is an intentional fail-closed conflict on snapshot/revision paths.
      if (
        /favicon|Download the React DevTools|hydrat|status of 409 \(Conflict\)/i.test(text)
      ) {
        return
      }
      errors.push(`console: ${text}`)
    }
  })
  return errors
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow, 'horizontal overflow').toBeLessThanOrEqual(1)
}

test.describe('Wave 2 authenticated runtime evidence', () => {
  test.describe.configure({ mode: 'serial' })

  test('AR desktop Career Record, CV Projection, privacy, snapshot fail-closed', async ({
    page,
    request,
    baseURL,
  }) => {
    const marker = `WAVE2-RUNTIME-${Date.now()}`
    const errors = collectRuntimeErrors(page)
    await page.setViewportSize({ width: 1280, height: 800 })

    const snapshotPath = `${baseURL}/api/me/applications/00000000-0000-4000-8000-000000000001/cv-snapshot`
    const snapshotBody = {
      cv_id: '00000000-0000-4000-8000-000000000002',
      authorization_id: '00000000-0000-4000-8000-000000000003',
    }
    const anon = await request.post(snapshotPath, { data: snapshotBody })
    expect([401, 403, 404]).toContain(anon.status())

    await loginWithSeedAccount(page, SEED_EMAIL, '/ar/login', baseURL)
    await gotoStable(page, '/ar/profile/career-record', baseURL)
    await expect(page.getByRole('heading', { name: 'السجل المهني' })).toBeVisible({
      timeout: 120_000,
    })
    expect(await waitForDocumentDirection(page)).toBe('rtl')
    await expect(page.locator('html')).toHaveAttribute('lang', /ar/)
    await expect(page.getByText('خاص افتراضياً', { exact: false }).first()).toBeVisible()
    await expect(page.getByText('غير مشارك مع جهة أو مستلم').first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'إضافة معلومة' })).toBeVisible()
    await assertPageAlive(page, 'ar-career-record')

    await page.getByRole('button', { name: 'إضافة معلومة' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByLabel('جهة العمل').fill('جهة تجربة جِد')
    await page.getByLabel('المسمّى').fill(`مطور تجربة ${marker}`)
    await page.getByRole('button', { name: 'حفظ في السجل' }).click()
    await expect(page.getByText(`مطور تجربة ${marker}`)).toBeVisible({ timeout: 45_000 })

    const createdItem = page.locator('article').filter({ hasText: marker }).first()
    await createdItem.getByRole('button', { name: 'تصحيح' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('dialog').getByLabel('المسمّى').fill(`مطور تجربة ${marker} محدّثة`)
    await page.getByRole('button', { name: 'حفظ التصحيح' }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.getByText(`مطور تجربة ${marker} محدّثة`)).toBeVisible({
      timeout: 45_000,
    })

    await page.getByRole('link', { name: 'فتح السيرة الذاتية' }).click()
    await expect(page.getByRole('heading', { name: 'السيرة الذاتية' })).toBeVisible({
      timeout: 120_000,
    })
    await expect(page.getByText('خاص', { exact: false }).first()).toBeVisible()
    await expect(page.getByLabel('عنوان السيرة')).toBeVisible()
    const cvTitle = page.getByLabel('عنوان السيرة')
    await cvTitle.fill(`سيرة ${marker}`)
    await cvTitle.blur()
    await expect(
      page
        .getByRole('button', { name: /أعلى|أسفل|إضافة إلى هذه السيرة|إزالة من هذه السيرة/ })
        .first(),
    ).toBeVisible()

    const authedFailClosed = await page.request.post(snapshotPath, { data: snapshotBody })
    expect([401, 403, 404, 409, 422]).toContain(authedFailClosed.status())
    expect(authedFailClosed.status()).not.toBe(201)

    expect(errors, errors.join('\n')).toEqual([])
  })

  test('EN LTR Career Record and CV Projection', async ({ page, baseURL }) => {
    const errors = collectRuntimeErrors(page)
    await page.setViewportSize({ width: 1280, height: 800 })
    await loginWithSeedAccount(page, SEED_EMAIL, '/en/login', baseURL)
    await gotoStable(page, '/en/profile/career-record', baseURL)
    await expect(page.getByRole('heading', { name: 'Career Record' })).toBeVisible({
      timeout: 120_000,
    })
    expect(await waitForDocumentDirection(page)).toBe('ltr')
    await expect(page.locator('html')).toHaveAttribute('lang', /en/)
    await expect(page.getByText('Private by default', { exact: false }).first()).toBeVisible()
    await page.getByRole('link', { name: 'Open CV' }).click()
    await expect(page.getByRole('heading', { name: 'CV' })).toBeVisible({ timeout: 120_000 })
    await expect(
      page.getByText('does not give an employer', { exact: false }).first(),
    ).toBeVisible()
    expect(errors, errors.join('\n')).toEqual([])
  })

  test('AR mobile 375 Career Record keyboard and overflow', async ({ page, baseURL }) => {
    const errors = collectRuntimeErrors(page)
    await page.setViewportSize({ width: 375, height: 812 })
    await loginWithSeedAccount(page, SEED_EMAIL, '/ar/login', baseURL)
    await gotoStable(page, '/ar/profile/career-record', baseURL)
    await expect(page.getByRole('heading', { name: 'السجل المهني' })).toBeVisible({
      timeout: 120_000,
    })
    expect(await waitForDocumentDirection(page)).toBe('rtl')
    await expectNoHorizontalOverflow(page)
    await page.getByRole('button', { name: 'إضافة معلومة' }).focus()
    await expect(page.getByRole('button', { name: 'إضافة معلومة' })).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('button', { name: 'إلغاء' }).click()
    await gotoStable(page, '/ar/profile/cv-projection', baseURL)
    await expect(page.getByRole('heading', { name: 'السيرة الذاتية' })).toBeVisible({
      timeout: 120_000,
    })
    await expectNoHorizontalOverflow(page)
    expect(errors, errors.join('\n')).toEqual([])
  })
})
