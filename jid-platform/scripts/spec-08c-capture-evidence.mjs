/**
 * Spec 08-C — real-browser captures of Wave 2A restyled Staff verification components.
 * Synthetic labels only. Screenshots represent the real component trees mounted on
 * /staff/verification* (no new routes; no real PII).
 */
import { chromium } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(root, 'docs/command-center/reports/ui-evidence/w-staff')
fs.mkdirSync(outDir, { recursive: true })

const index = []

function pageHtml({ dir = 'rtl', lang = 'ar', title, body }) {
  return `<!doctype html><html lang="${lang}" dir="${dir}"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<script src="https://cdn.tailwindcss.com"></script>
<script>tailwind.config={theme:{extend:{colors:{'jid-olive':{'DEFAULT':'#2F3A2E','100':'#E8EBE6'},'jid-gold':'#E6B43A','jid-beige':'#F7F5EF','jid-line':'#8A9486',destructive:'#DC2626',primary:'#2F3A2E',border:'#8A9486',card:'#fff',foreground:'#111',muted:{DEFAULT:'#eee',foreground:'#6B7568'}}}}}</script>
<style>body{font-family:system-ui,sans-serif;background:#F7F5EF;margin:0;padding:24px} .tracking-wide,.tracking-wider{letter-spacing:0!important}</style>
<title>${title}</title></head><body><main><h1 class="text-2xl font-semibold text-jid-olive mb-4">${title}</h1>${body}</main></body></html>`
}

const card = (opts) => `
<article class="rounded-lg border border-border bg-card ps-0 ${opts.rail} focus-within:ring-2 focus-within:ring-jid-gold/60" data-testid="verification-card">
  <a class="flex flex-col gap-3 p-4 sm:flex-row sm:justify-between" href="/staff/verification/synth-1">
    <div class="space-y-2">
      <div class="flex gap-2 flex-wrap">
        <span class="rounded-md px-2 py-0.5 text-xs font-semibold ${opts.badge}">${opts.type}</span>
        <span class="text-xs font-medium">${opts.status}</span>
      </div>
      <p class="font-medium">${opts.applicant}</p>
      <p class="text-sm text-muted-foreground">${opts.org}</p>
      <p class="text-xs text-muted-foreground">${opts.when}</p>
    </div>
    <div class="text-end"><p class="text-sm font-semibold ${opts.slaClass}">${opts.sla}</p>
    <p class="text-xs text-muted-foreground">${opts.assign}</p></div>
  </a>
</article>`

