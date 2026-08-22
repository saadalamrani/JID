import { expect, type Locator, type Page } from '@playwright/test'
import { FORBIDDEN_CLAIM_COPY } from './routes'

export const selectors = {
  stickyPlatformHeader: 'header.sticky.top-0',
  mainLandmark: 'main, [role="main"]',
  navLandmark: 'nav, [role="navigation"]',
  institutionalChapters: '[data-testid="institutional-journey-chapters"]',
  emailInput: 'input#email',
  passwordInput: 'input#password',
  signupFullName: 'input#full_name',
} as const

export async function assertEssentialLandmarks(page: Page) {
  await expect(page.locator(selectors.stickyPlatformHeader).first()).toBeVisible({
    timeout: 20_000,
  })
  const mainCount = await page.locator(selectors.mainLandmark).count()
  const navCount = await page.locator(selectors.navLandmark).count()
  expect(mainCount + navCount, 'essential accessibility landmarks missing').toBeGreaterThan(0)
}

export async function assertNoForbiddenClaimCopy(scope: Locator | Page) {
  const text = (await scope.locator('body').innerText()).replace(/\s+/g, ' ')
  for (const pattern of FORBIDDEN_CLAIM_COPY) {
    expect(text, `forbidden claim terminology matched ${pattern}`).not.toMatch(pattern)
  }
}

export async function collectPrimaryNavHrefs(page: Page): Promise<string[]> {
  const hrefs = await page.locator('header.sticky.top-0 a[href]').evaluateAll((anchors) =>
    anchors
      .map((a) => (a as HTMLAnchorElement).getAttribute('href') || '')
      .filter(Boolean)
      .filter((href) => !href.startsWith('#') && !href.startsWith('mailto:')),
  )
  return Array.from(new Set(hrefs))
}

export function isKnownDeadLinkCandidate(href: string): boolean {
  // Keep intentionally narrow — only obvious broken placeholders.
  return href === '/todo' || href === '/coming-soon' || href.includes('undefined')
}
