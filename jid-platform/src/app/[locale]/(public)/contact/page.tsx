import type { Metadata } from 'next'
import { Clock, Mail, Shield } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { ContactForm } from '@/app/[locale]/(public)/contact/_components/contact-form'
import { ContactInfoCard } from '@/app/[locale]/(public)/contact/_components/contact-info-card'
import { localeConfig, type Locale } from '@/lib/i18n/config'
import { Link } from '@/lib/i18n/navigation'
import { createClient } from '@/lib/supabase/server'

type ContactPageProps = {
  params: { locale: string }
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('contactPage.meta')
  return {
    title: t('title'),
    description: t('description'),
  }
}

/** Section 9 — Contact page (server shell + client form). */
export default async function ContactPage({ params }: ContactPageProps) {
  const locale = params.locale as Locale
  const dir = localeConfig.direction[locale] ?? 'rtl'
  const t = await getTranslations('contactPage')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let defaultFullName = ''
  let defaultEmail = user?.email ?? ''

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle()
    defaultFullName = profile?.full_name ?? ''
  }

  return (
    <div dir={dir} lang={locale} className="container-jid py-12 md:py-16">
      <header className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-medium text-jid-gold">{t('eyebrow')}</p>
        <h1 className="mt-3 font-arabic text-3xl font-bold text-jid-ink md:text-4xl">{t('title')}</h1>
        <p className="mt-4 text-base leading-relaxed text-jid-ink/75">{t('intro')}</p>
      </header>

      <div className="mx-auto mt-12 grid max-w-5xl gap-10 lg:grid-cols-5 lg:gap-12">
        <aside className="space-y-4 lg:col-span-2">
          <ContactInfoCard icon={Mail} title={t('info.email.title')} description={t('info.email.body')} />
          <ContactInfoCard icon={Clock} title={t('info.response.title')} description={t('info.response.body')} />
          <ContactInfoCard icon={Shield} title={t('info.privacy.title')} description={t('info.privacy.body')} />
          <p className="text-sm text-jid-ink/65">
            {t.rich('info.privacyLink', {
              pdplLink: (chunks) => (
                <Link href="/pdpl" className="font-medium text-jid-olive underline-offset-2 hover:underline">
                  {chunks}
                </Link>
              ),
              privacyLink: (chunks) => (
                <Link href="/privacy" className="font-medium text-jid-olive underline-offset-2 hover:underline">
                  {chunks}
                </Link>
              ),
            })}
          </p>
        </aside>

        <section
          aria-labelledby="contact-form-heading"
          className="rounded-2xl border border-jid-line/70 bg-jid-beige/40 p-6 shadow-sm md:p-8 lg:col-span-3"
        >
          <h2 id="contact-form-heading" className="font-arabic text-xl font-semibold text-jid-ink">
            {t('form.heading')}
          </h2>
          <p className="mt-2 text-sm text-jid-ink/65">{t('form.subheading')}</p>
          <div className="mt-6">
            <ContactForm
              locale={locale}
              defaultFullName={defaultFullName}
              defaultEmail={defaultEmail}
            />
          </div>
        </section>
      </div>
    </div>
  )
}
