/**
 * Section 14 — generate sample CV PDF for manual inspection.
 * Run: pnpm tsx scripts/generate-cv-sample-pdf.ts
 */

import { mkdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import React from 'react'
import { renderToFile } from '@react-pdf/renderer'
import { CvDocument } from '../src/lib/cv/pdf-document'
import { SAMPLE_CV_DATA } from '../src/lib/cv/fixtures/sample-cv-data'

const OUTPUT = resolve(process.cwd(), 'public/samples/cv-sample.pdf')

async function main(): Promise<void> {
  mkdirSync(dirname(OUTPUT), { recursive: true })

  await renderToFile(React.createElement(CvDocument, { data: SAMPLE_CV_DATA }), OUTPUT)

  const bytes = readFileSync(OUTPUT)
  const header = bytes.subarray(0, 5).toString('ascii')
  const sizeKb = Math.round(statSync(OUTPUT).size / 1024)

  if (header !== '%PDF-') {
    console.error('FAIL: output is not a valid PDF')
    process.exit(1)
  }

  const hasTextObjects = bytes.includes(Buffer.from('BT'))
  const hasLinkAnnot = bytes.includes(Buffer.from('/URI'))

  console.log('=== CV sample PDF generated ===')
  console.log(`Path : ${OUTPUT}`)
  console.log(`Size : ${sizeKb} KB`)
  console.log(`Magic: ${header} (vector PDF)`)
  console.log(`Text operators (BT): ${hasTextObjects ? 'yes — selectable text expected' : 'not detected'}`)
  console.log(`URI annotations: ${hasLinkAnnot ? 'yes — clickable links expected' : 'not detected'}`)
  console.log('')
  console.log('Manual checks (Section 14):')
  console.log('  1. Open public/samples/cv-sample.pdf — text should be selectable/copyable')
  console.log('  2. Click LinkedIn in header — anchor text "LinkedIn", not raw URL')
  console.log('  3. Confirm single-page layout with 2 education + 2 experience entries')
  console.log('')
  console.log('Dev route: GET /api/cv/sample-pdf')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
