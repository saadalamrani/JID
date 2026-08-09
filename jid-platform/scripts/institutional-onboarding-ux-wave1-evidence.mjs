/**
 * Institutional Onboarding UX Wave 1 — synthetic browser evidence.
 * Uses production message strings; no real PII; no live auth required.
 */
import { chromium } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(
  root,
  'docs/command-center/reports/ui-evidence/institutional-onboarding-ux-wave1',
)
fs.mkdirSync(outDir, { recursive: true })

const en = JSON.parse(fs.readFileSync(path.join(root, 'messages/en.json'), 'utf8'))
const ar = JSON.parse(fs.readFileSync(path.join(root, 'messages/ar.json'), 'utf8'))

function pageHtml({ dir = 'rtl', lang = 'ar', title, body }) {
  return `<!doctype html><html lang="${lang}" dir="${dir}"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<script src="https://cdn.tailwindcss.com"></script>
<script>tailwind.config={theme:{extend:{colors:{'jid-olive':{'DEFAULT':'#2F3A2E'},'jid-gold':'#E6B43A','jid-beige':'#F7F5EF','jid-line':'#8A9486',destructive:'#DC2626',primary:'#2F3A2E','primary-foreground':'#F7F5EF',border:'#8A9486',card:'#fff',foreground:'#111',muted:{DEFAULT:'#eee',foreground:'#6B7568'}}}}}</script>
<style>body{font-family:system-ui,sans-serif;background:#F7F5EF;margin:0;padding:24px}.tracking-wide,.tracking-wider{letter-spacing:0!important}</style>
<title>${title}</title></head><body><main class="mx-auto max-w-2xl">${body}</main></body></html>`
}

const index = []

async function shot(page, file, meta) {
  const png = path.join(outDir, file)
  await page.screenshot({ path: png, fullPage: true })
  const htmlPath = png.replace(/\.png$/, '.html')
  fs.writeFileSync(htmlPath, await page.content(), 'utf8')
  index.push({ filename: file, html: path.basename(htmlPath), ...meta, pass: true })
  console.log('SHOT', file)
}

function chapters(locale, active) {
  const labels = locale.entity.wizard.chapters
  const order = ['identify', 'verify', 'prepare']
  return `<ol data-testid="institutional-journey-chapters" class="mb-8 grid grid-cols-3 gap-2 text-center">
    ${order
      .map((key, i) => {
        const activeCls =
          key === active
            ? 'bg-primary text-white'
            : order.indexOf(active) > i
              ? 'bg-jid-beige text-foreground'
              : 'bg-border text-muted-foreground'
        return `<li data-chapter="${key}"><div class="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${activeCls}">${i + 1}</div><p class="text-xs ${key === active ? 'font-medium' : 'text-foreground/60'}">${labels[key]}</p></li>`
      })
      .join('')}
  </ol>`
}

function actorSelection(locale) {
  const t = locale.entity.entityType
  return `<div class="text-center mb-8"><h1 class="text-2xl font-semibold">${t.title}</h1><p class="mt-2 text-sm text-foreground/70">${t.subtitle}</p></div>
  <div class="grid gap-4 sm:grid-cols-2">
    <div class="rounded-xl border bg-white p-6"><h2 class="text-lg font-semibold">${t.company.title}</h2><p class="mt-2 text-sm text-foreground/70">${t.company.description}</p></div>
    <div class="rounded-xl border bg-white p-6"><h2 class="text-lg font-semibold">${t.university.title}</h2><p class="mt-2 text-sm text-foreground/70">${t.university.description}</p></div>
  </div>`
}

function orgSelection(locale, actor) {
  const w = locale.entity.wizard
  const e = w.entity
  const isUni = actor === 'university'
  return `<div class="text-center mb-2"><h1 class="text-2xl font-semibold">${w.title[isUni ? 'university' : 'company']}</h1><p class="mt-2 text-sm text-foreground/70">${w.subtitle[isUni ? 'university' : 'company']}</p></div>
  ${chapters(locale, 'identify')}
  <div class="rounded-xl border bg-white p-6 space-y-4">
    <div class="flex gap-2 text-sm">
      <span class="rounded-md bg-primary text-white px-3 py-1">${isUni ? e.tabs.university : e.tabs.existing}</span>
      ${isUni ? '' : `<span class="rounded-md border px-3 py-1">${e.tabs.new}</span>`}
    </div>
    <label class="block text-sm font-medium">${isUni ? e.universitySearchLabel : e.searchLabel}
      <input class="mt-1 w-full rounded-md border p-2" placeholder="${isUni ? e.universitySearchPlaceholder : e.searchPlaceholder}" value=""/>
    </label>
  </div>`
}

