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
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
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
                  'rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors',
                  'hover:bg-surface hover:text-primary',
                )}
              >
                {t(item.labelKey)}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="inline-flex items-center rounded-lg border border-border bg-background p-1">
            <Link
              href="/"
              locale="ar"
              className="rounded-md px-2 py-1 text-xs font-medium text-foreground transition-colors hover:text-primary"
            >
              AR
            </Link>
            <Link
              href="/"
              locale="en"
              className="rounded-md px-2 py-1 text-xs font-medium text-foreground transition-colors hover:text-primary"
            >
              EN
            </Link>
          </div>
          <ThemeToggle />
          {user ? (
            <Button
              asChild
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Link href={dashboardHref}>{t('dashboard')}</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" className="text-foreground">
                <Link href="/login">{t('login')}</Link>
              </Button>
              <Button
                asChild
                className="bg-accent text-primary-foreground hover:bg-accent/90"
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
