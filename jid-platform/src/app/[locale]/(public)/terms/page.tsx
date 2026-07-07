import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { LegalDocument } from '@/app/[locale]/(public)/_components/legal-document'
import { localeConfig, type Locale } from '@/lib/i18n/config'
import { Link } from '@/lib/i18n/navigation'
import { LEGAL_DOCUMENT_VERSION, LEGAL_EFFECTIVE_DATE } from '@/lib/legal/constants'
import { formatLegalEffectiveDate } from '@/lib/legal/format-effective-date'
import { trackLegalPageViewed } from '@/lib/analytics/track-legal-page'

type TermsPageProps = {
  params: { locale: string }
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('termsPage.meta')
  return {
    title: t('title'),
    description: t('description'),
  }
}

/** Section 8 — Terms of Service (server-rendered). */
export default async function TermsPage({ params }: TermsPageProps) {
  await trackLegalPageViewed('terms')
  const locale = params.locale as Locale
  const dir = localeConfig.direction[locale] ?? 'rtl'
  const t = await getTranslations('termsPage')
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

      <h2>{t('acceptance.title')}</h2>
      <p>{t('acceptance.p1')}</p>
      <p>
        {t.rich('acceptance.p2', {
          privacyLink: (chunks) => <Link href="/privacy">{chunks}</Link>,
        })}
      </p>

      <h2>{t('responsibilities.title')}</h2>
      <p>{t('responsibilities.intro')}</p>
      <ul>
        <li>{t('responsibilities.items.accuracy')}</li>
        <li>{t('responsibilities.items.credentials')}</li>
        <li>{t('responsibilities.items.lawful')}</li>
        <li>{t('responsibilities.items.entity')}</li>
        <li>{t('responsibilities.items.updates')}</li>
      </ul>

      <h2>{t('conduct.title')}</h2>
      <p>{t('conduct.intro')}</p>
      <h3>{t('conduct.selfDeclaration.title')}</h3>
      <p>{t('conduct.selfDeclaration.p1')}</p>
      <p>{t('conduct.selfDeclaration.p2')}</p>
      <ul>
        <li>{t('conduct.selfDeclaration.items.honest')}</li>
        <li>{t('conduct.selfDeclaration.items.noGhosting')}</li>
        <li>{t('conduct.selfDeclaration.items.status')}</li>
        <li>{t('conduct.selfDeclaration.items.withdraw')}</li>
      </ul>
      <h3>{t('conduct.prohibited.title')}</h3>
      <ul>
        <li>{t('conduct.prohibited.items.harassment')}</li>
        <li>{t('conduct.prohibited.items.spam')}</li>
        <li>{t('conduct.prohibited.items.misrepresentation')}</li>
        <li>{t('conduct.prohibited.items.scraping')}</li>
        <li>{t('conduct.prohibited.items.malware')}</li>
      </ul>

      <h2>{t('ip.title')}</h2>
      <p>{t('ip.platform')}</p>
      <p>{t('ip.userContent')}</p>
      <p>{t('ip.restrictions')}</p>

      <h2>{t('liability.title')}</h2>
      <p>{t('liability.p1')}</p>
      <p>{t('liability.p2')}</p>
      <ul>
        <li>{t('liability.items.asIs')}</li>
        <li>{t('liability.items.thirdParty')}</li>
        <li>{t('liability.items.hiring')}</li>
        <li>{t('liability.items.cap')}</li>
      </ul>

      <h2>{t('termination.title')}</h2>
      <p>{t('termination.p1')}</p>
      <p>{t('termination.p2')}</p>
      <ul>
        <li>{t('termination.items.user')}</li>
        <li>{t('termination.items.breach')}</li>
        <li>{t('termination.items.suspend')}</li>
        <li>{t('termination.items.effect')}</li>
      </ul>

      <h2>{t('governingLaw.title')}</h2>
      <p>{t('governingLaw.p1')}</p>
      <p>
        {t.rich('governingLaw.p2', {
          contactLink: (chunks) => <Link href="/contact">{chunks}</Link>,
        })}
      </p>
    </LegalDocument>
  )
}
