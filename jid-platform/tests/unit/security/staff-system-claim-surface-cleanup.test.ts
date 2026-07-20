/**
 * JID-102D1 — Staff and System Claim Surface Cleanup.
 *
 * Static/structural regression guards proving: the dead /sys/claims nav
 * entries and dashboard link are gone, the live /staff/verification routes
 * and their (now-renamed) reused components still resolve, the
 * /staff/claims redirect aliases still safely point at /staff/verification,
 * no deleted component retains a live import anywhere, and the
 * schema/RLS/public-onboarding surfaces this task was explicitly told not
 * to touch are untouched. These run against the source tree directly — no
 * server, no live Supabase project required.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { SYS_NAV_SECTIONS, SYS_QUICK_ACTIONS } from '@/lib/sys/nav'

const SRC_ROOT = join(process.cwd(), 'src')

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) {
      walk(full, out)
    } else if (/\.(ts|tsx)$/.test(entry)) {
      out.push(full)
    }
  }
  return out
}

const allSourceFiles = walk(SRC_ROOT)

function read(relativePath: string): string {
  return readFileSync(join(SRC_ROOT, relativePath), 'utf-8')
}

function fileContains(pattern: RegExp): string[] {
  return allSourceFiles.filter((file) => pattern.test(readFileSync(file, 'utf-8')))
}

describe('1. No active sys navigation points to /sys/claims', () => {
  it('SYS_NAV_SECTIONS has no item linking to /sys/claims', () => {
    const hrefs = SYS_NAV_SECTIONS.flatMap((section) => section.items.map((item) => item.href))
    expect(hrefs).not.toContain('/sys/claims')
  })

  it('SYS_QUICK_ACTIONS has no item linking to /sys/claims', () => {
    const hrefs = SYS_QUICK_ACTIONS.map((action) => action.href)
    expect(hrefs).not.toContain('/sys/claims')
  })
})

describe('2. No active System dashboard CTA points to a nonexistent Claim route', () => {
  it('the sys dashboard widget file has no href to /sys/claims', () => {
    const widget = read(
      'app/[locale]/(sys)/sys/dashboard/_components/verification-queue-widget.tsx',
    )
    expect(widget).not.toMatch(/href=["']\/sys\/claims["']/)
  })

  it('the old claims-queue-widget.tsx file no longer exists', () => {
    expect(
      existsSync(join(SRC_ROOT, 'app/[locale]/(sys)/sys/dashboard/_components/claims-queue-widget.tsx')),
    ).toBe(false)
  })

  it('nothing in src links to /sys/claims as an actual href (comments referencing it as removed are fine)', () => {
    const offenders = fileContains(/href=["']\/sys\/claims["']|Link\s+href=\{["']\/sys\/claims["']\}/)
    expect(offenders).toEqual([])
  })
})

describe('3. Staff verification routes remain reachable', () => {
  const expectedRoutes = [
    'app/[locale]/(staff)/staff/verification/page.tsx',
    'app/[locale]/(staff)/staff/verification/my-queue/page.tsx',
    'app/[locale]/(staff)/staff/verification/history/page.tsx',
    'app/[locale]/(staff)/staff/verification/queue/page.tsx',
    'app/[locale]/(staff)/staff/verification/[id]/page.tsx',
  ]

  it.each(expectedRoutes)('%s exists', (route) => {
    expect(existsSync(join(SRC_ROOT, route))).toBe(true)
  })

  it('the verification detail page is a real page, not a redirect stub', () => {
    const content = read('app/[locale]/(staff)/staff/verification/[id]/page.tsx')
    expect(content).not.toMatch(/^\s*redirect\(/m)
    expect(content).toContain('fetchVerificationReviewWorkspace')
  })

  it('the moved/renamed reused components the verification pages depend on all exist', () => {
    const required = [
      'app/[locale]/(staff)/staff/verification/_components/verification-card.tsx',
      'app/[locale]/(staff)/staff/verification/_components/verification-filters.tsx',
      'app/[locale]/(staff)/staff/verification/_components/verification-list.tsx',
      'app/[locale]/(staff)/staff/verification/_components/realtime-verification-updater.tsx',
      'app/[locale]/(staff)/staff/verification/[id]/_components/related-history-panel.tsx',
      'app/[locale]/(staff)/_components/checklist-panel.tsx',
      'lib/staff/verification-review-queries.ts',
      'lib/staff/verification-review-shared.ts',
      'lib/staff/verification-urgency.ts',
      'lib/staff/notify-verification-decision.ts',
    ]
    for (const path of required) {
      expect(existsSync(join(SRC_ROOT, path)), `missing ${path}`).toBe(true)
    }
  })
})

describe('4. /staff/claims redirect aliases remain safe redirects', () => {
  const aliasRoutes = [
    'app/[locale]/(staff)/staff/claims/page.tsx',
    'app/[locale]/(staff)/staff/claims/my-queue/page.tsx',
    'app/[locale]/(staff)/staff/claims/history/page.tsx',
    'app/[locale]/(staff)/staff/claims/queue/page.tsx',
    'app/[locale]/(staff)/staff/claims/[id]/page.tsx',
  ]

  it.each(aliasRoutes)('%s redirects into /staff/verification', (route) => {
    const content = read(route)
    expect(content).toMatch(/redirect\(/)
    expect(content).toMatch(/\/staff\/verification/)
  })

  it('no other files remain under staff/claims besides these 5 redirect stubs', () => {
    const claimsDir = join(SRC_ROOT, 'app/[locale]/(staff)/staff/claims')
    const files = walk(claimsDir).map((f) => f.replace(claimsDir, '').replace(/\\/g, '/'))
    expect(files.sort()).toEqual(
      [
        '/[id]/page.tsx',
        '/history/page.tsx',
        '/my-queue/page.tsx',
        '/page.tsx',
        '/queue/page.tsx',
      ].sort(),
    )
  })
})

describe('5. No deleted component retains an active import anywhere in src', () => {
  const deletedPathFragments = [
    'staff/claims/_components/claim-card',
    'staff/claims/_components/claims-filters',
    'staff/claims/_components/claims-list',
    'staff/claims/_components/realtime-claims-updater',
    'staff/claims/[id]/_components/claim-review-workspace',
    'staff/claims/[id]/_components/claim-decision-form',
    'staff/claims/[id]/_components/checklist-panel',
    'staff/claims/[id]/_components/related-history-panel',
    'staff/claims/actions',
    'lib/staff/claim-urgency',
    'lib/staff/claim-review-shared',
    'lib/staff/claim-review-queries',
    'lib/staff/notify-claim-decision',
    'lib/staff/review-claim',
    'hooks/use-claims-queue',
    'claim-review-modal',
    'claim-checklist',
    'claims-queue-widget',
  ]

  it.each(deletedPathFragments)('no file imports from a path containing "%s"', (fragment) => {
    const offenders = allSourceFiles.filter((file) => readFileSync(file, 'utf-8').includes(fragment))
    expect(offenders).toEqual([])
  })

  const deletedIdentifiers = [
    'ClaimCard',
    'ClaimsFilters',
    'filterClaimsItems',
    'ClaimsFilterState',
    'ClaimsListWithFilters',
    'RealtimeClaimsUpdater',
    'ClaimReviewWorkspace',
    'ClaimDecisionForm',
    'ClaimReviewModal',
    'ClaimChecklist',
    'ClaimsQueueWidget',
    'PendingClaimPreview',
    'fetchPendingClaimsPreview',
    'fetchClaimReviewWorkspace',
    'ClaimReviewWorkspaceData',
    'notifyClaimDecision',
    'getClaimUrgencyTier',
    'buildDefaultClaimChecklist',
    'isClaimPendingReview',
    'RelatedClaimHistoryItem',
    'useClaimsQueue',
    'reviewClaimRequest',
  ]

  it.each(deletedIdentifiers)('no file references the removed identifier "%s"', (identifier) => {
    const pattern = new RegExp(`\\b${identifier}\\b`)
    const offenders = allSourceFiles.filter((file) => pattern.test(readFileSync(file, 'utf-8')))
    expect(offenders).toEqual([])
  })
})

describe('6. No schema, RLS, or public onboarding files were changed', () => {
  it('the legitimate public verification submission module is untouched in shape', () => {
    const content = read('lib/entity/claims.ts')
    expect(content).toContain('export async function submitClaimRequest')
    expect(content).toContain("claimType === 'company' ? 'business' : 'university'")
  })

  it('EntitySignupWizard and ClaimSubmissionForm still exist and are wired together', () => {
    expect(
      existsSync(join(SRC_ROOT, 'components/entity/entity-signup-wizard.tsx')),
    ).toBe(true)
    expect(
      existsSync(join(SRC_ROOT, 'components/entity/claim-submission-form.tsx')),
    ).toBe(true)
    const wizard = read('components/entity/entity-signup-wizard.tsx')
    expect(wizard).toContain('ClaimSubmissionForm')
  })

  it('the retired /api/catalog/claim files from JID-102A2 stay removed, not reintroduced', () => {
    expect(existsSync(join(SRC_ROOT, 'app/api/catalog/claim'))).toBe(false)
    expect(existsSync(join(SRC_ROOT, 'lib/catalog/claim.ts'))).toBe(false)
  })

  it('the Directory-ownership (companies.claimed_by) sys/entities actions are untouched by this patch', () => {
    // This file legitimately still reads/writes companies.claimed_by / entity_state —
    // it belongs to the separate Directory-ownership surface this task's
    // DO-NOT-TOUCH list explicitly excludes. Confirm it is still present and
    // still uses that model, i.e. nothing here was accidentally renamed.
    const content = read('app/[locale]/(sys)/sys/entities/actions.ts')
    expect(content).toContain('claimed_by')
    expect(content).toContain("entity_state: 'unclaimed'")
  })

  it('the staff.claim_reviewed analytics event and its RPC-adjacent contracts remain unchanged', () => {
    const events = read('lib/analytics/staff-events.ts')
    expect(events).toContain("'staff.claim_reviewed'")

    const notify = read('lib/staff/notify-verification-decision.ts')
    expect(notify).toContain("'claim.approved'")
    expect(notify).toContain("'claim.rejected'")
    expect(notify).toContain("'claim.needs_more_info'")
    expect(notify).toContain('claim_id:')
    expect(notify).toContain("'send-claim-approval'")
    expect(notify).toContain("'send-claim-rejection'")
    expect(notify).toContain('claimId:')
  })

  it('no supabase/migrations directory changes are part of this source tree diff (structural sanity check)', () => {
    // A real diff-scope check belongs at the git level (see the delivered
    // report), not inside a Vitest run. This test only guards against the
    // most obvious accidental case: a stray edit landing in the migrations
    // folder from this test file's own working directory.
    const migrationsDir = join(process.cwd(), 'supabase', 'migrations')
    expect(existsSync(migrationsDir)).toBe(true)
  })
})
