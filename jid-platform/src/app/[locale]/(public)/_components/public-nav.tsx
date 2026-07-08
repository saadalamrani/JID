import { getTranslations } from 'next-intl/server'
import { Logo } from '@/components/brand/logo'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Button } from '@/components/ui/button'
import { getPortalHomeForRole } from '@/lib/auth/portal-routes'
import type { UserRole } from '@/lib/auth/rbac'
import { isUserRole } from '@/lib/auth/rbac'
import { Link } from '@/lib/i18n/navigation'
import { isDbOfflineError } from '@/lib/supabase/offline-error'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import type { User } from '@supabase/supabase-js'

const PRIMARY_LINKS = [
  { href: '/opportunities', labelKey: 'opportunities' },
  { href: '/mentors', labelKey: 'mentors' },
  { href: '/catalog', labelKey: 'catalog' },
  { href: '/pulse', labelKey: 'pulse' },
] as const

/** Section 4.2 — public top navigation with server-side session check. */
export async function PublicNav() {
  const t = await getTranslations('publicShell.nav')
  let user: User | null = null
  let dashboardHref = '/me'

  try {
    const supabase = await createClient()
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    user = authUser

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
  } catch (error) {
    if (!isDbOfflineError(error)) {
      throw error
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-jid-line bg-jid-beige/95 backdrop-blur-sm dark:border-jid-gold/20 dark:bg-jid-olive/95">
      <div className="container-jid flex h-16 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-6">
          <Link
            href="/"
            className="shrink-0"
            aria-label={t('homeAria', { name: 'JID' })}
          >
            <Logo size="md" />
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
                  'rounded-md px-3 py-2 text-sm font-medium text-jid-ink/80 transition-colors dark:text-jid-beige/80',
                  'hover:bg-jid-beige hover:text-jid-olive dark:hover:bg-jid-olive dark:hover:text-jid-gold',
                )}
              >
                {t(item.labelKey)}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="inline-flex items-center rounded-lg border border-jid-line/70 bg-jid-beige p-1 dark:border-jid-gold/20 dark:bg-jid-olive">
            <Link
              href="/"
              locale="ar"
              className="rounded-md px-2 py-1 text-xs font-medium text-jid-ink transition-colors hover:text-jid-olive dark:text-jid-beige dark:hover:text-jid-gold"
            >
              AR
            </Link>
            <Link
              href="/"
              locale="en"
              className="rounded-md px-2 py-1 text-xs font-medium text-jid-ink transition-colors hover:text-jid-olive dark:text-jid-beige dark:hover:text-jid-gold"
            >
              EN
            </Link>
          </div>
          <ThemeToggle />
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
