/**
 * Verifies Section 7.11 export gate + Section 7.12 page counting.
 * Run: pnpm tsx scripts/verify-cv-preview-export.ts
 */

import { canExport, buildExportFilename } from '../src/lib/cv/can-export'
import { countPdfPagesFromBytes } from '../src/lib/cv/estimate-page-count'
import { SAMPLE_CV_DATA } from '../src/lib/cv/fixtures/sample-cv-data'
import { estimatePageCount } from '../src/lib/cv/estimate-page-count'
import type { CvFullRecord } from '../src/types/cv'

let passed = 0
let failed = 0

function assert(condition: boolean, label: string) {
  if (condition) {
    passed += 1
    console.log(`  PASS  ${label}`)
  } else {
    failed += 1
    console.error(`  FAIL  ${label}`)
  }
}

console.log('CV preview / export verification\n')

const minimalCv = {
  full_name: 'Noura Al-Rashid',
  email: 'noura@example.com',
  education: [{ id: '1' }],
  experience: [{ id: '1' }],
} as unknown as CvFullRecord

assert(canExport(minimalCv).ok, 'canExport passes with required fields')
assert(!canExport({ ...minimalCv, email: null } as CvFullRecord).ok, 'canExport blocks missing email')
assert(
  buildExportFilename('Noura Al-Rashid') === 'Noura_Al-Rashid_Resume.pdf',
  'export filename pattern',
)

const fakePdf = new TextEncoder().encode(
  '%PDF-1.3\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 2/Kids[3 0 R 4 0 R]>>endobj\n3 0 obj<</Type/Page>>endobj\n4 0 obj<</Type/Page>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF',
)
assert(countPdfPagesFromBytes(fakePdf) === 2, 'countPdfPagesFromBytes reads /Count')

console.log('\nRendering sample CV for page estimate (may take a few seconds)…')
void estimatePageCount(SAMPLE_CV_DATA)
  .then((pages) => {
    assert(pages >= 1, `sample CV renders to ${pages} page(s)`)
    console.log(`\n${passed} passed, ${failed} failed`)
    process.exit(failed > 0 ? 1 : 0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
