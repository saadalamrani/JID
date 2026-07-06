/**
 * Sections 10 / 13 / 14 / 15 — Build My CV final verification.
 * Run: pnpm tsx scripts/verify-cv-final.ts
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { CV_ANALYTICS_EVENTS, ANALYTICS_EVENTS } from '../src/lib/analytics/track'
import { SAMPLE_CV_DATA } from '../src/lib/cv/fixtures/sample-cv-data'
import { estimatePageCount } from '../src/lib/cv/estimate-page-count'

const ROOT = process.cwd()

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf-8')
}

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      if (entry === 'node_modules' || entry === '.next') continue
      walk(full, files)
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry)) {
      files.push(full)
    }
  }
  return files
}

let passed = 0
let failed = 0
const manual: string[] = []

function check(label: string, ok: boolean) {
  if (ok) {
    passed += 1
    console.log(`  PASS  ${label}`)
  } else {
    failed += 1
    console.log(`  FAIL  ${label}`)
  }
}

function manualCheck(label: string, note: string) {
  manual.push(`${label}: ${note}`)
  console.log(`  MANUAL  ${label} — ${note}`)
}

console.log('Build My CV — Final Verification (Sections 10 / 13 / 14 / 15)\n')

// ── Section 10 mobile ────────────────────────────────────────────────────────

check('mobile-cv-builder.tsx exists', existsSync('src/app/[locale]/(individual)/profile/cv/_components/mobile-cv-builder.tsx'))
check('mobile-section-accordion.tsx exists', existsSync('src/app/[locale]/(individual)/profile/cv/_components/mobile-section-accordion.tsx'))

const shellSrc = read('src/app/[locale]/(individual)/profile/cv/_components/cv-builder-shell.tsx')
const mobileSrc =
  read('src/app/[locale]/(individual)/profile/cv/_components/mobile-cv-builder.tsx') +
  read('src/app/[locale]/(individual)/profile/cv/_components/mobile-section-accordion.tsx')

check('shell hides desktop grid below xl', shellSrc.includes('hidden') && shellSrc.includes('xl:grid'))
check('shell renders MobileCvBuilder on mobile', shellSrc.includes('MobileCvBuilder') && shellSrc.includes('xl:hidden'))
check('mobile uses Edit/Preview tabs', mobileSrc.includes('TabsTrigger') && mobileSrc.includes('editTab'))
check('mobile accordion stacks all five sections', mobileSrc.includes('CV_BUILDER_SECTIONS'))

// ── Section 15 analytics ───────────────────────────────────────────────────────

const cvAnalyticsSource =
  read('src/lib/cv/hooks/use-cv-builder-analytics.ts') +
  read('src/app/[locale]/(individual)/profile/cv/_components/export-button.tsx') +
  read('src/app/[locale]/(individual)/profile/cv/_components/page-overflow-warning.tsx')

for (const event of CV_ANALYTICS_EVENTS) {
  check(
    `analytics: ${event} declared and referenced`,
    ANALYTICS_EVENTS.includes(event) && cvAnalyticsSource.includes(`'${event}'`),
  )
}

// ── Task 3 checklist (automated) ─────────────────────────────────────────────

const autoFillSrc = read('src/lib/cv/auto-fill.ts')
const payloadSrc = read('src/lib/cv/autofill-payload.ts')

check(
  'autofill uses reconciled profile columns (university_id, college_id, about_me, target_regions)',
  autoFillSrc.includes('university_id') &&
    autoFillSrc.includes('college_id') &&
    autoFillSrc.includes('about_me') &&
    autoFillSrc.includes('target_regions'),
)
check(
  'autofill does not select email from profiles table',
  !/from\('profiles'\)[\s\S]*select\([^)]*\bemail\b/.test(autoFillSrc),
)
check('autofill resolves email via user_verified_emails', autoFillSrc.includes('user_verified_emails'))
check('autofill joins universities and colleges', autoFillSrc.includes("from('universities')") && autoFillSrc.includes("from('colleges')"))
check('country left null in autofill payload', payloadSrc.includes('country: null'))

const cvLibFiles = walk(join(ROOT, 'src/lib/cv')).map((f) => readFileSync(f, 'utf-8')).join('\n')
const cvApiFiles = walk(join(ROOT, 'src/app/api/me/cv')).map((f) => readFileSync(f, 'utf-8')).join('\n')

check(
  'CV independent after creation — profiles only read in auto-fill initialize path',
  autoFillSrc.includes('initializeCv') &&
    !cvLibFiles.replace(autoFillSrc, '').includes("from('profiles')") &&
    !cvApiFiles.includes("from('profiles')"),
)

const pdfDocSrc = read('src/lib/cv/pdf-document.tsx')
check(
  'PDF Document uses only Page/View/Text/Link primitives',
  pdfDocSrc.includes("from '@react-pdf/renderer'") &&
    !/\b(Image|Svg|Html|Canvas|PDFDownloadLink)\b/.test(pdfDocSrc),
)

const pdfLayerSrc =
  read('src/lib/cv/pdf-document.tsx') +
  read('src/lib/cv/pdf-styles.ts') +
  read('src/lib/cv/pdf-helpers.ts')

check(
  'PDF styles are black/white only (no decorative colors)',
  pdfLayerSrc.includes("'#000000'") &&
    pdfLayerSrc.includes("'#FFFFFF'") &&
    !/#[0-9a-fA-F]{3,8}/.test(pdfLayerSrc.replace(/#000000/g, '').replace(/#FFFFFF/g, '')),
)

check(
  'no PDF upload to Supabase Storage in CV module',
  !/storage\.from|upload\(|\.upload\(/.test(cvLibFiles + cvApiFiles + read('src/lib/cv/export-cv-pdf.ts')),
)

check(
  'no visible JID branding in PDF document metadata/body',
  !pdfDocSrc.toLowerCase().includes('jid') &&
    pdfDocSrc.includes('creator="Resume Builder"') &&
    pdfDocSrc.includes('producer="PDF Generator"'),
)

check(
  'auto-save shows Saved · Xs ago pattern',
  read('src/lib/hooks/use-auto-save.ts').includes('secondsAgo') &&
    read('src/app/[locale]/(individual)/profile/cv/_components/section-header-form.tsx').includes("saveSaved"),
)

const formFiles = [
  'section-header-form.tsx',
  'section-skills-form.tsx',
  'education-entry-card.tsx',
  'experience-entry-card.tsx',
  'additional-entry-card.tsx',
].map((f) => read(`src/app/[locale]/(individual)/profile/cv/_components/${f}`))

check(
  'auto-save error toast wired in all CV forms',
  formFiles.every((src) => src.includes('toast.error') && src.includes('onError')),
)

// Overflow — sample CV exceeds one page
console.log('\nMeasuring sample CV page count (may take a few seconds)…')

void estimatePageCount(SAMPLE_CV_DATA)
  .then((pages) => {
    check(`sample CV overflows single page (${pages} pages)`, pages > 1)
    check('PageOverflowWarning component exists', read('src/app/[locale]/(individual)/profile/cv/_components/page-overflow-warning.tsx').includes('OVERFLOW_PAGE_THRESHOLD'))

    // ── Section 14 manual PDF quality ────────────────────────────────────────

    manualCheck(
      'PDF opens in Chrome / Acrobat / Preview',
      'Open public/samples/cv-sample.pdf or export from builder in each viewer',
    )
    manualCheck(
      'ATS parsability',
      'Run exported PDF through a free ATS checker (e.g. Jobscan free scan)',
    )
    manualCheck(
      'All text selectable and copyable',
      'Select-all in each viewer; confirm no rasterized text',
    )
    manualCheck(
      'Hyperlinks work across viewers',
      'Click LinkedIn/GitHub links in Chrome PDF viewer and Acrobat',
    )
    manualCheck(
      'JID only in PDF properties (not visible body)',
      'File → Properties in Acrobat; confirm Producer/Creator lack visible JID on page',
    )

    console.log(`\nAutomated: ${passed} passed, ${failed} failed`)
    if (manual.length) {
      console.log('\nManual checks required:')
      for (const item of manual) {
        console.log(`  • ${item}`)
      }
    }

    const moduleComplete = failed === 0
    console.log(
      moduleComplete
        ? '\nAutomated verification PASSED — complete manual Section 14 checks to declare module COMPLETE.'
        : '\nAutomated verification FAILED — do not declare module COMPLETE.',
    )
    process.exit(failed > 0 ? 1 : 0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
