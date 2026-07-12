'use client'

import { MessageCircle } from 'lucide-react'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { RequestSessionModal } from '@/components/mentorship/request-session-modal'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type RequestSessionButtonProps = {
  mentorId: string
  mentorName: string
  mentorHeadline?: string | null
  expertiseAreas?: string[]
  isAccepting: boolean
  disabled?: boolean
  size?: 'sm' | 'default'
  className?: string
  fullWidth?: boolean
}

export function RequestSessionButton({
  mentorId,
  mentorName,
  mentorHeadline,
  expertiseAreas = [],
  isAccepting,
  disabled = false,
  size = 'sm',
  className,
  fullWidth = false,
}: RequestSessionButtonProps) {
  const t = useTranslations('mentorship.card')
  const [open, setOpen] = useState(false)

  const isDisabled = disabled || !isAccepting

  return (
    <>
      <Button
        type="button"
        size={size}
        disabled={isDisabled}
        className={cn(
          'bg-primary font-arabic hover:bg-primary/90 disabled:bg-border/40 disabled:text-muted-foreground',
          fullWidth && 'w-full',
          className,
        )}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          if (!isDisabled) setOpen(true)
        }}
      >
        <MessageCircle className="h-4 w-4" aria-hidden />
        {t('requestCta')}
      </Button>

      <RequestSessionModal
        open={open}
        onOpenChange={setOpen}
        mentorId={mentorId}
        mentorName={mentorName}
        mentorHeadline={mentorHeadline}
        expertiseAreas={expertiseAreas}
      />
    </>
  )
}
