/** @jsxImportSource https://esm.sh/react@18.3.1 */
import {
  BaseLayout,
  EmailActionButton,
  EmailFooter,
  EmailHeading,
  EmailMuted,
  EmailParagraph,
} from './base-layout.tsx'

export type RadarStatusEmailProps = {
  locale: 'ar' | 'en'
  category: string
  title: string
  body: string
  actionUrl?: string | null
  actionLabel?: string | null
  unsubscribeUrl: string
  metadata: Record<string, unknown>
}

function metaString(metadata: Record<string, unknown>, key: string): string | null {
  const value = metadata[key]
  return typeof value === 'string' && value.trim() ? value : null
}

export function RadarStatusEmail({
  locale,
  category,
  title,
  body,
  actionUrl,
  actionLabel,
  unsubscribeUrl,
  metadata,
}: RadarStatusEmailProps) {
  const oldStatus = metaString(metadata, 'old_status')
  const newStatus = metaString(metadata, 'new_status')

  return (
    <BaseLayout locale={locale} preview={title}>
      <EmailHeading>{title}</EmailHeading>
      {oldStatus && newStatus ? (
        <EmailMuted>
          {locale === 'ar' ? 'الحالة:' : 'Status:'} {oldStatus} → {newStatus}
        </EmailMuted>
      ) : null}
      <EmailParagraph>{body}</EmailParagraph>
      {actionUrl ? (
        <EmailActionButton
          href={actionUrl}
          label={actionLabel ?? (locale === 'ar' ? 'فتح الرادار' : 'Open Radar')}
          locale={locale}
        />
      ) : null}
      <EmailFooter locale={locale} unsubscribeUrl={unsubscribeUrl} category={category} />
    </BaseLayout>
  )
}
