'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useRouter } from '@/lib/i18n/navigation'
import { AuthShell } from '@/components/auth/auth-shell'
import { OtpEntryStep } from '@/components/auth/otp-entry-step'
import { PhoneEntryStep } from '@/components/auth/phone-entry-step'
import { createClient } from '@/lib/supabase/client'
import { sendPhoneOtp, verifyPhoneOtp } from '@/lib/verification/phone-otp'

type Step = 'phone' | 'otp'

export default function VerifyPhonePage() {
  const t = useTranslations('auth.verifyPhone')
  const router = useRouter()
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [expiresAt, setExpiresAt] = useState('')

  const supabase = createClient()

  async function handleSend(phoneNumber: string) {
    return sendPhoneOtp(supabase, phoneNumber)
  }

  async function handleVerify(phoneNumber: string, otp: string) {
    await verifyPhoneOtp(supabase, phoneNumber, otp)
  }

  function handlePhoneSent(phoneNumber: string, expiry: string) {
    setPhone(phoneNumber)
    setExpiresAt(expiry)
    setStep('otp')
  }

  function handleVerified() {
    router.push('/me')
  }

  return (
    <AuthShell title={t('title')} subtitle={t('subtitle')}>
      {step === 'phone' ? (
        <PhoneEntryStep onSend={handleSend} onSent={handlePhoneSent} />
      ) : (
        <OtpEntryStep
          phone={phone}
          expiresAt={expiresAt}
          onVerify={handleVerify}
          onResend={handleSend}
          onChangePhone={() => setStep('phone')}
          onVerified={handleVerified}
        />
      )}
    </AuthShell>
  )
}
