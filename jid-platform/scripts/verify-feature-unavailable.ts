/**
 * FeatureUnavailable structure verification (static).
 * Run: pnpm tsx scripts/verify-feature-unavailable.ts
 */

import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const ROOT = resolve(process.cwd())
const LIB = join(ROOT, 'src/lib/feature-flags')

let passed = 0
let failed = 0

function pass(label: string) {
  passed += 1
  console.log(`  PASS  ${label}`)
}

function fail(label: string, detail?: string) {
  failed += 1
  console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`)
}

function main() {
  console.log('FeatureUnavailable + gates verification\n')

  const files = [
    'feature-unavailable.tsx',
    'feature-gate.tsx',
    'feature-gate-client.tsx',
  ] as const

  for (const file of files) {
    if (existsSync(join(LIB, file))) pass(`File ${file}`)
    else fail(`Missing ${file}`)
  }

  const unavailable = readFileSync(join(LIB, 'feature-unavailable.tsx'), 'utf-8')
  const gate = readFileSync(join(LIB, 'feature-gate.tsx'), 'utf-8')
  const gateClient = readFileSync(join(LIB, 'feature-gate-client.tsx'), 'utf-8')

  const requiredTokens = ['bg-jid-beige-warm', 'border-jid-gold/40', 'text-jid-ink']
  for (const token of requiredTokens) {
    if (unavailable.includes(token)) pass(`FeatureUnavailable uses ${token}`)
    else fail(`FeatureUnavailable missing ${token}`)
  }

  if (unavailable.includes('compact') && unavailable.includes('if (compact)')) {
    pass('FeatureUnavailable compact + standard variants')
  } else {
    fail('FeatureUnavailable variants')
  }

  if (gate.includes('isFeatureEnabled') && gate.includes('FeatureUnavailable') && gate.includes('getFlagMetadata')) {
    pass('FeatureGate server wiring')
  } else {
    fail('FeatureGate server wiring')
  }

  if (
    gateClient.includes('useFeatureFlag') &&
    gateClient.includes('FeatureGateSkeleton') &&
    gateClient.includes('FeatureUnavailable')
  ) {
    pass('FeatureGateClient hook + skeleton + fallback')
  } else {
    fail('FeatureGateClient wiring')
  }

  console.log('\n--- FeatureUnavailable visual structure ---')
  console.log('Standard:')
  console.log('  • Outer: rounded-2xl card, border-jid-gold/40, bg-jid-beige-warm, centered text')
  console.log('  • Accent: top gold gradient hairline + soft gold/olive glow orbs')
  console.log('  • Icon: Sparkles in frosted white/gold rounded-square (14×14)')
  console.log('  • Title: text-xl/2xl font-semibold text-jid-ink')
  console.log('  • Body: max-w-md text-sm/base text-jid-ink/65')
  console.log('Compact:')
  console.log('  • Outer: horizontal flex row, rounded-xl, same warm/gold tokens')
  console.log('  • Icon: 9×9 gold ring circle with Sparkles')
  console.log('  • Title: text-sm semibold truncate')
  console.log('  • Body: text-xs line-clamp-2')

  console.log(`\n${passed} passed, ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
}

main()