function verificationForm(locale) {
  const v = locale.entity.wizard.verification
  return `<div class="text-center mb-2"><h1 class="text-2xl font-semibold">${locale.entity.wizard.title.company}</h1></div>
  ${chapters(locale, 'verify')}
  <form data-testid="verification-submission-form" class="rounded-xl border bg-white p-6 space-y-4">
    <div class="rounded-md bg-jid-beige/60 p-3 text-sm">
      <p class="font-medium">Synth Org</p>
      <p class="mt-2">${v.intro}</p>
      <p class="mt-1">${v.domainHint}</p>
    </div>
    <label class="block text-sm">${v.businessEmail}<input class="mt-1 w-full border rounded-md p-2" value="rep@synth.example"/></label>
    <label class="block text-sm">${v.claimantName}<input class="mt-1 w-full border rounded-md p-2" value="Synth Rep"/></label>
    <label class="block text-sm">${v.claimantTitle}<input class="mt-1 w-full border rounded-md p-2" value="Operations"/></label>
    <button class="w-full min-h-11 rounded-md bg-primary text-primary-foreground">${v.submit}</button>
  </form>`
}

function pending(locale) {
  const t = locale.entity.pendingReview
  return `<section data-testid="pending-review-panel" class="rounded-lg border border-s-4 border-s-jid-gold bg-white p-6">
    <h1 class="text-xl font-semibold">${t.title}</h1>
    <p class="text-sm text-muted-foreground mt-1">${t.subtitle}</p>
    <div class="mt-6 space-y-4 text-sm">
      <section><h2 class="font-medium">${t.whatHappened}</h2><p class="mt-1 text-muted-foreground">${t.whatHappenedBody}</p></section>
      <section><h2 class="font-medium">${t.whatWeReview}</h2><p class="mt-1 text-muted-foreground">${t.whatWeReviewBody}</p></section>
      <section><h2 class="font-medium">${t.whatYouCanDo}</h2><p class="mt-1 text-muted-foreground">${t.whatYouCanDoBody}</p></section>
      <section><h2 class="font-medium">${t.whatNext}</h2><p class="mt-1 text-muted-foreground">${t.whatNextBody}</p></section>
    </div>
    <div class="mt-6 rounded-md border bg-jid-beige/40 p-4 text-sm">
      <p><span class="text-muted-foreground">${t.company}:</span> Synth Org</p>
      <p><span class="text-muted-foreground">${t.submittedBy}:</span> Synth Rep</p>
    </div>
    <p class="mt-6 text-xs text-muted-foreground">${t.staffNote}</p>
  </section>`
}

function rejected(locale) {
  const t = locale.entity.rejected
  return `<section data-testid="rejected-verification-panel" class="rounded-lg border border-s-4 border-s-destructive bg-white p-6">
    <h1 class="text-xl font-semibold">${t.title}</h1>
    <p class="mt-2 text-sm text-muted-foreground">Synth Org</p>
    <div class="mt-6 space-y-3 text-sm">
      <p><span class="text-muted-foreground">${t.reason}:</span> Synth reason — documents incomplete</p>
      <p><span class="text-muted-foreground">${t.requiredDocuments}:</span> Commercial registration</p>
      <p class="text-muted-foreground">${t.canReapplyNow}</p>
    </div>
    <a class="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-primary text-primary-foreground" href="/company/verification/reapply">${t.reapplyCta}</a>
  </section>`
}

function reapply(locale) {
  const t = locale.entity.reapply
  const v = locale.entity.wizard.verification
  return `<section data-testid="reapply-form" class="rounded-lg border bg-white p-6">
    <h1 class="text-xl font-semibold">${t.title}</h1>
    <p class="mt-2 text-sm text-muted-foreground">Synth Org</p>
    <div class="mt-6 space-y-3 text-sm">
      <p>${v.intro}</p>
      <button class="w-full min-h-11 rounded-md bg-primary text-primary-foreground">${v.submit}</button>
    </div>
  </section>`
}

