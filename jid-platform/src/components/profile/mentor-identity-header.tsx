'use client'

import { Clock, UserRound } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ProfileAvatar } from '@/components/profile/profile-avatar'
import { OwnerEditControl } from '@/components/profile/owner-edit-control'
import { cn } from '@/lib/utils'

type MentorIdentityHeaderProps = {
  isOwner: boolean
  fullName: string
  headline?: string | null
  bioSnippet?: string | null
  avatarUrl?: string | null
  isVerified?: boolean
  avgResponseHours?: number | null
  status?: string | null
  editHref?: string
  onEdit?: () => void
  className?: string
}

export function MentorIdentityHeader({
  isOwner,
  fullName,
  headline,
  bioSnippet,
  avatarUrl,
  isVerified = false,
  avgResponseHours,
  status,
  editHref,
  onEdit,
  className,
}: MentorIdentityHeaderProps) {
  const t = useTranslations('profile.components')

  const snippet = bioSnippet ?? headline

  return (
    <header
      className={cn(
        'flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between',
        className,
      )}
    >
      <div className="flex gap-4">
        <ProfileAvatar
          src={avatarUrl}
          alt={fullName}
          isVerified={isVerified}
          size="lg"
          variant="circle"
        />
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <h1 className="inline-flex items-center gap-2 text-xl font-semibold text-foreground">
              <UserRound className="h-5 w-5 text-primary" aria-hidden />
              {fullName}
            </h1>
            {headline ? (
              <p className="mt-1 text-sm font-medium text-primary/90">{headline}</p>
            ) : null}
            {snippet ? (
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{snippet}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            {avgResponseHours != null ? (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {t('avgResponseHours', { hours: avgResponseHours })}
              </span>
            ) : null}
            {status ? (
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {status}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <OwnerEditControl isOwner={isOwner} editHref={editHref} onEdit={onEdit} />
    </header>
  )
}
