/**
 * Smart Communication constants (Prompt 4) — Arabic SSOT.
 */

/** Spec-locked verbatim — founder sign-off required before any change. */
export const AUTO_REPLY_DISCLAIMER_AR =
  'إخلاء مسؤولية: هذه الجهة غير مفعلة لميزة الرد التلقائي لدينا'

export const COMM_UNDO_WINDOW_MINUTES = 15

export const COMM_KINDS = [
  'received_ack',
  'shortlisted',
  'interview_invite',
  'acceptance',
  'rejection',
  'holding_update',
] as const

export type CommKind = (typeof COMM_KINDS)[number]

export const COMM_KIND_LABELS_AR: Record<CommKind, string> = {
  received_ack: 'تأكيد الاستلام',
  shortlisted: 'القائمة المختصرة',
  interview_invite: 'دعوة مقابلة',
  acceptance: 'قبول',
  rejection: 'اعتذار',
  holding_update: 'تحديث انتظار',
}

export type CommTemplateVars = {
  candidate_name: string
  job_title: string
  company_name: string
  next_step?: string
  timeline?: string
}

export const DEFAULT_COMM_TEMPLATES_AR: Record<
  Exclude<CommKind, 'received_ack'>,
  { subject: string; body: string; isLocked: boolean }
> = {
  shortlisted: {
    subject: 'تحديث على طلبك — جِد',
    body: `مرحباً {candidate_name}،

يسرّنا إبلاغك بأن طلبك لفرصة «{job_title}» لدى {company_name} أصبح ضمن القائمة المختصرة.

سنتواصل معك قريباً بشأن الخطوات التالية.

مع أطيب التمنيات،
{company_name}`,
    isLocked: false,
  },
  interview_invite: {
    subject: 'دعوة مقابلة — جِد',
    body: `مرحباً {candidate_name}،

نودّ دعوتك لمقابلة بخصوص فرصة «{job_title}» لدى {company_name}.

الخطوة التالية: {next_step}
الجدول الزمني: {timeline}

نتطلع للقائك.

{company_name}`,
    isLocked: false,
  },
  acceptance: {
    subject: 'تهانينا — جِد',
    body: `مرحباً {candidate_name}،

يسعدنا إبلاغك بقبولك لفرصة «{job_title}» لدى {company_name}.

سيتواصل معك فريقنا قريباً لاستكمال الإجراءات.

مع التهاني،
{company_name}`,
    isLocked: false,
  },
  rejection: {
    subject: 'تحديث على طلبك — جِد',
    body: `مرحباً {candidate_name}،

نشكرك على تقديمك لفرصة «{job_title}» لدى {company_name}.

بعد مراجعة طلبك، نأسف لإبلاغك بعدم قبول طلبك في هذه المرحلة.

يمكنك متابعة فرص أخرى على منصة جِد.

مع أطيب التمنيات،
{company_name}`,
    isLocked: true,
  },
  holding_update: {
    subject: 'تحديث على طلبك — جِد',
    body: `مرحباً {candidate_name}،

نودّ إبلاغك بأن طلبك لفرصة «{job_title}» لدى {company_name} لا يزال قيد المراجعة.

نقدّر صبرك وسنوافيك بأي مستجدات.

{company_name}`,
    isLocked: false,
  },
}

export function renderCommTemplate(
  template: string,
  vars: CommTemplateVars,
): string {
  return template
    .replaceAll('{candidate_name}', vars.candidate_name)
    .replaceAll('{job_title}', vars.job_title)
    .replaceAll('{company_name}', vars.company_name)
    .replaceAll('{next_step}', vars.next_step ?? '—')
    .replaceAll('{timeline}', vars.timeline ?? '—')
    .replaceAll('{applicant_name}', vars.candidate_name)
}

export function renderCommEmailHtml(body: string): string {
  const paragraphs = body
    .split('\n\n')
    .map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
  return `<div dir="rtl" style="font-family: sans-serif; line-height: 1.6;">${paragraphs.join('')}</div>`
}
