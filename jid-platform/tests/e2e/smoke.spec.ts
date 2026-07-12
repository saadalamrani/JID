import { expect, test } from '@playwright/test'

test.describe('homepage smoke', () => {
  test('renders brand tagline and correct document direction', async ({ page, baseURL }) => {
    await page.goto('/')

    await page.waitForFunction(() => {
      const dir = document.documentElement.getAttribute('dir')
      return dir === 'rtl' || dir === 'ltr'
    })

    const dir = await page.locator('html').getAttribute('dir')
    const isArabic = baseURL?.endsWith('/ar') ?? false

    if (isArabic) {
      expect(dir).toBe('rtl')
      await expect(page.getByText(/جِد تجمع البحث عن العمل/)).toBeVisible()
    } else {
      expect(dir).toBe('ltr')
      await expect(page.getByText(/JID brings job search/i)).toBeVisible()
    }
  })
})
