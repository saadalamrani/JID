/**
 * Section 14 — automated checks for CV sample PDF.
 * Run after: pnpm tsx scripts/generate-cv-sample-pdf.ts
 */

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const OUTPUT = resolve(process.cwd(), 'public/samples/cv-sample.pdf')

let passed = 0
let failed = 0

function check(label: string, ok: boolean): void {
  if (ok) {
    passed++
    console.log(`PASS: ${label}`)
  } else {
    failed++
    console.error(`FAIL: ${label}`)
  }
}

function main(): void {
  check('sample PDF exists', existsSync(OUTPUT))

  const bytes = readFileSync(OUTPUT)
  const raw = bytes.toString('latin1')

  check('valid PDF magic bytes', raw.startsWith('%PDF-'))
  check('single page layout', (raw.match(/\/Type\s*\/Page[^s]/g) ?? []).length === 1)
  check('linkedin hyperlink present', raw.includes('linkedin.com'))
  check('flate-compressed text stream (vector, not raster)', raw.includes('/FlateDecode'))
  check('no JID branding in body', !raw.toLowerCase().includes('jid platform'))

  console.log(`\n${passed}/${passed + failed} automated checks passed`)
  process.exit(failed > 0 ? 1 : 0)
}

main()
