import { renderNotificationEmailTemplate } from '../notification-email-worker/templates/render.ts'
import type { DigestEmailItem } from '../notification-email-worker/templates/render.ts'
import { sendResendEmailWithMeta } from '../resend-client.ts'
import { createServiceClient } from '../supabase.ts'

export type NotificationRow = {
  id: string
  recipient_id: string
  category: string
  priority: string
  title_ar: string
  title_en: string
  body_ar: string
  body_en: string
  action_url: string | null
  action_label_ar: string | null
  action_label_en: string | null
  delivered_via_email: boolean
  email_sent_at: string | null
  email_message_id: string | null
  metadata: Record<string, unknown>
}

export type ProcessNotificationResult = {
  notification_id: string
  status: 'sent' | 'skipped_prefs' | 'skipped_bounced' | 'skipped_duplicate' | 'failed'
  message_id?: string | null
  error?: string
}

type PreferenceRow = {
  in_app_enabled: boolean
  email_enabled: boolean
  include_in_digest: boolean
  is_mandatory: boolean
}

function siteUrl(): string {
  return (Deno.env.get('NEXT_PUBLIC_SITE_URL') ?? Deno.env.get('SITE_URL') ?? 'https://jid.sa').replace(
    /\/$/,
    '',
  )
}

function absoluteActionUrl(actionUrl: string | null): string | null {
  if (!actionUrl?.trim()) return null
  if (actionUrl.startsWith('http://') || actionUrl.startsWith('https://')) return actionUrl
  return `${siteUrl()}${actionUrl.startsWith('/') ? actionUrl : `/${actionUrl}`}`
}

async function resolveRecipientEmail(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
): Promise<string | null> {
  const { data: verified } = await supabase
    .from('user_verified_emails')
    .select('email')
    .eq('user_id', userId)
    .eq('is_primary', true)
    .maybeSingle()

  if (verified?.email?.trim()) {
    return verified.email.trim().toLowerCase()
  }

  const { data: authData, error } = await supabase.auth.admin.getUserById(userId)
  if (error) {
    console.warn('auth.admin.getUserById failed', { userId, error: error.message })
    return null
  }

  return authData.user?.email?.trim().toLowerCase() ?? null
}

async function writeSendLog(
  supabase: ReturnType<typeof createServiceClient>,
  input: {
    notification_id: string
    recipient_id: string
    recipient_email: string
    category: string
    status: string
    provider_message_id?: string | null
    error_message?: string | null
    metadata?: Record<string, unknown>
  },
) {
  const now = new Date().toISOString()
  const { error } = await supabase.from('email_send_log').insert({
    notification_id: input.notification_id,
    recipient_id: input.recipient_id,
    recipient_email: input.recipient_email,
    category: input.category,
    status: input.status,
    provider_message_id: input.provider_message_id ?? null,
    error_message: input.error_message ?? null,
    attempted_at: now,
    sent_at: input.status === 'sent' ? now : null,
    metadata: input.metadata ?? {},
  })

  if (error) {
    console.error('email_send_log insert failed', { notification_id: input.notification_id, error })
  }
}

