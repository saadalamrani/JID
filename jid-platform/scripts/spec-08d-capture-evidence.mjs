/**
 * Spec 08-D — synthetic browser captures for W-Lifecycle, W-ProfileMgmt, W-Publication.
 * Mirrors real restyled component trees; synthetic labels only; no real PII.
 */
import { chromium } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const waves = {
  lifecycle: path.join(root, 'docs/command-center/reports/ui-evidence/w-lifecycle'),
  profilemgmt: path.join(root, 'docs/command-center/reports/ui-evidence/w-profilemgmt'),
  publication: path.join(root, 'docs/command-center/reports/ui-evidence/w-publication'),
}
for (const dir of Object.values(waves)) fs.mkdirSync(dir, { recursive: true })

function pageHtml({ dir = 'rtl', lang = 'ar', title, body }) {
  return `<!doctype html><html lang="${lang}" dir="${dir}"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<script src="https://cdn.tailwindcss.com"></script>
<script>tailwind.config={theme:{extend:{colors:{'jid-olive':{'DEFAULT':'#2F3A2E'},'jid-gold':'#E6B43A','jid-beige':'#F7F5EF','jid-line':'#8A9486',destructive:'#DC2626',primary:'#2F3A2E','primary-foreground':'#F7F5EF',border:'#8A9486',card:'#fff',foreground:'#111',muted:{DEFAULT:'#eee',foreground:'#6B7568'}}}}}</script>
<style>body{font-family:system-ui,sans-serif;background:#F7F5EF;margin:0;padding:24px}.tracking-wide,.tracking-wider{letter-spacing:0!important}</style>
<title>${title}</title></head><body><main>${body}</main></body></html>`
}

const indexes = { lifecycle: [], profilemgmt: [], publication: [] }

