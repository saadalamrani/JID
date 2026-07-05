'use client'

import { useState } from 'react'
import { useRouter } from '@/lib/i18n/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { reinstateProfile } from '@/lib/profile/mutations'

type ReinstateProfileButtonProps = {
  profileId: string
}

export function ReinstateProfileButton({ profileId }: ReinstateProfileButtonProps) {
  const t = useTranslations('profile.public')
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleReinstate() {
    setLoading(true)
    try {
      await reinstateProfile(profileId)
      toast.success(t('reinstateSuccess'))
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('reinstateFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      size="sm"
      className="bg-jid-olive hover:bg-jid-olive/90"
      disabled={loading}
      onClick={() => void handleReinstate()}
    >
      {t('reinstateCta')}
    </Button>
  )
}
