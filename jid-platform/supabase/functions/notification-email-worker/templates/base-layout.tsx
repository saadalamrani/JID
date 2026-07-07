/** @jsxImportSource https://esm.sh/react@18.3.1 */
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'https://esm.sh/@react-email/components@0.0.31'
import type { ReactNode } from 'https://esm.sh/react@18.3.1'

const BRAND_OLIVE = '#5c6b4a'
const BRAND_INK = '#1f1f1f'
const BRAND_MUTED = '#6b6b6b'
const BRAND_LINE = '#e5e0d4'
const BRAND_BG = '#F7F5EF'

export type BaseLayoutProps = {
  locale: 'ar' | 'en'
  preview: string
  children: ReactNode
}

export function BaseLayout({ locale, preview, children }: BaseLayoutProps) {
  const dir = locale === 'ar' ? 'rtl' : 'ltr'
  const fontFamily = locale === 'ar' ? 'Tahoma, Arial, sans-serif' : 'Arial, Helvetica, sans-serif'

  return (
    <Html lang={locale} dir={dir}>
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          margin: 0,
          padding: '24px 12px',
          backgroundColor: BRAND_BG,
          fontFamily,
          color: BRAND_INK,
        }}
      >
        <Container
          style={{
            maxWidth: '560px',
            margin: '0 auto',
            backgroundColor: '#ffffff',
            border: `1px solid ${BRAND_LINE}`,
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          <Section style={{ padding: '20px 24px 8px' }}>
            <Text
              style={{
                margin: 0,
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: BRAND_OLIVE,
              }}
            >
              JID
            </Text>
          </Section>
          <Section style={{ padding: '0 24px 24px' }}>{children}</Section>
        </Container>
      </Body>
    </Html>
  )
}

export function EmailHeading({ children }: { children: ReactNode }) {
  return (
    <Text
      style={{
        margin: '0 0 12px',
        fontSize: '22px',
        lineHeight: '1.35',
        fontWeight: 700,
        color: BRAND_INK,
      }}
    >
      {children}
    </Text>
  )
}

export function EmailParagraph({ children }: { children: ReactNode }) {
  return (
    <Text
      style={{
        margin: '0 0 16px',
        fontSize: '15px',
        lineHeight: '1.7',
        color: BRAND_INK,
        whiteSpace: 'pre-wrap',
      }}
    >
      {children}
    </Text>
  )
}

export function EmailMuted({ children }: { children: ReactNode }) {
  return (
    <Text
      style={{
        margin: '0 0 8px',
        fontSize: '12px',
        lineHeight: '1.6',
        color: BRAND_MUTED,
      }}
    >
      {children}
    </Text>
  )
}

export function EmailActionButton({
  href,
  label,
}: {
  href: string
  label: string
  locale?: 'ar' | 'en'
}) {
  return (
    <Section style={{ margin: '0 0 20px' }}>
      <a
        href={href}
        style={{
          display: 'inline-block',
          backgroundColor: BRAND_OLIVE,
          color: '#ffffff',
          textDecoration: 'none',
          padding: '11px 18px',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 600,
        }}
      >
        {label}
      </a>
    </Section>
  )
}

export function EmailFooter({
  locale,
  unsubscribeUrl,
  category,
}: {
  locale: 'ar' | 'en'
  unsubscribeUrl: string
  category: string
}) {
  return (
    <>
      <Hr style={{ borderColor: BRAND_LINE, margin: '16px 0' }} />
      <EmailMuted>
        {locale === 'ar' ? 'نوع الإشعار:' : 'Category:'} {category}
      </EmailMuted>
      <Text style={{ margin: 0, fontSize: '11px', lineHeight: '1.6' }}>
        <a href={unsubscribeUrl} style={{ color: BRAND_OLIVE, textDecoration: 'underline' }}>
          {locale === 'ar' ? 'إدارة تفضيلات الإشعارات' : 'Manage notification preferences'}
        </a>
      </Text>
    </>
  )
}
