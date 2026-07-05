'use client'

import { Mail } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

/**
 * Placeholder — masked relay ships in a later communications sprint (Section 13).
 */
export function MaskedContactButton() {
  const t = useTranslations('profile.public')

  function handleClick() {
    // TODO: wire masked contact relay when communications feature lands
    console.info('MaskedContactButton: relay not implemented')
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="border-jid-line"
      onClick={handleClick}
    >
      <Mail className="h-4 w-4" aria-hidden />
      {t('maskedContact')}
    </Button>
  )
}
