'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Link } from '@/lib/i18n/navigation'

/** Section 4.4 — localStorage-backed cookie consent banner. */
export const COOKIE_CONSENT_STORAGE_KEY = 'jid_cookie_consent'

export type CookieConsentValue = 'accepted'

export function CookieConsent() {
  const t = useTranslations('publicShell.cookie')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY)
      if (!stored) {
        setVisible(true)
      }
    } catch {
      setVisible(true)
    }
  }, [])

  function accept() {
    try {
      window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, 'accepted')
    } catch {
      /* best-effort */
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={t('ariaLabel')}
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-border bg-foreground px-4 py-4 text-primary-foreground shadow-lg"
    >
      <div className="container-jid flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed text-primary-foreground/90">
          {t('message')}{' '}
          <Link href="/privacy" className="font-medium text-accent underline-offset-2 hover:underline">
            {t('privacyLink')}
          </Link>
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            onClick={accept}
            className="bg-accent text-foreground hover:bg-accent/10"
          >
            {t('accept')}
          </Button>
        </div>
      </div>
    </div>
  )
}
