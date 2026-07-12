import { Compass, Home, Mail } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import { Link } from '@/lib/i18n/navigation'
import { cn } from '@/lib/utils'

const QUICK_LINKS = [
  { key: 'opportunities' as const, href: '/opportunities' },
  { key: 'catalog' as const, href: '/catalog' },
  { key: 'mentors' as const, href: '/mentors' },
  { key: 'contact' as const, href: '/contact' },
]

/** Section 14 — branded 404 page (replaces Sprint 0 minimal version). */
export default async function NotFoundPage() {
  const t = await getTranslations('errors.notFoundPage')

  return (
    <main className="container-jid flex min-h-[70vh] flex-col items-center justify-center py-16 text-center">
      <p
        className="font-mono text-7xl font-bold text-accent md:text-8xl"
        aria-hidden
      >
        {t('code')}
      </p>

      <div className="mt-4 max-w-lg">
        <h1 className="font-arabic text-2xl font-bold text-foreground md:text-3xl">{t('title')}</h1>
        <p className="mt-3 text-base leading-relaxed text-foreground/70">{t('description')}</p>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild className="gap-2">
          <Link href="/">
            <Home className="size-4" aria-hidden />
            {t('homeCta')}
          </Link>
        </Button>
        <Button asChild variant="outline" className="gap-2">
          <Link href="/contact">
            <Mail className="size-4" aria-hidden />
            {t('contactCta')}
          </Link>
        </Button>
      </div>

      <section
        className="mt-12 w-full max-w-xl rounded-2xl border border-border/70 bg-background/40 p-6"
        aria-labelledby="not-found-links-heading"
      >
        <div className="flex items-center justify-center gap-2 text-primary">
          <Compass className="size-4" aria-hidden />
          <h2 id="not-found-links-heading" className="font-arabic text-sm font-semibold">
            {t('exploreTitle')}
          </h2>
        </div>
        <ul className="mt-4 flex flex-wrap justify-center gap-2">
          {QUICK_LINKS.map((link) => (
            <li key={link.key}>
              <Link
                href={link.href}
                className={cn(
                  'inline-flex rounded-full border border-border bg-white px-4 py-2 text-sm font-medium',
                  'text-primary transition-colors hover:border-primary/40 hover:bg-primary/5',
                )}
              >
                {t(`links.${link.key}`)}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
