'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { useRouter } from '@/lib/i18n/navigation'
import { Button } from '@/components/ui/button'
import { trackOpportunityOnRadarAction } from '@/app/[locale]/(individual)/radar/actions'
import { createClient } from '@/lib/supabase/client'
import type { OpportunityDiscoveryItem } from '@/lib/opportunity/discovery-types'
import { cn } from '@/lib/utils'

type TrackOnRadarButtonProps = {
  opportunity: Pick<
    OpportunityDiscoveryItem,
    | 'opportunity_id'
    | 'source_class'
    | 'title'
    | 'organization_name'
    | 'expires_at'
    | 'apply_authority'
    | 'apply_url'
  >
  className?: string
}

export function TrackOnRadarButton({ opportunity, className }: TrackOnRadarButtonProps) {
  const t = useTranslations('radar.operations')
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [tracked, setTracked] = useState(false)

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn('relative z-30 min-h-11', className)}
      disabled={pending || tracked}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        startTransition(async () => {
          const supabase = createClient()
          const {
            data: { user },
          } = await supabase.auth.getUser()
          if (!user) {
            router.push('/login')
            return
          }
          const result = await trackOpportunityOnRadarAction({ opportunity })
          if (!result.ok) {
            toast.error(result.error)
            return
          }
          setTracked(true)
          toast.success(t('tracked'))
        })
      }}
    >
      {tracked ? t('tracked') : t('track')}
    </Button>
  )
}
