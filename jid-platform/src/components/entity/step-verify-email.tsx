'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Link } from '@/lib/i18n/navigation'
import { siteConfig } from '@/config/site'
import { createClient } from '@/lib/supabase/client'

type StepVerifyEmailProps = {
  email?: string
  pendingReviewPath: '/company/verification-pending' | '/company/pending-review' | '/university/pending-review'
  onVerified: () => void
}

export function StepVerifyEmail({ email, pendingReviewPath, onVerified }: StepVerifyEmailProps) {
  const t = useTranslations('entity.wizard.verifyEmail')
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function poll() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!cancelled && user?.email_confirmed_at) {
        onVerified()
      }
    }

    void poll()
    const interval = window.setInterval(() => {
      void poll()
    }, 5000)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [onVerified])

  async function handleCheckNow() {
    setChecking(true)
    try {
      const supabase = createClient()
      await supabase.auth.refreshSession()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user?.email_confirmed_at) {
        onVerified()
      }
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="space-y-4 text-center">
      <p className="text-sm text-foreground/80">{t('instructions')}</p>
      {email ? (
        <p className="font-medium text-foreground" dir="ltr">
          {email}
        </p>
      ) : null}
      <p className="text-xs text-foreground/60">{t('inbucketHint')}</p>

      <Button
        type="button"
        className="w-full bg-primary hover:bg-primary/90"
        disabled={checking}
        onClick={handleCheckNow}
      >
        {checking ? t('checking') : t('checkNow')}
      </Button>

      <Link
        href={pendingReviewPath}
        className="block text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        {t('continueToPending')}
      </Link>

      <p className="text-xs text-muted-foreground">
        {siteConfig.name} — {t('spamHint')}
      </p>
    </div>
  )
}
