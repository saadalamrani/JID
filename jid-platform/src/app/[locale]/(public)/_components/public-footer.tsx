import { getTranslations } from 'next-intl/server'
import { Logo } from '@/components/brand/logo'
import { siteConfig } from '@/config/site'
import { Link } from '@/lib/i18n/navigation'

/** Section 4.3 — three-column public footer (platform, legal, support). */
export async function PublicFooter() {
  const t = await getTranslations('publicShell.footer')
  const tNav = await getTranslations('publicShell.nav')
  const year = new Date().getFullYear()

  const groups = [
    {
      title: t('groups.platform.title'),
      links: [
        { href: '/opportunities', label: t('groups.platform.opportunities') },
        { href: '/mentors', label: t('groups.platform.mentors') },
        { href: '/catalog', label: t('groups.platform.catalog') },
        { href: '/pulse', label: t('groups.platform.pulse') },
      ],
    },
    {
      title: t('groups.legal.title'),
      links: [
        { href: '/privacy', label: t('groups.legal.privacy') },
        { href: '/terms', label: t('groups.legal.terms') },
        { href: '/pdpl', label: t('groups.legal.pdpl') },
      ],
    },
    {
      title: t('groups.support.title'),
      links: [
        { href: '/contact', label: t('groups.support.contact') },
        { href: '/about', label: t('groups.support.about') },
      ],
    },
  ] as const

  return (
    <footer className="border-t border-jid-line bg-jid-beige dark:border-jid-gold/20 dark:bg-jid-olive">
      <div className="container-jid py-10">
        <div className="mb-8">
          <Link href="/" aria-label={tNav('homeAria', { name: siteConfig.nameEn })}>
            <Logo size="sm" />
          </Link>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <div key={group.title}>
              <h2 className="text-sm font-semibold text-jid-olive dark:text-jid-gold">{group.title}</h2>
              <ul className="mt-3 space-y-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-jid-ink/70 transition-colors hover:text-jid-olive dark:text-jid-beige/80 dark:hover:text-jid-gold"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 border-t border-jid-line/60 pt-6 text-center text-xs text-jid-ink/60 dark:border-jid-gold/20 dark:text-jid-beige/70">
          {t('copyright', { year, name: siteConfig.name })}
        </div>
      </div>
    </footer>
  )
}
