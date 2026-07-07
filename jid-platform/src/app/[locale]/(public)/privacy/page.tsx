import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { LegalDocument } from '@/app/[locale]/(public)/_components/legal-document'
import { localeConfig, type Locale } from '@/lib/i18n/config'
import { Link } from '@/lib/i18n/navigation'
import { LEGAL_DOCUMENT_VERSION, LEGAL_EFFECTIVE_DATE } from '@/lib/legal/constants'
import { formatLegalEffectiveDate } from '@/lib/legal/format-effective-date'

type PrivacyPageProps = {
  params: { locale: string }
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('privacyPage.meta')
  return {
    title: t('title'),
    description: t('description'),
  }
}

/** Section 8 — Privacy Policy (server-rendered). */
export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const locale = params.locale as Locale
  const dir = localeConfig.direction[locale] ?? 'rtl'
  const t = await getTranslations('privacyPage')
  const effectiveDate = formatLegalEffectiveDate(LEGAL_EFFECTIVE_DATE, locale)

  return (
    <LegalDocument
      title={t('title')}
      summary={t('summary')}
      versionLabel={t('versionLabel', { version: LEGAL_DOCUMENT_VERSION })}
      effectiveDateLabel={t('effectiveDateLabel', { date: effectiveDate })}
      dir={dir}
      lang={locale}
    >
      <p>{t('intro.p1')}</p>
      <p>{t('intro.p2')}</p>

      <h2>{t('collect.title')}</h2>
      <p>{t('collect.intro')}</p>
      <ul>
        <li>
          <strong>{t('collect.items.account.label')}</strong> — {t('collect.items.account.body')}
        </li>
        <li>
          <strong>{t('collect.items.profile.label')}</strong> — {t('collect.items.profile.body')}
        </li>
        <li>
          <strong>{t('collect.items.applications.label')}</strong> —{' '}
          {t('collect.items.applications.body')}
        </li>
        <li>
          <strong>{t('collect.items.mentorship.label')}</strong> —{' '}
          {t('collect.items.mentorship.body')}
        </li>
        <li>
          <strong>{t('collect.items.entity.label')}</strong> — {t('collect.items.entity.body')}
        </li>
        <li>
          <strong>{t('collect.items.technical.label')}</strong> —{' '}
          {t('collect.items.technical.body')}
        </li>
        <li>
          <strong>{t('collect.items.communications.label')}</strong> —{' '}
          {t('collect.items.communications.body')}
        </li>
      </ul>

      <h2>{t('use.title')}</h2>
      <p>{t('use.intro')}</p>
      <ul>
        <li>{t('use.items.service')}</li>
        <li>{t('use.items.matching')}</li>
        <li>{t('use.items.notifications')}</li>
        <li>{t('use.items.security')}</li>
        <li>{t('use.items.analytics')}</li>
        <li>{t('use.items.legal')}</li>
      </ul>
      <p>{t('use.legalBasis')}</p>

      <h2>{t('sharing.title')}</h2>
      <p>{t('sharing.intro')}</p>
      <h3>{t('sharing.supabase.title')}</h3>
      <p>{t('sharing.supabase.body')}</p>
      <h3>{t('sharing.resend.title')}</h3>
      <p>{t('sharing.resend.body')}</p>
      <h3>{t('sharing.other.title')}</h3>
      <p>{t('sharing.other.body')}</p>
      <p>{t('sharing.noSale')}</p>

      <h2>{t('rights.title')}</h2>
      <p>
        {t.rich('rights.body', {
          pdplLink: (chunks) => <Link href="/pdpl">{chunks}</Link>,
        })}
      </p>
      <ul>
        <li>{t('rights.items.access')}</li>
        <li>{t('rights.items.rectification')}</li>
        <li>{t('rights.items.erasure')}</li>
        <li>{t('rights.items.portability')}</li>
        <li>{t('rights.items.withdraw')}</li>
        <li>{t('rights.items.complaint')}</li>
      </ul>

      <h2>{t('retention.title')}</h2>
      <p>{t('retention.intro')}</p>
      <ul>
        <li>
          <strong>{t('retention.items.account.label')}</strong> —{' '}
          {t('retention.items.account.body')}
        </li>
        <li>
          <strong>{t('retention.items.applications.label')}</strong> —{' '}
          {t('retention.items.applications.body')}
        </li>
        <li>
          <strong>{t('retention.items.logs.label')}</strong> — {t('retention.items.logs.body')}
        </li>
        <li>
          <strong>{t('retention.items.marketing.label')}</strong> —{' '}
          {t('retention.items.marketing.body')}
        </li>
      </ul>
      <p>{t('retention.deletion')}</p>

      <h2>{t('security.title')}</h2>
      <p>{t('security.intro')}</p>
      <ul>
        <li>{t('security.items.encryption')}</li>
        <li>{t('security.items.rls')}</li>
        <li>{t('security.items.rbac')}</li>
        <li>{t('security.items.sessions')}</li>
        <li>{t('security.items.monitoring')}</li>
      </ul>
      <p>{t('security.disclaimer')}</p>

      <h2>{t('amendments.title')}</h2>
      <p>{t('amendments.p1')}</p>
      <p>{t('amendments.p2')}</p>

      <h2>{t('contact.title')}</h2>
      <p>
        {t.rich('contact.body', {
          contactLink: (chunks) => <Link href="/contact">{chunks}</Link>,
        })}
      </p>
      <p>{t('contact.response')}</p>
    </LegalDocument>
  )
}