export async function processNotificationEmail(
  supabase: ReturnType<typeof createServiceClient>,
  notificationId: string,
): Promise<ProcessNotificationResult> {
  const { data: notification, error } = await supabase
    .from('notifications')
    .select(
      'id, recipient_id, category, priority, title_ar, title_en, body_ar, body_en, action_url, action_label_ar, action_label_en, delivered_via_email, email_sent_at, email_message_id, metadata',
    )
    .eq('id', notificationId)
    .maybeSingle()

  if (error || !notification) {
    return {
      notification_id: notificationId,
      status: 'failed',
      error: error?.message ?? 'Notification not found',
    }
  }

  const row = notification as NotificationRow

  if (row.delivered_via_email || row.email_sent_at || row.email_message_id) {
    console.info('notification-email-worker: duplicate skipped', { notification_id: notificationId })
    return { notification_id: notificationId, status: 'skipped_duplicate' }
  }

  const { data: prefRows, error: prefError } = await supabase.rpc('get_notification_preference', {
    p_user_id: row.recipient_id,
    p_category: row.category,
  })

  if (prefError) {
    return {
      notification_id: notificationId,
      status: 'failed',
      error: prefError.message,
    }
  }

  const preference = ((prefRows ?? [])[0] ?? null) as PreferenceRow | null
  if (!preference) {
    return {
      notification_id: notificationId,
      status: 'failed',
      error: 'Preference resolution failed',
    }
  }

  const emailAllowed = preference.is_mandatory || preference.email_enabled
  const isDigestParent = row.category === 'digest.daily_summary'

  if (!isDigestParent && (!emailAllowed || preference.include_in_digest)) {
    const recipientEmail = (await resolveRecipientEmail(supabase, row.recipient_id)) ?? 'unknown@invalid.local'
    await writeSendLog(supabase, {
      notification_id: row.id,
      recipient_id: row.recipient_id,
      recipient_email: recipientEmail,
      category: row.category,
      status: 'skipped_prefs',
      metadata: {
        include_in_digest: preference.include_in_digest,
        email_enabled: preference.email_enabled,
        is_mandatory: preference.is_mandatory,
      },
    })
    console.info('notification-email-worker: skipped_prefs', {
      notification_id: notificationId,
      category: row.category,
    })
    return { notification_id: notificationId, status: 'skipped_prefs' }
  }

  const recipientEmail = await resolveRecipientEmail(supabase, row.recipient_id)
  if (!recipientEmail) {
    return {
      notification_id: notificationId,
      status: 'failed',
      error: 'No recipient email',
    }
  }

  const { data: bounce } = await supabase
    .from('email_bounces')
    .select('email')
    .eq('email', recipientEmail)
    .maybeSingle()

  if (bounce) {
    await writeSendLog(supabase, {
      notification_id: row.id,
      recipient_id: row.recipient_id,
      recipient_email: recipientEmail,
      category: row.category,
      status: 'skipped_bounced',
      metadata: { reason: 'email_bounces' },
    })
    console.warn('notification-email-worker: skipped_bounced', {
      notification_id: notificationId,
      email: recipientEmail,
    })
    return { notification_id: notificationId, status: 'skipped_bounced' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('locale')
    .eq('id', row.recipient_id)
    .maybeSingle()

  const locale = profile?.locale === 'en' ? 'en' : 'ar'
  const title = locale === 'ar' ? row.title_ar : row.title_en
  const body = locale === 'ar' ? row.body_ar : row.body_en
  const actionLabel = locale === 'ar' ? row.action_label_ar : row.action_label_en
  const unsubscribeUrl = `${siteUrl()}/${locale}/settings/notifications`
  const actionUrl = absoluteActionUrl(row.action_url)
  const metadata =
    row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
      ? row.metadata
      : {}

  let digestItems: DigestEmailItem[] = []
  if (isDigestParent) {
    digestItems = await loadDigestItems(supabase, row, locale)
  }

  try {
    const html = await renderNotificationEmailTemplate({
      locale,
      category: row.category,
      title,
      body,
      actionUrl,
      actionLabel,
      unsubscribeUrl,
      metadata,
      digestItems,
    })

    const sendResult = await sendResendEmailWithMeta({
      to: recipientEmail,
      subject: title,
      html,
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
      tags: [
        { name: 'notification_id', value: row.id },
        { name: 'category', value: row.category },
        { name: 'priority', value: row.priority },
      ],
    })

    if (sendResult.skipped) {
      return {
        notification_id: notificationId,
        status: 'failed',
        error: 'Resend not configured',
      }
    }

    const sentAt = new Date().toISOString()
    const { error: updateError } = await supabase
      .from('notifications')
      .update({
        delivered_via_email: true,
        email_sent_at: sentAt,
        email_message_id: sendResult.id,
      })
      .eq('id', row.id)

    if (updateError) {
      throw new Error(updateError.message)
    }

    if (isDigestParent) {
      const batchId =
        (typeof metadata.digest_batch_id === 'string' && metadata.digest_batch_id) ||
        null
      if (batchId) {
        await supabase
          .from('notifications')
          .update({
            delivered_via_email: true,
            email_sent_at: sentAt,
          })
          .eq('included_in_digest_id', batchId)

        await supabase
          .from('digest_batches')
          .update({ status: 'sent', sent_at: sentAt })
          .eq('id', batchId)
      }
    }

    await writeSendLog(supabase, {
      notification_id: row.id,
      recipient_id: row.recipient_id,
      recipient_email: recipientEmail,
      category: row.category,
      status: 'sent',
      provider_message_id: sendResult.id,
      metadata: { locale, priority: row.priority },
    })

    console.info('notification-email-worker: sent', {
      notification_id: notificationId,
      message_id: sendResult.id,
      to: recipientEmail,
    })

    return {
      notification_id: notificationId,
      status: 'sent',
      message_id: sendResult.id,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Send failed'
    await writeSendLog(supabase, {
      notification_id: row.id,
      recipient_id: row.recipient_id,
      recipient_email: recipientEmail,
      category: row.category,
      status: 'failed',
      error_message: message,
    })
    console.error('notification-email-worker: send failed', {
      notification_id: notificationId,
      error: message,
    })
    return {
      notification_id: notificationId,
      status: 'failed',
      error: message,
    }
  }
}

export async function fetchPendingNotificationIds(
  supabase: ReturnType<typeof createServiceClient>,
  limit = 25,
): Promise<string[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('id')
    .eq('delivered_via_email', false)
    .is('email_sent_at', null)
    .is('archived_at', null)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map((row) => row.id as string)
}

async function loadDigestItems(
  supabase: ReturnType<typeof createServiceClient>,
  parent: NotificationRow,
  locale: 'ar' | 'en',
): Promise<DigestEmailItem[]> {
  const metadata = parent.metadata ?? {}
  const batchId =
    (typeof metadata.digest_batch_id === 'string' && metadata.digest_batch_id) || null

  let query = supabase
    .from('notifications')
    .select('title_ar, title_en, body_ar, body_en, action_url, category')
    .eq('recipient_id', parent.recipient_id)
    .neq('id', parent.id)
    .order('created_at', { ascending: false })
    .limit(25)

  if (batchId) {
    query = query.eq('included_in_digest_id', batchId)
  }

  const { data, error } = await query
  if (error || !data) {
    console.warn('digest items load failed', { parent_id: parent.id, error: error?.message })
    return []
  }

  return data.map((item) => ({
    title: locale === 'ar' ? item.title_ar : item.title_en,
    body: locale === 'ar' ? item.body_ar : item.body_en,
    category: item.category as string,
    actionUrl: absoluteActionUrl(item.action_url),
  }))
}
