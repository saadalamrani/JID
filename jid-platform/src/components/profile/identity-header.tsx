'use client'

import { MapPin, GraduationCap } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ProfileAvatar } from '@/components/profile/profile-avatar'
import { OwnerEditControl } from '@/components/profile/owner-edit-control'
import { cn } from '@/lib/utils'

export type StudentStatus = 'student' | 'graduate' | 'alumni'

type IdentityHeaderProps = {
  isOwner: boolean
  isVerified?: boolean
  fullName: string
  headline?: string | null
  avatarUrl?: string | null
  city?: string | null
  universityName?: string | null
  studentStatus?: StudentStatus | null
  editHref?: string
  onEdit?: () => void
  className?: string
}

export function IdentityHeader({
  isOwner,
  isVerified = false,
  fullName,
  headline,
  avatarUrl,
  city,
  universityName,
  studentStatus,
  editHref,
  onEdit,
  className,
}: IdentityHeaderProps) {
  const t = useTranslations('profile.components')

  const statusLabel =
    studentStatus === 'student'
      ? t('studentStatusStudent')
      : studentStatus === 'graduate'
        ? t('studentStatusGraduate')
        : studentStatus === 'alumni'
          ? t('studentStatusAlumni')
          : null

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
            <h1 className="text-xl font-semibold text-foreground">{fullName}</h1>
            {headline ? (
              <p className="mt-1 text-sm text-muted-foreground">{headline}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            {city ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {city}
              </span>
            ) : null}
            {universityName ? (
              <span className="inline-flex items-center gap-1">
                <GraduationCap className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {universityName}
              </span>
            ) : null}
            {statusLabel ? (
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {statusLabel}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <OwnerEditControl isOwner={isOwner} editHref={editHref} onEdit={onEdit} />
    </header>
  )
}
