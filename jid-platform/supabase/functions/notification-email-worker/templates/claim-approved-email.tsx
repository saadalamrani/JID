/** @jsxImportSource https://esm.sh/react@18.3.1 */
import {
  BaseLayout,
  EmailActionButton,
  EmailFooter,
  EmailHeading,
  EmailMuted,
  EmailParagraph,
} from './base-layout.tsx'

export type ClaimApprovedEmailProps = {
  locale: 'ar' | 'en'
  category: string
  title: string
  body: string
  actionUrl?: string | null
  actionLabel?: string | null
  unsubscribeUrl: string
  metadata: Record<string, unknown>
}

export function ClaimApprovedEmail({
  locale,
  category,
  title,
  body,
  actionUrl,
  actionLabel,
  unsubscribeUrl,
  metadata,
}: ClaimApprovedEmailProps) {
  const companyName =
    (typeof metadata.company_name === 'string' && metadata.company_name) ||
    (locale === 'ar' ? 'شركتك' : 'your company')

  return (
    <BaseLayout locale={locale} preview={title}>
      <EmailHeading>{title}</EmailHeading>
      <EmailMuted>
        {locale === 'ar' ? 'تمت الموافقة على مطالبة:' : 'Claim approved for:'} {companyName}
      </EmailMuted>
      <EmailParagraph>{body}</EmailParagraph>
      {actionUrl ? (
        <EmailActionButton
          href={actionUrl}
          label={actionLabel ?? (locale === 'ar' ? 'إدارة الشركة' : 'Manage company')}
          locale={locale}
        />
      ) : null}
      <EmailFooter locale={locale} unsubscribeUrl={unsubscribeUrl} category={category} />
    </BaseLayout>
  )
}
