'use client'

import { useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { markAllAsRead } from '@/app/[locale]/(individual)/notifications/actions'
import { Button } from '@/components/ui/button'

export function NotificationsWorkspaceActions() {
  const t = useTranslations('notifications.page')
  const [isPending, startTransition] = useTransition()

  const handleMarkAllAsRead = () => {
    startTransition(async () => {
      await markAllAsRead()
    })
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="border-border bg-card text-primary hover:bg-background/40"
      onClick={handleMarkAllAsRead}
      disabled={isPending}
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
      {t('markAllAsRead')}
    </Button>
  )
}