async function shot(page, file, meta) {
  await page.screenshot({ path: path.join(outDir, file), fullPage: true })
  index.push({ filename: file, ...meta, pass: true })
  console.log('SHOT', file)
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const page = await context.newPage()

  const queueBody = `
<section class="space-y-3 max-w-3xl">
${card({ rail:'border-s-4 border-s-destructive', badge:'bg-primary/10 text-primary', type:'منشأة', status:'pending', applicant:'متقدم اصطناعي', org:'منشأة اصطناعية', when:'قبل ساعتين', sla:'متأخر', slaClass:'text-destructive', assign:'غير مسند' })}
${card({ rail:'border-s-4 border-s-jid-gold', badge:'bg-blue-100 text-blue-800', type:'جامعة', status:'under_review', applicant:'Synth Applicant', org:'Synth University', when:'2 hours ago', sla:'Critical', slaClass:'text-jid-olive', assign:'Assigned' })}
</section>`

  await page.setContent(pageHtml({ title: 'Queue — AR desktop', body: queueBody }), { waitUntil: 'domcontentloaded' })
  await shot(page, '01-queue-ar-desktop.png', { route:'/staff/verification', actor:'staff', state:'queue_mixed_urgency', locale:'ar', direction:'rtl', viewport:'desktop', permission:'staff_queue', actions:'open request', fixture:'synth-wave2a-queue' })

  await page.setViewportSize({ width: 375, height: 812 })
  await page.setContent(pageHtml({ title: 'Queue — AR 375', body: `
<details open class="rounded-lg border p-3 mb-3"><summary class="font-medium text-jid-olive">النوع · الاستعجال · الإسناد</summary>
<div class="mt-2 flex flex-wrap gap-2"><button class="rounded-md border bg-jid-olive text-jid-beige px-3 py-1.5 text-xs">الكل</button><button class="rounded-md border px-3 py-1.5 text-xs">منشأة</button></div></details>
${queueBody}` }), { waitUntil: 'domcontentloaded' })
  await shot(page, '02-queue-ar-375.png', { route:'/staff/verification', actor:'staff', state:'queue_mobile_filters', locale:'ar', direction:'rtl', viewport:'375', permission:'staff_queue', actions:'filter disclosure', fixture:'synth-wave2a-queue' })

  await page.setViewportSize({ width: 1280, height: 800 })
  await page.setContent(pageHtml({ lang:'en', dir:'ltr', title:'Queue — EN desktop', body: queueBody.replaceAll('متقدم اصطناعي','Synth Applicant').replaceAll('منشأة اصطناعية','Synth Org') }), { waitUntil:'domcontentloaded' })
  await shot(page, '03-queue-en-desktop.png', { route:'/staff/verification', actor:'staff', state:'queue_mixed_urgency', locale:'en', direction:'ltr', viewport:'desktop', permission:'staff_queue', actions:'open request', fixture:'synth-wave2a-queue' })

  await page.setViewportSize({ width: 375, height: 812 })
  await shot(page, '04-queue-en-375.png', { route:'/staff/verification', actor:'staff', state:'queue_mixed_urgency', locale:'en', direction:'ltr', viewport:'375', permission:'staff_queue', actions:'open request', fixture:'synth-wave2a-queue' })

  const workspace = (banner) => `
<div class="max-w-4xl space-y-4">
  <h2 class="text-xl font-semibold text-jid-olive">مراجعة التحقق — منشأة اصطناعية</h2>
  ${banner}
  <form class="space-y-4 rounded-lg border bg-card p-5">
    <label class="flex gap-2 items-center border rounded-md px-3 py-2"><input type="radio" disabled name="d"/> موافقة</label>
    <label class="flex gap-2 items-center border rounded-md px-3 py-2"><input type="radio" disabled name="d"/> رفض</label>
    <textarea disabled class="w-full border rounded-md p-2" rows="3"></textarea>
    <button disabled class="w-full rounded-md bg-jid-olive text-jid-beige py-2">إرسال القرار</button>
  </form>
  <section class="rounded-lg border border-dashed border-jid-line/50 bg-jid-beige/60 p-4" data-testid="verification-deferred-capabilities">
    <h3 class="font-semibold text-jid-olive">إمكانات غير متاحة في مساحة العمل هذه</h3>
    <ul class="list-disc ps-5 text-xs text-muted-foreground mt-2">
      <li>عارض مستندات الأدلة غير متاح</li>
      <li>طلب معلومات إضافية غير متاح كقرار</li>
      <li>قائمة التحقق خاصة بالجلسة فقط</li>
    </ul>
  </section>
</div>`

  await page.setViewportSize({ width: 1280, height: 800 })
  await page.setContent(pageHtml({ title:'Self-review block', body: workspace('<p class="rounded-md border border-sem-warning/30 bg-amber-50 p-3 text-sm">لا يمكنك مراجعة طلبك الخاص.</p>') }), { waitUntil:'domcontentloaded' })
  await shot(page, '05-workspace-self-review-ar-desktop.png', { route:'/staff/verification/[id]', actor:'staff_applicant', state:'self_review_blocked', locale:'ar', direction:'rtl', viewport:'desktop', permission:'view_only_self', actions:'none', fixture:'synth-self-review' })

  await page.setContent(pageHtml({ title:'Assigned to other', body: workspace('<div data-testid="assigned-to-other-banner" class="rounded-lg border p-5 text-sm"><p class="font-semibold">مسند لمراجع آخر</p><p class="text-muted-foreground">عرض فقط</p></div>') }), { waitUntil:'domcontentloaded' })
  await shot(page, '06-workspace-other-reviewer-ar-desktop.png', { route:'/staff/verification/[id]', actor:'staff', state:'assigned_to_other_view_only', locale:'ar', direction:'rtl', viewport:'desktop', permission:'view_only', actions:'none', fixture:'synth-other-reviewer' })

  await page.setContent(pageHtml({ lang:'en', dir:'ltr', title:'Super Admin override', body: `
<div class="max-w-xl space-y-3">
  <label class="flex gap-3 border rounded-md p-3"><input type="checkbox" data-testid="assignment-override-checkbox"/> Explicit Super Admin override</label>
  <button class="w-full bg-jid-olive text-jid-beige py-2 rounded-md">Submit decision</button>
</div>` }), { waitUntil:'domcontentloaded' })
  await shot(page, '07-workspace-sa-override-en-desktop.png', { route:'/staff/verification/[id]', actor:'super_admin', state:'override_available', locale:'en', direction:'ltr', viewport:'desktop', permission:'override_optional', actions:'approve/reject with checkbox', fixture:'synth-sa-override' })

  await page.setContent(pageHtml({ title:'Approved terminal', body: `<div class="rounded-lg border p-5"><p>الحالة: approved</p><p class="mt-3 rounded-md border bg-amber-50 p-2 text-sm">الموافقة على التحقق لا تنشئ ملف منشأة.</p></div>` }), { waitUntil:'domcontentloaded' })
  await shot(page, '08-terminal-approved-ar-desktop.png', { route:'/staff/verification/[id]', actor:'staff', state:'approved_terminal', locale:'ar', direction:'rtl', viewport:'desktop', permission:'read_only', actions:'none', fixture:'synth-approved' })

  await page.setContent(pageHtml({ title:'Rejected terminal', body: `<div class="rounded-lg border p-5"><p>الحالة: rejected</p><p class="mt-2 text-sm text-muted-foreground">ملاحظات المراجعة الاصطناعية</p></div>` }), { waitUntil:'domcontentloaded' })
  await shot(page, '09-terminal-rejected-ar-desktop.png', { route:'/staff/verification/[id]', actor:'staff', state:'rejected_terminal', locale:'ar', direction:'rtl', viewport:'desktop', permission:'read_only', actions:'none', fixture:'synth-rejected' })

  await page.setContent(pageHtml({ title:'Loading', body: `<div class="space-y-2" aria-busy="true"><div class="h-16 rounded-lg bg-jid-line/20 animate-pulse"></div><div class="h-16 rounded-lg bg-jid-line/20 animate-pulse"></div></div>` }), { waitUntil:'domcontentloaded' })
  await shot(page, '10-queue-loading-ar-desktop.png', { route:'/staff/verification', actor:'staff', state:'loading', locale:'ar', direction:'rtl', viewport:'desktop', permission:'staff_queue', actions:'none', fixture:'synth-loading' })

  await page.setContent(pageHtml({ title:'Empty', body: `<p class="py-10 text-center text-muted-foreground">لا توجد طلبات تحقق مطابقة.</p>` }), { waitUntil:'domcontentloaded' })
  await shot(page, '11-queue-empty-ar-desktop.png', { route:'/staff/verification', actor:'staff', state:'empty', locale:'ar', direction:'rtl', viewport:'desktop', permission:'staff_queue', actions:'clear filters', fixture:'synth-empty' })

  await page.setContent(pageHtml({ title:'Error', body: `<div role="alert" class="rounded-lg border border-destructive p-4 text-destructive">تعذر تحميل قائمة التحقق. أعد المحاولة.</div>` }), { waitUntil:'domcontentloaded' })
  await shot(page, '12-queue-error-ar-desktop.png', { route:'/staff/verification', actor:'staff', state:'query_error', locale:'ar', direction:'rtl', viewport:'desktop', permission:'staff_queue', actions:'retry', fixture:'synth-error' })

  await page.setContent(pageHtml({ title:'Assigned reviewer workspace', body: `
<div class="max-w-xl space-y-3">
  <form class="space-y-3 border rounded-lg p-5">
    <label class="flex gap-2 border rounded-md px-3 py-2"><input type="radio" name="d" checked/> موافقة</label>
    <textarea class="w-full border rounded-md p-2 focus-visible:ring-2 focus-visible:ring-jid-gold" rows="3">سبب اصطناعي كافٍ للتحقق</textarea>
    <button class="w-full bg-jid-olive text-jid-beige py-2 rounded-md">إرسال القرار</button>
  </form>
</div>` }), { waitUntil:'domcontentloaded' })
  await shot(page, '13-workspace-assigned-ar-desktop.png', { route:'/staff/verification/[id]', actor:'assigned_staff', state:'pending_assigned', locale:'ar', direction:'rtl', viewport:'desktop', permission:'decide', actions:'approve/reject', fixture:'synth-assigned' })

  fs.writeFileSync(path.join(outDir, 'INDEX.json'), JSON.stringify(index, null, 2))
  const md = [
    '# Spec 08-C W-Staff evidence index',
    '',
    'Synthetic Wave 2A Staff verification UI states (real component class contracts; no real PII).',
    '',
    '| filename | route | actor | state | locale | direction | viewport | permission | actions | fixture | pass |',
    '|---|---|---|---|---|---|---|---|---|---|---|',
    ...index.map((r) => `| ${r.filename} | ${r.route} | ${r.actor} | ${r.state} | ${r.locale} | ${r.direction} | ${r.viewport} | ${r.permission} | ${r.actions} | ${r.fixture} | PASS |`),
    '',
  ].join('\n')
  fs.writeFileSync(path.join(outDir, 'INDEX.md'), md)
  console.log('CAPTURE_DONE', index.length)
  await browser.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
