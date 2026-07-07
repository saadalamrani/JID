/** @jsxImportSource https://esm.sh/react@18.3.1 */
import * as React from 'https://esm.sh/react@18.3.1'

export type NotificationEmailProps = {
  locale: 'ar' | 'en'
  title: string
  body: string
  actionUrl?: string | null
  actionLabel?: string | null
  category: string
  unsubscribeUrl: string
}

export function NotificationEmail({
  locale,
  title,
  body,
  actionUrl,
  actionLabel,
  category,
  unsubscribeUrl,
}: NotificationEmailProps) {
  const dir = locale === 'ar' ? 'rtl' : 'ltr'
  const fontFamily = locale === 'ar' ? 'Tahoma, Arial, sans-serif' : 'Arial, sans-serif'

  return (
    <html lang={locale} dir={dir}>
      <body
        style={{
          margin: 0,
          padding: '24px',
          backgroundColor: '#f7f4ee',
          fontFamily,
          color: '#1f1f1f',
        }}
      >
        <table
          role="presentation"
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          style={{ maxWidth: '560px', margin: '0 auto' }}
        >
          <tbody>
            <tr>
              <td
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e0d4',
                  borderRadius: '12px',
                  padding: '24px',
                }}
              >
                <p
                  style={{
                    margin: '0 0 8px',
                    fontSize: '12px',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    color: '#5c6b4a',
                  }}
                >
                  JID
                </p>
                <h1 style={{ margin: '0 0 12px', fontSize: '20px', lineHeight: 1.4 }}>{title}</h1>
                <p style={{ margin: '0 0 16px', fontSize: '15px', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {body}
                </p>
                {actionUrl && actionLabel ? (
                  <p style={{ margin: '0 0 20px' }}>
                    <a
                      href={actionUrl}
                      style={{
                        display: 'inline-block',
                        backgroundColor: '#5c6b4a',
                        color: '#ffffff',
                        textDecoration: 'none',
                        padding: '10px 16px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: 600,
                      }}
                    >
                      {actionLabel}
                    </a>
                  </p>
                ) : null}
                <p style={{ margin: 0, fontSize: '12px', color: '#6b6b6b' }}>
                  {locale === 'ar' ? 'نوع الإشعار:' : 'Category:'} {category}
                </p>
              </td>
            </tr>
            <tr>
              <td style={{ padding: '16px 8px 0', fontSize: '11px', color: '#8a8a8a', lineHeight: 1.6 }}>
                <a href={unsubscribeUrl} style={{ color: '#5c6b4a' }}>
                  {locale === 'ar' ? 'إدارة تفضيلات الإشعارات' : 'Manage notification preferences'}
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  )
}
