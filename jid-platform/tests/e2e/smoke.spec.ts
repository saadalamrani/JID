import { expect, test } from '@playwright/test'

test.describe('homepage smoke', () => {
  test('renders brand, primary CTAs, and correct document direction', async ({
    page,
    baseURL,
  }) => {
    await page.goto('/')

    await page.waitForFunction(() => {
      const dir = document.documentElement.getAttribute('dir')
      return dir === 'rtl' || dir === 'ltr'
    })

    const dir = await page.locator('html').getAttribute('dir')
    const isArabic = baseURL?.endsWith('/ar') ?? false

    if (isArabic) {
      expect(dir).toBe('rtl')
    } else {
      expect(dir).toBe('ltr')
    }

    // Brand signal + durable demo entry points (copy can evolve under Claude content ownership).
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('body')).toContainText(/جِد|JID/)
    await expect(
      page.locator('a[href*="/opportunities"], a[href*="/signup"]').first(),
    ).toBeVisible()
  })
})
