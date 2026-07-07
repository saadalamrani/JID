/** @jsxImportSource https://esm.sh/react@18.3.1 */
import { render } from 'https://esm.sh/@react-email/render@1.0.5'
import { ClaimApprovedEmail } from './claim-approved-email.tsx'
import { DigestEmail, type DigestEmailItem } from './digest-email.tsx'
import { GenericNotificationEmail } from './generic-notification-email.tsx'
import { RadarStatusEmail } from './radar-status-email.tsx'

export type NotificationEmailRenderInput = {
  locale: 'ar' | 'en'
  category: string
  title: string
  body: string
  actionUrl?: string | null
  actionLabel?: string | null
  unsubscribeUrl: string
  metadata?: Record<string, unknown>
  digestItems?: DigestEmailItem[]
}

const CLAIM_CATEGORIES = new Set(['claim.approved', 'claim.rejected', 'claim.needs_more_info'])

/**
 * Section 7.6 — category-aware React Email router.
 * Falls back to GenericNotificationEmail for unmapped categories.
 */
export async function renderNotificationEmailTemplate(
  input: NotificationEmailRenderInput,
): Promise<string> {
  const metadata = input.metadata ?? {}
  const common = {
    locale: input.locale,
    category: input.category,
    title: input.title,
    body: input.body,
    actionUrl: input.actionUrl,
    actionLabel: input.actionLabel,
    unsubscribeUrl: input.unsubscribeUrl,
    metadata,
  }

  if (input.category === 'digest.daily_summary') {
    return await render(
      <DigestEmail {...common} items={input.digestItems ?? []} />,
    )
  }

  if (input.category === 'claim.approved') {
    return await render(<ClaimApprovedEmail {...common} />)
  }

  if (CLAIM_CATEGORIES.has(input.category) && input.category !== 'claim.approved') {
    return await render(<GenericNotificationEmail {...common} />)
  }

  if (input.category === 'job.application_status_changed') {
    return await render(<RadarStatusEmail {...common} />)
  }

  return await render(<GenericNotificationEmail {...common} />)
}

export type { DigestEmailItem }
