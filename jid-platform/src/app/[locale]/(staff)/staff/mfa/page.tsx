'use client'

import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { MfaSetup } from '@/components/auth/mfa-setup'
import { OtpInput } from '@/components/auth/otp-input'
import { StaffAuthShell } from '@/components/staff/staff-auth-shell'
import { Button } from '@/components/ui/button'
import {
  challengeTotp,
  getMfaAssuranceLevel,
  getVerifiedTotpFactor,
  isAal2,
  verifyTotp,
} from '@/lib/auth/mfa'
import { PRIVILEGED_STAFF_ROLES, isRoleAllowed } from '@/lib/auth/rbac'
import { fetchProfileForUser } from '@/lib/auth/session'
import { useRouter } from '@/lib/i18n/navigation'
import { STAFF_HOME_PATH, STAFF_LOGIN_PATH } from '@/lib/staff/constants'
import { sanitizeStaffNextPath } from '@/lib/staff/routes'
import { track } from '@/lib/analytics/track'
import { createClient } from '@/lib/supabase/client'

export default function StaffMfaPage() {
  const t = useTranslations('staff.mfa')

  return (
    <Suspense
      fallback={
        <StaffAuthShell title={t('title')} subtitle={t('subtitle')}>
          <p className="text-center text-sm text-muted-foreground">{t('loading')}</p>
        </StaffAuthShell>
      }
    >
      <StaffMfaPageContent />
    </Suspense>
  )
}

function StaffMfaPageContent() {
  const t = useTranslations('staff.mfa')
  const router = useRouter()
  const searchParams = useSearchParams()
  const setupMode = searchParams.get('setup') === '1'
  const nextParam = searchParams.get('next')

  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [showSetup, setShowSetup] = useState(setupMode)

  const redirectAfterMfa = useCallback(() => {
    const destination = sanitizeStaffNextPath(nextParam) ?? STAFF_HOME_PATH
    router.push(destination)
  }, [nextParam, router])

  useEffect(() => {
    async function guardRoute() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.replace(STAFF_LOGIN_PATH)
        return
      }

      const profile = await fetchProfileForUser(supabase, user.id)
      if (!profile || !isRoleAllowed(profile.role, PRIVILEGED_STAFF_ROLES)) {
        await supabase.auth.signOut()
        router.replace(STAFF_LOGIN_PATH)
        return
      }

      if (await isAal2(supabase)) {
        redirectAfterMfa()
        return
      }

      if (!setupMode) {
        const factor = await getVerifiedTotpFactor(supabase)
        if (!factor) {
          setShowSetup(true)
        }
      }

      setLoading(false)
    }

    void guardRoute()
  }, [redirectAfterMfa, router, setupMode])

  async function handleVerify() {
    if (code.length !== 6) return

    setVerifying(true)
    const supabase = createClient()

    try {
      const factor = await getVerifiedTotpFactor(supabase)
      if (!factor) {
        toast.error(t('errors.noFactor'))
        setShowSetup(true)
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

      track('staff.mfa_verified')
      redirectAfterMfa()
    } catch {
      toast.error(t('errors.verifyFailed'))
    } finally {
      setVerifying(false)
    }
  }

  if (loading) {
    return (
      <StaffAuthShell title={t('title')} subtitle={t('subtitle')}>
        <p className="text-center text-sm text-muted-foreground">{t('loading')}</p>
      </StaffAuthShell>
    )
  }

  if (showSetup) {
    return (
      <StaffAuthShell title={t('setupTitle')} subtitle={t('setupSubtitle')}>
        <MfaSetup onEnrolled={redirectAfterMfa} />
      </StaffAuthShell>
    )
  }

  return (
    <StaffAuthShell title={t('title')} subtitle={t('subtitle')}>
      <div className="space-y-4">
        <OtpInput value={code} onChange={setCode} disabled={verifying} />
        <Button
          type="button"
          className="w-full bg-primary hover:bg-primary/90"
          disabled={verifying || code.length !== 6}
          onClick={() => void handleVerify()}
        >
          {verifying ? t('verifying') : t('verify')}
        </Button>
      </div>
    </StaffAuthShell>
  )
}
