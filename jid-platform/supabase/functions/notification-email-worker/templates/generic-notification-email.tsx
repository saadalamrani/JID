/** @jsxImportSource https://esm.sh/react@18.3.1 */
import {
  BaseLayout,
  EmailActionButton,
  EmailFooter,
  EmailHeading,
  EmailParagraph,
} from './base-layout.tsx'

export type GenericNotificationEmailProps = {
  locale: 'ar' | 'en'
  category: string
  title: string
  body: string
  actionUrl?: string | null
  actionLabel?: string | null
  unsubscribeUrl: string
}

export function GenericNotificationEmail({
  locale,
  category,
  title,
  body,
  actionUrl,
  actionLabel,
  unsubscribeUrl,
}: GenericNotificationEmailProps) {
  const cta =
    actionLabel ??
    (locale === 'ar' ? 'عرض التفاصيل' : 'View details')

  return (
    <BaseLayout locale={locale} preview={title}>
      <EmailHeading>{title}</EmailHeading>
      <EmailParagraph>{body}</EmailParagraph>
      {actionUrl ? <EmailActionButton href={actionUrl} label={cta} locale={locale} /> : null}
      <EmailFooter locale={locale} unsubscribeUrl={unsubscribeUrl} category={category} />
    </BaseLayout>
  )
}
