/** @jsxImportSource https://esm.sh/react@18.3.1 */
import { Section, Text } from 'https://esm.sh/@react-email/components@0.0.31'
import {
  BaseLayout,
  EmailActionButton,
  EmailFooter,
  EmailHeading,
  EmailMuted,
  EmailParagraph,
} from './base-layout.tsx'

export type DigestEmailItem = {
  title: string
  body: string
  category: string
  actionUrl?: string | null
}

export type DigestEmailProps = {
  locale: 'ar' | 'en'
  category: string
  title: string
  body: string
  actionUrl?: string | null
  actionLabel?: string | null
  unsubscribeUrl: string
  metadata: Record<string, unknown>
  items: DigestEmailItem[]
}

export function DigestEmail({
  locale,
  category,
  title,
  body,
  actionUrl,
  actionLabel,
  unsubscribeUrl,
  metadata,
  items,
}: DigestEmailProps) {
  const digestDate =
    (typeof metadata.digest_date === 'string' && metadata.digest_date) ||
    new Date().toISOString().slice(0, 10)

  return (
    <BaseLayout locale={locale} preview={title}>
      <EmailHeading>{title}</EmailHeading>
      <EmailMuted>
        {locale === 'ar' ? 'ملخص يوم' : 'Daily digest for'} {digestDate}
      </EmailMuted>
      <EmailParagraph>{body}</EmailParagraph>

      {items.map((item, index) => (
        <Section
          key={`${item.category}-${index}`}
          style={{
            marginBottom: '12px',
            padding: '12px 14px',
            backgroundColor: '#f7f5ef',
            borderRadius: '8px',
            border: '1px solid #e5e0d4',
          }}
        >
          <Text style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 700, color: '#1f1f1f' }}>
            {item.title}
          </Text>
          <Text style={{ margin: 0, fontSize: '13px', lineHeight: '1.6', color: '#4a4a4a' }}>
            {item.body}
          </Text>
          {item.actionUrl ? (
            <Text style={{ margin: '8px 0 0', fontSize: '12px' }}>
              <a href={item.actionUrl} style={{ color: '#5c6b4a', textDecoration: 'underline' }}>
                {locale === 'ar' ? 'عرض' : 'View'}
              </a>
            </Text>
          ) : null}
        </Section>
      ))}

      {actionUrl ? (
        <EmailActionButton
          href={actionUrl}
          label={actionLabel ?? (locale === 'ar' ? 'عرض كل الإشعارات' : 'View all notifications')}
          locale={locale}
        />
      ) : null}
      <EmailFooter locale={locale} unsubscribeUrl={unsubscribeUrl} category={category} />
    </BaseLayout>
  )
}
