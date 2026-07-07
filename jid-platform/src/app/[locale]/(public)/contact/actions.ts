'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import {
  assertContactRateLimit,
  ContactRateLimitError,
} from '@/lib/contact/rate-limit'
import { getRequestIp } from '@/lib/contact/request-ip'
import {
  contactFormSchema,
  formatContactSubject,
  type ContactFormValues,
} from '@/lib/contact/schema'
import type { Locale } from '@/lib/i18n/config'

export type SubmitContactMessageResult =
  | { ok: true }
  | {
      ok: false
      code: 'validation' | 'rate_limited' | 'server'
      message: string
      fieldErrors?: Partial<Record<keyof ContactFormValues, string>>
    }

/** Section 9.2 — validate, rate-limit (3/hour/IP), persist via service role. */
export async function submitContactMessage(
  locale: Locale,
  input: ContactFormValues,
): Promise<SubmitContactMessageResult> {
  const parsed = contactFormSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors: Partial<Record<keyof ContactFormValues, string>> = {}
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]
      if (typeof field === 'string' && !fieldErrors[field as keyof ContactFormValues]) {
        fieldErrors[field as keyof ContactFormValues] = issue.message
      }
    }
    const message = parsed.error.issues[0]?.message ?? 'contactPage.errors.validation'
    return { ok: false, code: 'validation', message, fieldErrors }
  }

  try {
    const ip = await getRequestIp()
    await assertContactRateLimit(ip)
  } catch (error) {
    if (error instanceof ContactRateLimitError) {
      return { ok: false, code: 'rate_limited', message: error.message }
    }
    const message = error instanceof Error ? error.message : 'contactPage.errors.server'
    return { ok: false, code: 'server', message }
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const admin = createAdminClient()
    const values = parsed.data

    const { error } = await admin.from('contact_messages').insert({
      user_id: user?.id ?? null,
      full_name: values.full_name,
      email: values.email.toLowerCase(),
      subject: formatContactSubject(values.category, values.subject),
      body: values.body,
      source: 'contact_page',
      locale,
    })

    if (error) {
      return { ok: false, code: 'server', message: 'contactPage.errors.server' }
    }

    return { ok: true }
  } catch {
    return { ok: false, code: 'server', message: 'contactPage.errors.server' }
  }
}
