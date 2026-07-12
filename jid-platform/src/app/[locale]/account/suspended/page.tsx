import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { Link } from '@/lib/i18n/navigation'

export default async function AccountSuspendedPage() {
  const t = await getTranslations('auth.suspended')
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let lockedUntil: string | null = null
  let suspendedAt: string | null = null

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('locked_until, suspended_at')
      .eq('id', user.id)
      .maybeSingle()

    lockedUntil = profile?.locked_until ?? null
    suspendedAt = profile?.suspended_at ?? null
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-red-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-foreground">{t('title')}</h1>
        <p className="mt-3 text-sm text-foreground/70">{t('message')}</p>
        {suspendedAt ? (
          <p className="mt-2 text-xs text-muted-foreground">
            {t('since')}: {new Date(suspendedAt).toLocaleString('ar-SA')}
          </p>
        ) : null}
        {lockedUntil ? (
          <p className="mt-2 text-xs text-muted-foreground">
            {t('until')}: {new Date(lockedUntil).toLocaleString('ar-SA')}
          </p>
        ) : null}
        <Link href="/login" className="mt-6 inline-block text-sm text-primary hover:underline">
          {t('backToLogin')}
        </Link>
      </div>
    </div>
  )
}