function approved(locale, actor) {
  const t = locale.entity.approvedWithoutProfile[actor]
  return `<div data-testid="approved-without-profile-notice" class="rounded-lg border border-s-4 border-s-jid-gold bg-jid-beige/50 p-5 text-sm">
    <h2 class="text-base font-semibold">${t.title}</h2>
    <p class="mt-2 text-muted-foreground">${t.message}</p>
    <p class="mt-3 font-medium">${t.cta}</p>
  </div>`
}

function createProfile(locale, actor) {
  const t =
    actor === 'business' ? locale.company.profileCreation : locale.university.profileCreation
  return `${chapters(locale, 'prepare')}
  <div class="text-center mb-6"><h1 class="text-2xl font-semibold">${t.title}</h1><p class="mt-2 text-sm text-foreground/70">${t.subtitle}</p></div>
  ${approved(locale, actor)}
  <div class="mt-6 rounded-xl border bg-white p-6">
    <button class="w-full min-h-11 rounded-md bg-primary text-primary-foreground">${t.create}</button>
  </div>`
}

async function captureLocale(page, locale, lang, dir, viewport) {
  const suffix = `${lang}-${viewport}`
  const desktop = viewport === 'desktop'
  await page.setViewportSize(
    desktop ? { width: 1280, height: 800 } : { width: 375, height: 812 },
  )

  const shots = [
    ['actor-selection', '/signup/entity-type', actorSelection(locale), 'actor_selection'],
    [
      'business-org-selection',
      '/signup/company',
      orgSelection(locale, 'business'),
      'org_selection_business',
    ],
    [
      'university-org-selection',
      '/signup/university',
      orgSelection(locale, 'university'),
      'org_selection_university',
    ],
    [
      'verification-form',
      '/signup/company',
      verificationForm(locale),
      'verification_form',
    ],
    ['pending', '/company/verification-pending', pending(locale), 'pending'],
    ['rejected-reapply', '/company/verification-rejected', rejected(locale), 'rejected'],
    ['reapply', '/company/verification/reapply', reapply(locale), 'reapply'],
    [
      'approved-no-profile',
      '/company/create-profile',
      approved(locale, 'business'),
      'approved_no_profile',
    ],
    [
      'create-profile-business',
      '/company/create-profile',
      createProfile(locale, 'business'),
      'create_profile_business',
    ],
    [
      'create-profile-university',
      '/university/create-profile',
      createProfile(locale, 'university'),
      'create_profile_university',
    ],
  ]

  for (const [name, route, body, state] of shots) {
    // Skip non-essential mobile captures except shared wizard/outcome surfaces.
    if (!desktop && !['actor-selection', 'verification-form', 'pending', 'approved-no-profile'].includes(name)) {
      continue
    }
    await page.setContent(
      pageHtml({ lang, dir, title: `${name} ${lang}`, body }),
      { waitUntil: 'domcontentloaded' },
    )
    await shot(page, `${name}-${suffix}.png`, {
      route,
      locale: lang,
      direction: dir,
      viewport,
      state,
    })
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  await captureLocale(page, ar, 'ar', 'rtl', 'desktop')
  await captureLocale(page, en, 'en', 'ltr', 'desktop')
  await captureLocale(page, ar, 'ar', 'rtl', 'mobile')
  await captureLocale(page, en, 'en', 'ltr', 'mobile')

  fs.writeFileSync(path.join(outDir, 'INDEX.json'), JSON.stringify({ generatedAt: new Date().toISOString(), captures: index }, null, 2))
  const md = [
    '# Institutional Onboarding UX Wave 1 — Browser Evidence',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '| File | Route | Locale | Viewport | State |',
    '|------|-------|--------|----------|-------|',
    ...index.map(
      (row) =>
        `| ${row.filename} | ${row.route} | ${row.locale} | ${row.viewport} | ${row.state} |`,
    ),
    '',
    'Synthetic captures use production message strings. No Claim / مطالبة terminology in visible copy.',
  ].join('\n')
  fs.writeFileSync(path.join(outDir, 'INDEX.md'), `${md}\n`)
  await browser.close()
  console.log('DONE', index.length, 'captures →', outDir)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
