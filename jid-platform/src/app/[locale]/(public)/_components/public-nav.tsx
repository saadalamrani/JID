import { getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import { siteConfig } from '@/config/site'
import { getPortalHomeForRole } from '@/lib/auth/portal-routes'
import type { UserRole } from '@/lib/auth/rbac'
import { isUserRole } from '@/lib/auth/rbac'
import { Link } from '@/lib/i18n/navigation'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'

const PRIMARY_LINKS = [
  { href: '/opportunities', labelKey: 'opportunities' },
  { href: '/mentors', labelKey: 'mentors' },
  { href: '/catalog', labelKey: 'catalog' },
  { href: '/pulse', labelKey: 'pulse' },
] as const

/** Section 4.2 — public top navigation with server-side session check. */
export async function PublicNav() {
  const t = await getTranslations('publicShell.nav')
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let dashboardHref = '/me'

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    const role = profile?.role
    if (role && isUserRole(role)) {
      dashboardHref = getPortalHomeForRole(role as UserRole)
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-jid-line bg-white/95 backdrop-blur-sm">
      <div className="container-jid flex h-16 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-6">
          <Link
            href="/"
            className="shrink-0 font-arabic text-xl font-semibold text-jid-olive"
            aria-label={t('homeAria', { name: siteConfig.name })}
          >
            {siteConfig.name}
          </Link>

          <nav
            className="hidden items-center gap-1 md:flex"
            aria-label={t('primaryAria')}
          >
            {PRIMARY_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-medium text-jid-ink/80 transition-colors',
                  'hover:bg-jid-beige hover:text-jid-olive',
                )}
              >
                {t(item.labelKey)}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {user ? (
            <Button
              asChild
              className="bg-jid-olive text-white hover:bg-jid-olive/90"
            >
              <Link href={dashboardHref}>{t('dashboard')}</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" className="text-jid-ink">
                <Link href="/login">{t('login')}</Link>
              </Button>
              <Button
                asChild
                className="bg-jid-gold text-jid-ink hover:bg-jid-gold/90"
              >
                <Link href="/signup">{t('signup')}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
