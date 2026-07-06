/**
 * Section 7.4 — transactional email templates (Arabic SSOT).
 * Edge functions mirror these strings in supabase/functions/_shared/email-templates.ts
 */

export const DEFAULT_REJECTION_TEMPLATE_AR = `مرحباً {applicant_name}،

نشكرك على تقديمك لفرصة «{job_title}» لدى {company_name}.

بعد مراجعة طلبك، نأسف لإبلاغك بعدم قبول طلبك في هذه المرحلة.

يمكنك متابعة فرص أخرى على منصة جِد.

مع أطيب التمنيات،
{company_name}`

export const DEFAULT_EXPIRY_TEMPLATE_AR = `مرحباً {applicant_name}،

انتهت مدة متابعة طلبك لفرصة «{job_title}» لدى {company_name} دون رد من الجهة خلال المدة المحددة.

لا يزال بإمكانك التقديم على فرص أخرى عبر منصة جِد.

فريق جِد`

export type EmailTemplateVars = {
  applicant_name: string
  job_title: string
  company_name: string
}

export function renderEmailTemplate(
  template: string,
  vars: EmailTemplateVars,
): string {
  return template
    .replaceAll('{applicant_name}', vars.applicant_name)
    .replaceAll('{job_title}', vars.job_title)
    .replaceAll('{company_name}', vars.company_name)
}

export function renderRejectionEmailHtml(vars: EmailTemplateVars): string {
  const body = renderEmailTemplate(DEFAULT_REJECTION_TEMPLATE_AR, vars)
  const paragraphs = body.split('\n\n').map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
  return `<div dir="rtl" style="font-family: sans-serif; line-height: 1.6;">${paragraphs.join('')}</div>`
}

export function renderExpiryEmailHtml(vars: EmailTemplateVars): string {
  const body = renderEmailTemplate(DEFAULT_EXPIRY_TEMPLATE_AR, vars)
  const paragraphs = body.split('\n\n').map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
  return `<div dir="rtl" style="font-family: sans-serif; line-height: 1.6;">${paragraphs.join('')}</div>`
}

export const REJECTION_EMAIL_SUBJECT_AR = 'تحديث على طلبك — جِد'
export const EXPIRY_EMAIL_SUBJECT_AR = 'انتهت مدة متابعة طلبك — جِد'
