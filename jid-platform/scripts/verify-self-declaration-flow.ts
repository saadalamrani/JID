/**
 * Static checks for self-declaration flow (no browser / DB).
 * Usage: pnpm tsx scripts/verify-self-declaration-flow.ts
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { SELF_DECLARATION_FALLBACK_MS } from '../src/lib/hooks/use-self-declaration'

const ROOT = process.cwd()

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf8')
}

const checks: Array<{ id: string; pass: boolean; detail: string }> = []

function check(id: string, pass: boolean, detail: string) {
  checks.push({ id, pass, detail })
}

const hook = read('src/lib/hooks/use-self-declaration.ts')
const button = read('src/app/[locale]/(public)/opportunities/_components/job-action-button.tsx')
const modal = read('src/app/[locale]/(public)/opportunities/_components/interceptor-modal.tsx')
const intentRoute = read('src/app/api/jobs/[id]/intent/route.ts')
const declareRoute = read('src/app/api/jobs/[id]/declare/route.ts')
const server = read('src/lib/jobs/self-declaration-server.ts')

check('fallback-10s', SELF_DECLARATION_FALLBACK_MS === 10_000, 'Fallback delay is 10s')
check('visibility-listener', hook.includes("document.addEventListener('visibilitychange'"), 'Tab Visibility listener')
check('visibility-visible', hook.includes("document.visibilityState === 'visible'"), 'Fires on visible')
check('just-clicked-guard', hook.includes("stateRef.current === 'just_clicked'"), 'Guards on just_clicked')
check('window-open', hook.includes("window.open(applyUrl, '_blank', 'noopener,noreferrer')"), 'noopener,noreferrer open')
check('stop-propagation', hook.includes('event.stopPropagation()'), 'stopPropagation on apply')
check('intent-api', hook.includes('logApplicationIntent(jobId)'), 'Calls intent API')
check('declare-api', hook.includes('declareApplication(jobId)'), 'Calls declare API')
check('declared-label', button.includes('مُسجَّل في رادارك'), 'Declared CTA label')
check('fallback-label', button.includes('عدت من موقع التقديم'), 'Fallback button')
check('unique-handling', server.includes("error.code === '23505'"), 'Unique conflict handling')
check('verified-email', server.includes('user_verified_emails'), 'Reads user_verified_emails')
check('submitted-status', server.includes("status: 'submitted'"), 'Inserts submitted application')
check('modal-email', modal.includes('بريدك الموثّق في جِد'), 'Shows verified email block')

const failed = checks.filter((item) => !item.pass)
for (const item of checks) {
  console.log(`${item.pass ? '✓' : '✗'} ${item.id}: ${item.detail}`)
}

if (failed.length > 0) {
  console.error(`\n${failed.length} check(s) failed`)
  process.exit(1)
}

console.log(`\nAll ${checks.length} self-declaration static checks passed.`)
