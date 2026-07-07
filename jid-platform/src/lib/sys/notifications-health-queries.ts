import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'

export type EmailQuotaStatus = {
  daily_limit: number
  sent_today: number
  remaining: number
  monthly_limit: number
  sent_this_month: number
  monthly_remaining: number
  circuit_open: boolean
}

export type SysEmailSendLogRow = {
  id: string
  notification_id: string | null
  recipient_id: string
  recipient_email: string
  category: string | null
  status: string
  provider_message_id: string | null
  error_message: string | null
  attempted_at: string | null
  sent_at: string | null
  created_at: string
}

export type SysEmailBounceRow = {
  id: string
  email: string
  bounce_type: string
  first_bounced_at: string
  last_bounced_at: string
  bounce_count: number
}

export type SysNotificationsHealthSnapshot = {
  quota: EmailQuotaStatus
  logs: SysEmailSendLogRow[]
  bounces: SysEmailBounceRow[]
}

const DEFAULT_QUOTA: EmailQuotaStatus = {
  daily_limit: 5000,
  sent_today: 0,
  remaining: 5000,
  monthly_limit: 120000,
  sent_this_month: 0,
  monthly_remaining: 120000,
  circuit_open: false,
}

export async function fetchNotificationsHealthSnapshot(): Promise<SysNotificationsHealthSnapshot> {
  const admin = createAdminClient()

  const [quotaResult, logsResult, bouncesResult] = await Promise.all([
    admin.rpc('email_quota_status'),
    admin
      .from('email_send_log')
      .select(
        'id, notification_id, recipient_id, recipient_email, category, status, provider_message_id, error_message, attempted_at, sent_at, created_at',
      )
      .order('created_at', { ascending: false })
      .limit(100),
    admin
      .from('email_bounces')
      .select('id, email, bounce_type, first_bounced_at, last_bounced_at, bounce_count')
      .order('last_bounced_at', { ascending: false })
      .limit(50),
  ])

  const quotaRow = (quotaResult.data ?? [])[0] as EmailQuotaStatus | undefined

  if (quotaResult.error) {
    console.warn('email_quota_status failed:', quotaResult.error.message)
  }

  if (logsResult.error) {
    console.warn('email_send_log fetch failed:', logsResult.error.message)
  }

  if (bouncesResult.error) {
    console.warn('email_bounces fetch failed:', bouncesResult.error.message)
  }

  return {
    quota: quotaRow ?? DEFAULT_QUOTA,
    logs: logsResult.error ? [] : ((logsResult.data ?? []) as SysEmailSendLogRow[]),
    bounces: bouncesResult.error ? [] : ((bouncesResult.data ?? []) as SysEmailBounceRow[]),
  }
}
