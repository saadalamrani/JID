'use client'

import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AuthShell } from '@/components/auth/auth-shell'
import { MfaSetup } from '@/components/auth/mfa-setup'
import { OtpInput } from '@/components/auth/otp-input'
import { Button } from '@/components/ui/button'
import {
  challengeTotp,
  getMfaAssuranceLevel,
  getVerifiedTotpFactor,
  isAal2,
  verifyTotp,
} from '@/lib/auth/mfa'
import { getPortalHomeForRole, resolvePostLoginDestination, sanitizePostLoginPath } from '@/lib/auth/portal-routes'
import { fetchProfileForUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from '@/lib/i18n/navigation'

export default function LoginMfaPage() {
  const t = useTranslations('auth.mfa')

  return (
    <Suspense
      fallback={
        <AuthShell title={t('title')} subtitle={t('subtitle')}>
          <p className="text-center text-sm text-jid-ink/70">{t('loading')}</p>
        </AuthShell>
      }
    >
      <LoginMfaPageContent />
    </Suspense>
  )
}

function LoginMfaPageContent() {
  const t = useTranslations('auth.mfa')
  const router = useRouter()
  const searchParams = useSearchParams()
  const setupMode = searchParams.get('setup') === '1'
  const nextParam = searchParams.get('next')

  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [showSetup, setShowSetup] = useState(setupMode)
  const [portalHome, setPortalHome] = useState('/staff')

  const redirectAfterMfa = useCallback(
    (role: Parameters<typeof getPortalHomeForRole>[0]) => {
      const destination =
        sanitizePostLoginPath(nextParam) ?? getPortalHomeForRole(role)
      router.push(destination)
    },
    [nextParam, router],
  )

  useEffect(() => {
    async function guardRoute() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.replace('/login')
        return
      }

      const profile = await fetchProfileForUser(supabase, user.id)
      if (!profile) {
        router.replace('/login')
        return
      }

      setPortalHome(getPortalHomeForRole(profile.role))

      if (await isAal2(supabase)) {
        redirectAfterMfa(profile.role)
        return
      }

      if (setupMode) {
        setShowSetup(true)
        setLoading(false)
        return
      }

      const factor = await getVerifiedTotpFactor(supabase)
      if (!factor) {
        router.replace(resolvePostLoginDestination(profile.role, { needsMfa: true, needsMfaSetup: true }))
        return
      }

      setShowSetup(false)
      setLoading(false)
    }

    void guardRoute()
  }, [redirectAfterMfa, router, setupMode])

  async function handleVerify() {
    if (code.length !== 6) return

    setVerifying(true)
    try {
      const supabase = createClient()
      const factor = await getVerifiedTotpFactor(supabase)
      if (!factor) {
        toast.error(t('errors.noFactor'))
        return
      }

      const challenge = await challengeTotp(supabase, factor.id)
      await verifyTotp(supabase, {
        factorId: factor.id,
        challengeId: challenge.id,
        code,
      })

      const aal = await getMfaAssuranceLevel(supabase)
      if (aal.currentLevel !== 'aal2') {
        toast.error(t('errors.verifyFailed'))
        return
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()
      const profile = user ? await fetchProfileForUser(supabase, user.id) : null

      toast.success(t('verified'))
      redirectAfterMfa(profile?.role ?? 'staff')
    } catch {
      toast.error(t('errors.verifyFailed'))
    } finally {
      setVerifying(false)
    }
  }

  async function handleSetupComplete() {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const profile = user ? await fetchProfileForUser(supabase, user.id) : null
    toast.success(t('setup.enrolled'))
    redirectAfterMfa(profile?.role ?? 'staff')
  }

  if (loading) {
    return (
      <AuthShell title={t('title')} subtitle={t('subtitle')}>
        <p className="text-center text-sm text-jid-ink/70">{t('loading')}</p>
      </AuthShell>
    )
  }

  if (showSetup) {
    return (
      <AuthShell title={t('setup.title')} subtitle={t('setup.subtitle')}>
        <MfaSetup onEnrolled={handleSetupComplete} />
      </AuthShell>
    )
  }

  return (
    <AuthShell title={t('title')} subtitle={t('subtitle')}>
      <div className="space-y-6">
        <p className="text-center text-sm text-jid-ink/70">{t('prompt')}</p>
        <OtpInput value={code} onChange={setCode} disabled={verifying} autoFocus />
        <Button
          type="button"
          className="w-full bg-jid-olive hover:bg-jid-olive/90"
          disabled={verifying || code.length !== 6}
          onClick={handleVerify}
        >
          {verifying ? t('verifying') : t('verify')}
        </Button>
        <p className="text-center text-xs text-jid-ink/50">
          {t('redirectHint', { portal: portalHome })}
        </p>
      </div>
    </AuthShell>
  )
}