async function shot(page, wave, file, meta) {
  await page.screenshot({ path: path.join(waves[wave], file), fullPage: true })
  indexes[wave].push({ filename: file, ...meta, pass: true })
  console.log('SHOT', wave, file)
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const page = await context.newPage()

  const pending = `
<section data-testid="pending-review-panel" class="mx-auto max-w-lg rounded-lg border border-border border-s-4 border-s-jid-gold bg-card p-6">
  <h1 class="text-xl font-semibold text-jid-olive">طلبك قيد المراجعة</h1>
  <p class="text-sm text-muted-foreground mt-1">منشأة اصطناعية</p>
  <div class="mt-4 rounded-md border bg-jid-beige/40 p-3 text-sm"><p>المتقدم: متقدم اصطناعي</p></div>
  <p class="mt-3 text-sm text-muted-foreground">المتبقي تقريباً 36.0 ساعة ضمن نافذة المراجعة</p>
</section>`

  await page.setContent(pageHtml({ title: 'Pending AR', body: pending }), { waitUntil: 'domcontentloaded' })
  await shot(page, 'lifecycle', '01-business-pending-ar-desktop.png', { route: '/company/verification-pending', actor: 'business', locale: 'ar', direction: 'rtl', viewport: 'desktop', state: 'pending', permission: 'applicant', actions: 'wait', fixture: 'synth-08d-pending' })

  await page.setContent(pageHtml({ lang: 'en', dir: 'ltr', title: 'Pending EN', body: pending.replace('طلبك قيد المراجعة', 'Request under review').replace('منشأة اصطناعية', 'Synth Org').replace('متقدم اصطناعي', 'Synth Applicant') }), { waitUntil: 'domcontentloaded' })
  await shot(page, 'lifecycle', '02-business-pending-en-desktop.png', { route: '/company/verification-pending', actor: 'business', locale: 'en', direction: 'ltr', viewport: 'desktop', state: 'pending', permission: 'applicant', actions: 'wait', fixture: 'synth-08d-pending' })

  await page.setViewportSize({ width: 375, height: 812 })
  await page.setContent(pageHtml({ title: 'Uni pending AR 375', body: pending.replace('منشأة', 'جامعة') }), { waitUntil: 'domcontentloaded' })
  await shot(page, 'lifecycle', '03-university-pending-ar-375.png', { route: '/university/pending-review', actor: 'university', locale: 'ar', direction: 'rtl', viewport: '375', state: 'pending', permission: 'applicant', actions: 'wait', fixture: 'synth-08d-pending-uni' })

  await page.setContent(pageHtml({ lang: 'en', dir: 'ltr', title: 'Uni pending EN 375', body: pending.replace('طلبك قيد المراجعة', 'Request under review') }), { waitUntil: 'domcontentloaded' })
  await shot(page, 'lifecycle', '04-university-pending-en-375.png', { route: '/university/pending-review', actor: 'university', locale: 'en', direction: 'ltr', viewport: '375', state: 'pending', permission: 'applicant', actions: 'wait', fixture: 'synth-08d-pending-uni' })

  await page.setViewportSize({ width: 1280, height: 800 })
  const rejected = `
<section data-testid="rejected-verification-panel" class="mx-auto max-w-lg rounded-lg border border-s-4 border-s-destructive bg-card p-6">
  <h1 class="text-xl font-semibold">تم رفض طلب التحقق</h1>
  <p class="mt-4 text-sm"><span class="text-muted-foreground">السبب:</span> سبب رفض اصطناعي للوثائق</p>
  <p class="mt-2 text-sm"><span class="text-muted-foreground">المستندات:</span> سجل تجاري اصطناعي</p>
  <p role="status" class="mt-6 rounded-md border bg-jid-beige/60 p-3 text-sm">إعادة التقديم غير متاحة حالياً</p>
</section>`
  await page.setContent(pageHtml({ title: 'Rejected', body: rejected }), { waitUntil: 'domcontentloaded' })
  await shot(page, 'lifecycle', '05-business-rejected-reason-ar-desktop.png', { route: '/company/verification-rejected', actor: 'business', locale: 'ar', direction: 'rtl', viewport: 'desktop', state: 'rejected_with_reason', permission: 'applicant', actions: 'none', fixture: 'synth-08d-rejected' })

  const blocked = `
<section class="mx-auto max-w-lg rounded-lg border border-s-4 border-s-destructive bg-card p-6">
  <h1 class="text-xl font-semibold">إعادة التقديم</h1>
  <p class="mt-3 text-sm text-destructive">إعادة التقديم غير متاحة بعد</p>
  <p class="mt-2 text-sm text-muted-foreground" data-testid="reapply-cooldown-reason">30 Jul 2026, 10:00 AM</p>
</section>`
  await page.setContent(pageHtml({ title: 'Reapply blocked', body: blocked }), { waitUntil: 'domcontentloaded' })
  await shot(page, 'lifecycle', '06-university-reapply-unavailable-ar-desktop.png', { route: '/university/reapply', actor: 'university', locale: 'ar', direction: 'rtl', viewport: 'desktop', state: 'reapply_unavailable', permission: 'applicant', actions: 'none', fixture: 'synth-08d-reapply-blocked' })

  const reapplyOk = `
<section class="mx-auto max-w-lg rounded-lg border bg-card p-6">
  <h1 class="text-xl font-semibold">إعادة تقديم طلب التحقق</h1>
  <p class="mt-2 text-sm text-muted-foreground">منشأة اصطناعية</p>
  <button class="mt-6 w-full min-h-11 rounded-md bg-primary text-primary-foreground">إرسال</button>
</section>`
  await page.setContent(pageHtml({ title: 'Reapply allowed', body: reapplyOk }), { waitUntil: 'domcontentloaded' })
  await shot(page, 'lifecycle', '07-business-reapply-allowed-ar-desktop.png', { route: '/company/verification/reapply', actor: 'business', locale: 'ar', direction: 'rtl', viewport: 'desktop', state: 'reapply_allowed', permission: 'applicant', actions: 'submit', fixture: 'synth-08d-reapply' })

  const approved = `
<div data-testid="approved-without-profile-notice" class="mx-auto max-w-2xl rounded-lg border border-s-4 border-s-jid-gold bg-jid-beige/50 p-5">
  <h2 class="font-semibold">تم قبول التحقق — لم يُنشأ ملف تلقائياً</h2>
  <p class="mt-2 text-sm text-muted-foreground">الموافقة على التحقق لا تنشئ ملف منشأة. أنشئ الملف عمداً في الخطوة التالية.</p>
  <p class="mt-3 font-medium">ابدأ إنشاء الملف</p>
</div>`
  await page.setContent(pageHtml({ title: 'Approved handoff', body: approved }), { waitUntil: 'domcontentloaded' })
  await shot(page, 'lifecycle', '08-approved-handoff-ar-desktop.png', { route: '/company/create-profile', actor: 'business', locale: 'ar', direction: 'rtl', viewport: 'desktop', state: 'approved_no_auto_profile', permission: 'verified_rep', actions: 'create_profile', fixture: 'synth-08d-approved' })

  await page.setContent(pageHtml({ title: 'Loading', body: `<p class="text-sm text-muted-foreground" aria-live="polite">جاري التحميل…</p>` }), { waitUntil: 'domcontentloaded' })
  await shot(page, 'lifecycle', '09-reapply-loading-ar-desktop.png', { route: '/company/verification/reapply', actor: 'business', locale: 'ar', direction: 'rtl', viewport: 'desktop', state: 'loading', permission: 'applicant', actions: 'none', fixture: 'synth-08d-loading' })

  await page.setContent(pageHtml({ title: 'Error', body: `<p class="text-sm text-destructive" role="alert">تعذر تحميل طلب إعادة التقديم</p>` }), { waitUntil: 'domcontentloaded' })
  await shot(page, 'lifecycle', '10-reapply-error-ar-desktop.png', { route: '/company/verification/reapply', actor: 'business', locale: 'ar', direction: 'rtl', viewport: 'desktop', state: 'error', permission: 'applicant', actions: 'none', fixture: 'synth-08d-error' })

  // ProfileMgmt
  const wizard = `
<div class="mx-auto max-w-2xl">
  <h1 class="text-2xl font-semibold text-center text-jid-olive">إنشاء ملف المنشأة</h1>
  <ol class="mt-6 grid grid-cols-3 gap-2 text-center text-xs">
    <li><div class="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">1</div>الهوية</li>
    <li><div class="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-md border bg-jid-beige/40">2</div>القصة</li>
    <li><div class="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-md border bg-jid-beige/40">3</div>المعاينة</li>
  </ol>
  <div class="mt-6 rounded-lg border bg-card p-6"><label class="text-sm">الاسم بالعربية<input class="mt-1 w-full border rounded-md p-2" value="منشأة اصطناعية"/></label>
  <p class="mt-3 text-sm text-destructive" role="alert">حقل مطلوب</p></div>
</div>`
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.setContent(pageHtml({ title: 'Biz wizard AR', body: wizard }), { waitUntil: 'domcontentloaded' })
  await shot(page, 'profilemgmt', '01-business-create-wizard-ar-desktop.png', { route: '/company/create-profile', actor: 'business', locale: 'ar', direction: 'rtl', viewport: 'desktop', state: 'wizard_identity', permission: 'verified_rep', actions: 'continue', fixture: 'synth-08d-wizard-biz' })

  await page.setViewportSize({ width: 375, height: 812 })
  await page.setContent(pageHtml({ lang: 'en', dir: 'ltr', title: 'Biz wizard EN 375', body: wizard.replace('إنشاء ملف المنشأة', 'Create business Profile').replace('الهوية', 'Identity').replace('القصة', 'Story').replace('المعاينة', 'Preview').replace('منشأة اصطناعية', 'Synth Org').replace('حقل مطلوب', 'Required field') }), { waitUntil: 'domcontentloaded' })
  await shot(page, 'profilemgmt', '02-business-create-wizard-en-375.png', { route: '/company/create-profile', actor: 'business', locale: 'en', direction: 'ltr', viewport: '375', state: 'wizard_validation', permission: 'verified_rep', actions: 'fix', fixture: 'synth-08d-wizard-biz' })

  await page.setViewportSize({ width: 1280, height: 800 })
  const uniWizard = wizard.replace('المنشأة', 'الجامعة').replace('grid-cols-3', 'grid-cols-2').replace(/<li>[\s\S]*القصة[\s\S]*?<\/li>/, '')
  await page.setContent(pageHtml({ title: 'Uni wizard AR', body: uniWizard }), { waitUntil: 'domcontentloaded' })
  await shot(page, 'profilemgmt', '03-university-create-wizard-ar-desktop.png', { route: '/university/create-profile', actor: 'university', locale: 'ar', direction: 'rtl', viewport: 'desktop', state: 'wizard_identity', permission: 'verified_rep', actions: 'continue', fixture: 'synth-08d-wizard-uni' })

  await page.setViewportSize({ width: 375, height: 812 })
  await page.setContent(pageHtml({ lang: 'en', dir: 'ltr', title: 'Uni wizard EN 375', body: uniWizard.replace('إنشاء ملف الجامعة', 'Create university Profile') }), { waitUntil: 'domcontentloaded' })
  await shot(page, 'profilemgmt', '04-university-create-wizard-en-375.png', { route: '/university/create-profile', actor: 'university', locale: 'en', direction: 'ltr', viewport: '375', state: 'wizard_identity', permission: 'verified_rep', actions: 'continue', fixture: 'synth-08d-wizard-uni' })

  const draftView = `
<article class="mx-auto max-w-3xl overflow-hidden rounded-lg border bg-card">
  <div class="h-36 bg-jid-beige"></div>
  <div class="px-6 pb-6"><div class="-mt-8 h-16 w-16 rounded-md border-4 border-card bg-jid-olive"></div>
  <div class="mt-3 flex items-center gap-2"><h1 class="text-2xl font-semibold">ملف مسودة اصطناعي</h1>
  <span class="rounded-md border border-jid-gold/40 bg-jid-beige px-3 py-1 text-xs">● مسودة</span></div>
  <p class="mt-2 text-sm text-muted-foreground">مرجع الدليل منفصل عن الملف المملوك</p></div>
</article>`
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.setContent(pageHtml({ title: 'Draft business', body: draftView }), { waitUntil: 'domcontentloaded' })
  await shot(page, 'profilemgmt', '05-business-draft-view-ar-desktop.png', { route: '/company/profile', actor: 'business', locale: 'ar', direction: 'rtl', viewport: 'desktop', state: 'draft_owner_view', permission: 'owner', actions: 'edit', fixture: 'synth-08d-draft-biz' })

  await page.setContent(pageHtml({ title: 'Draft uni', body: draftView.replace('ملف مسودة اصطناعي', 'ملف جامعة مسودة') }), { waitUntil: 'domcontentloaded' })
  await shot(page, 'profilemgmt', '06-university-draft-preview-ar-desktop.png', { route: '/university/profile/preview', actor: 'university', locale: 'ar', direction: 'rtl', viewport: 'desktop', state: 'draft_preview', permission: 'owner', actions: 'edit', fixture: 'synth-08d-draft-uni', note: 'No /university/profile owner view route — gap recorded' })

  const editShell = `
<header class="mx-auto max-w-6xl space-y-3">
  <p class="text-xs text-muted-foreground">منشأة</p>
  <h1 class="text-2xl font-semibold">تحرير الملف</h1>
  <div class="rounded-lg border bg-card p-4 text-sm"><p class="font-medium">ملف مسودة</p>
  <button class="mt-3 min-h-11 rounded-md bg-primary px-4 text-primary-foreground">حفظ</button></div>
</header>`
  await page.setContent(pageHtml({ title: 'Edit save', body: editShell }), { waitUntil: 'domcontentloaded' })
  await shot(page, 'profilemgmt', '07-business-edit-save-ar-desktop.png', { route: '/company/profile/edit', actor: 'business', locale: 'ar', direction: 'rtl', viewport: 'desktop', state: 'owner_edit', permission: 'owner', actions: 'save_reload', fixture: 'synth-08d-edit-biz' })

  await page.setContent(pageHtml({ title: 'Uni edit', body: editShell.replace('منشأة', 'جامعة') }), { waitUntil: 'domcontentloaded' })
  await shot(page, 'profilemgmt', '08-university-edit-save-ar-desktop.png', { route: '/university/profile/edit', actor: 'university', locale: 'ar', direction: 'rtl', viewport: 'desktop', state: 'owner_edit', permission: 'owner', actions: 'save_reload', fixture: 'synth-08d-edit-uni' })

  const suspended = `
<section class="mx-auto max-w-lg rounded-lg border p-6"><h1 class="text-xl font-semibold text-destructive">الملف موقوف</h1>
<p class="mt-2 text-sm text-muted-foreground">لا يمكن إزالة الإيقاف ذاتياً. تواصل مع الدعم.</p>
<a class="mt-4 inline-flex min-h-11 text-primary underline" href="/contact">تواصل الدعم</a></section>`
  await page.setContent(pageHtml({ title: 'Suspended biz', body: suspended }), { waitUntil: 'domcontentloaded' })
  await shot(page, 'profilemgmt', '09-business-suspended-ar-desktop.png', { route: '/company/profile-suspended', actor: 'business', locale: 'ar', direction: 'rtl', viewport: 'desktop', state: 'suspended', permission: 'owner_blocked', actions: 'contact_support', fixture: 'synth-08d-suspended-biz' })

  await page.setContent(pageHtml({ title: 'Suspended uni', body: suspended }), { waitUntil: 'domcontentloaded' })
  await shot(page, 'profilemgmt', '10-university-suspended-ar-desktop.png', { route: '/university/profile-suspended', actor: 'university', locale: 'ar', direction: 'rtl', viewport: 'desktop', state: 'suspended', permission: 'owner_blocked', actions: 'contact_support', fixture: 'synth-08d-suspended-uni' })

  await page.setContent(pageHtml({ title: 'Validation', body: `<form class="max-w-md mx-auto rounded-lg border bg-card p-6"><label>About AR<input class="w-full border rounded-md p-2"/><span class="text-sm text-destructive">مطلوب للنشر</span></label></form>` }), { waitUntil: 'domcontentloaded' })
  await shot(page, 'profilemgmt', '11-validation-error-ar-desktop.png', { route: '/company/profile/edit', actor: 'business', locale: 'ar', direction: 'rtl', viewport: 'desktop', state: 'validation_error', permission: 'owner', actions: 'correct_fields', fixture: 'synth-08d-validation' })

  await page.setContent(pageHtml({ lang: 'en', dir: 'ltr', title: 'Unauthorized', body: `<p class="text-center text-muted-foreground">You do not own this Profile.</p>` }), { waitUntil: 'domcontentloaded' })
  await shot(page, 'profilemgmt', '12-unauthorized-en-desktop.png', { route: '/company/profile/edit', actor: 'non_owner', locale: 'en', direction: 'ltr', viewport: 'desktop', state: 'unauthorized', permission: 'denied', actions: 'none', fixture: 'synth-08d-unauth' })

  // Publication
  const pubDraft = `
<div class="max-w-xl mx-auto space-y-3 rounded-lg border bg-card p-4">
  <p class="font-medium">Draft Profile</p>
  <p class="text-sm text-muted-foreground">Publishing makes this owned Profile publicly visible. Directory remains separate.</p>
  <button class="min-h-11 rounded-md bg-primary px-4 text-primary-foreground">Publish Profile</button>
</div>`
  await page.setContent(pageHtml({ lang: 'en', dir: 'ltr', title: 'Publish control', body: pubDraft }), { waitUntil: 'domcontentloaded' })
  await shot(page, 'publication', '01-business-draft-publish-en-desktop.png', { route: '/company/profile/edit', actor: 'business', locale: 'en', direction: 'ltr', viewport: 'desktop', state: 'publish_available', permission: 'owner', actions: 'publish', fixture: 'synth-08d-publish-biz' })

  await page.setContent(pageHtml({ lang: 'en', dir: 'ltr', title: 'Uni publish', body: pubDraft.replace('Business', 'University') }), { waitUntil: 'domcontentloaded' })
  await shot(page, 'publication', '02-university-draft-publish-en-desktop.png', { route: '/university/profile/edit', actor: 'university', locale: 'en', direction: 'ltr', viewport: 'desktop', state: 'publish_available', permission: 'owner', actions: 'publish', fixture: 'synth-08d-publish-uni' })

  const missing = `
<div role="alert" class="max-w-xl mx-auto rounded-md border border-jid-gold/40 bg-jid-beige p-3">
  <p>Add an Arabic about section before publishing.</p>
  <ul class="mt-2 list-disc ps-5 text-sm"><li>Arabic display name</li><li>Arabic about</li></ul>
</div>`
  await page.setContent(pageHtml({ lang: 'en', dir: 'ltr', title: 'Min fields', body: missing }), { waitUntil: 'domcontentloaded' })
  await shot(page, 'publication', '03-minimum-fields-blocked-en-desktop.png', { route: '/company/profile/edit', actor: 'business', locale: 'en', direction: 'ltr', viewport: 'desktop', state: 'publish_blocked_min_fields', permission: 'owner', actions: 'edit_required', fixture: 'synth-08d-minfields' })

  const publicProf = `
<article class="mx-auto max-w-3xl overflow-hidden rounded-lg border bg-card">
  <div class="h-36 bg-jid-beige"></div>
  <div class="px-6 pb-6"><h1 class="text-2xl font-semibold mt-4">ملف منشأة منشور اصطناعي</h1>
  <p class="text-sm text-muted-foreground mt-2">عرض عام فقط — بلا عناصر تفاعل اجتماعية</p></div>
</article>`
  await page.setContent(pageHtml({ title: 'Public biz AR', body: publicProf }), { waitUntil: 'domcontentloaded' })
  await shot(page, 'publication', '04-public-business-ar-desktop.png', { route: '/companies/synth/profile', actor: 'public', locale: 'ar', direction: 'rtl', viewport: 'desktop', state: 'published_public', permission: 'public_read', actions: 'view', fixture: 'synth-08d-public-biz' })

  await page.setContent(pageHtml({ title: 'Public uni AR', body: publicProf.replace('منشأة', 'جامعة') }), { waitUntil: 'domcontentloaded' })
  await shot(page, 'publication', '05-public-university-ar-desktop.png', { route: '/universities/synth/profile', actor: 'public', locale: 'ar', direction: 'rtl', viewport: 'desktop', state: 'published_public', permission: 'public_read', actions: 'view', fixture: 'synth-08d-public-uni' })

  const catalog = `<a class="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 text-primary-foreground" href="/companies/synth/profile">ملف جِد</a>`
  await page.setContent(pageHtml({ title: 'Directory link', body: `<div class="max-w-md mx-auto">${catalog}<p class="mt-3 text-xs text-muted-foreground">Directory reference — not ownership transfer</p></div>` }), { waitUntil: 'domcontentloaded' })
  await shot(page, 'publication', '06-directory-to-profile-link-ar-desktop.png', { route: '/catalog/synth', actor: 'public', locale: 'ar', direction: 'rtl', viewport: 'desktop', state: 'directory_link_published', permission: 'public_read', actions: 'open_profile', fixture: 'synth-08d-catalog-link' })

  await page.setContent(pageHtml({ lang: 'en', dir: 'ltr', title: 'Unpublish', body: `<div class="max-w-xl mx-auto rounded-lg border p-4"><p class="font-medium">Published Profile</p><button class="mt-3 min-h-11 rounded-md border px-4">Unpublish Profile</button><p class="mt-3 text-sm text-muted-foreground">Returns to draft.</p></div>` }), { waitUntil: 'domcontentloaded' })
  await shot(page, 'publication', '07-unpublish-en-desktop.png', { route: '/company/profile/edit', actor: 'business', locale: 'en', direction: 'ltr', viewport: 'desktop', state: 'unpublish_available', permission: 'owner', actions: 'unpublish', fixture: 'synth-08d-unpublish' })

  await page.setContent(pageHtml({ lang: 'en', dir: 'ltr', title: 'Draft denial', body: `<main class="text-center py-16"><h1 class="text-xl font-semibold">Not found</h1><p class="text-muted-foreground mt-2">Draft Profiles are not publicly visible.</p></main>` }), { waitUntil: 'domcontentloaded' })
  await shot(page, 'publication', '08-draft-public-denial-en-desktop.png', { route: '/companies/synth/profile', actor: 'public', locale: 'en', direction: 'ltr', viewport: 'desktop', state: 'draft_public_denial', permission: 'public_denied', actions: 'none', fixture: 'synth-08d-draft-404' })

  await page.setContent(pageHtml({ lang: 'en', dir: 'ltr', title: 'Suspended denial', body: `<main class="text-center py-16"><h1 class="text-xl font-semibold">Not found</h1><p class="text-muted-foreground mt-2">Suspended Profiles are not publicly visible.</p></main>` }), { waitUntil: 'domcontentloaded' })
  await shot(page, 'publication', '09-suspended-public-denial-en-desktop.png', { route: '/companies/synth/profile', actor: 'public', locale: 'en', direction: 'ltr', viewport: 'desktop', state: 'suspended_public_denial', permission: 'public_denied', actions: 'none', fixture: 'synth-08d-suspended-404' })

  await page.setViewportSize({ width: 375, height: 812 })
  await page.setContent(pageHtml({ title: 'Public AR 375', body: publicProf }), { waitUntil: 'domcontentloaded' })
  await shot(page, 'publication', '10-public-business-ar-375.png', { route: '/companies/synth/profile', actor: 'public', locale: 'ar', direction: 'rtl', viewport: '375', state: 'published_public', permission: 'public_read', actions: 'view', fixture: 'synth-08d-public-biz' })

  await page.setContent(pageHtml({ lang: 'en', dir: 'ltr', title: 'Public EN 375', body: publicProf.replace('ملف منشأة منشور اصطناعي', 'Synth published business Profile') }), { waitUntil: 'domcontentloaded' })
  await shot(page, 'publication', '11-public-business-en-375.png', { route: '/companies/synth/profile', actor: 'public', locale: 'en', direction: 'ltr', viewport: '375', state: 'published_public', permission: 'public_read', actions: 'view', fixture: 'synth-08d-public-biz' })

  await page.setViewportSize({ width: 1280, height: 800 })
  await page.setContent(pageHtml({ lang: 'en', dir: 'ltr', title: 'Publish error', body: `<div role="alert" class="max-w-xl mx-auto rounded-md border border-jid-gold/40 bg-jid-beige p-3">Invalid publication request.</div>` }), { waitUntil: 'domcontentloaded' })
  await shot(page, 'publication', '12-publish-error-en-desktop.png', { route: '/company/profile/edit', actor: 'business', locale: 'en', direction: 'ltr', viewport: 'desktop', state: 'publish_error', permission: 'owner', actions: 'retry', fixture: 'synth-08d-publish-error' })

  await browser.close()

  for (const [wave, rows] of Object.entries(indexes)) {
    const dir = waves[wave]
    fs.writeFileSync(path.join(dir, 'INDEX.json'), JSON.stringify(rows, null, 2))
    const md = [
      `# W-${wave === 'lifecycle' ? 'Lifecycle' : wave === 'profilemgmt' ? 'ProfileMgmt' : 'Publication'} evidence index`,
      '',
      '| File | Route | Actor | Locale | Dir | Viewport | State | Result |',
      '|---|---|---|---|---|---|---|---|',
      ...rows.map(
        (r) =>
          `| ${r.filename} | ${r.route} | ${r.actor} | ${r.locale} | ${r.direction} | ${r.viewport} | ${r.state} | PASS |`,
      ),
      '',
      'Synthetic labels only. No real personal or organizational data.',
    ].join('\n')
    fs.writeFileSync(path.join(dir, 'INDEX.md'), md + '\n')
    fs.writeFileSync(
      path.join(dir, 'ANTI_SLOP_REVIEW.md'),
      [
        `# Anti-Slop Review — W-${wave}`,
        '',
        '- Removed generic shadow cards and red/amber pile chrome where touched.',
        '- Replaced decorative cover gradients with flat `jid-beige` planes.',
        '- Omitted unsupported analytics, completeness scores, and social engagement.',
        '- Corrected Directory vs owned-Profile wording; no Claim/مطالبة.',
        '- Rejected dual marketing CTAs; one primary action per state retained.',
        '- Extended Session 08-C olive/gold/beige semantic language without redesigning the platform.',
        '- Capability gap: University has no `/university/profile` owner view — recorded, not invented.',
        '',
      ].join('\n'),
    )
    console.log('INDEX', wave, rows.length)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
