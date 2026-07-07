/**
 * Static verification for Section 8 legal pages.
 * Usage: pnpm tsx scripts/verify-legal-pages.ts
 */
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()
const SRC = join(ROOT, 'src')

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf8')
}

const checks: Array<[string, boolean]> = [
  ['legal-document wrapper exists', existsSync(join(SRC, 'app/[locale]/(public)/_components/legal-document.tsx'))],
  ['privacy page exists', existsSync(join(SRC, 'app/[locale]/(public)/privacy/page.tsx'))],
  ['terms page exists', existsSync(join(SRC, 'app/[locale]/(public)/terms/page.tsx'))],
  ['prose-jid in LegalDocument', read('src/app/[locale]/(public)/_components/legal-document.tsx').includes('prose prose-jid')],
  ['prose-jid variant in tailwind config', read('tailwind.config.ts').includes('jid:') && read('tailwind.config.ts').includes('@tailwindcss/typography')],
  ['version 1.0 constant', read('src/lib/legal/constants.ts').includes("1.0")],
  ['effective date 2026-07-07', read('src/lib/legal/constants.ts').includes('2026-07-07')],
  ['privacy uses LegalDocument', read('src/app/[locale]/(public)/privacy/page.tsx').includes('LegalDocument')],
  ['terms uses LegalDocument', read('src/app/[locale]/(public)/terms/page.tsx').includes('LegalDocument')],
  ['privacy links to /pdpl', read('src/app/[locale]/(public)/privacy/page.tsx').includes('href="/pdpl"')],
  ['privacy i18n en', read('messages/en.json').includes('"privacyPage"')],
  ['privacy i18n ar', read('messages/ar.json').includes('"privacyPage"')],
  ['terms i18n en', read('messages/en.json').includes('"termsPage"')],
  ['terms Resend mention en', read('messages/en.json').includes('Resend')],
  ['terms Supabase mention en', read('messages/en.json').includes('Supabase')],
  ['terms governing law Saudi en', read('messages/en.json').includes('Kingdom of Saudi Arabia')],
  ['terms self-declaration en', read('messages/en.json').includes('self-declaration') || read('messages/en.json').includes('Self-declaration')],
]

let failed = 0
for (const [label, ok] of checks) {
  if (!ok) {
    console.error(`FAIL: ${label}`)
    failed++
  } else {
    console.log(`PASS: ${label}`)
  }
}

if (failed > 0) {
  process.exit(1)
}

console.log(`\nAll ${checks.length} legal page checks passed.`)
