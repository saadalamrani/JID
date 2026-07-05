'use client'

import { Building2, Calendar, Users } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { ProfileAvatar } from '@/components/profile/profile-avatar'
import { OwnerEditControl } from '@/components/profile/owner-edit-control'
import { cn } from '@/lib/utils'

type CompanyIdentityHeaderProps = {
  isOwner: boolean
  name: string
  nameAr?: string | null
  tagline?: string | null
  logoUrl?: string | null
  isVerified?: boolean
  foundedYear?: number | null
  employeeCountRange?: string | null
  entityState?: string | null
  editHref?: string
  onEdit?: () => void
  className?: string
}

export function CompanyIdentityHeader({
  isOwner,
  name,
  nameAr,
  tagline,
  logoUrl,
  isVerified = false,
  foundedYear,
  employeeCountRange,
  entityState,
  editHref,
  onEdit,
  className,
}: CompanyIdentityHeaderProps) {
  const t = useTranslations('profile.components')
  const locale = useLocale()
  const displayName = locale === 'ar' && nameAr ? nameAr : name

  return (
    <header
      className={cn(
        'flex flex-col gap-4 rounded-xl border border-jid-line bg-white p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between',
        className,
      )}
    >
      <div className="flex gap-4">
        <ProfileAvatar
          src={logoUrl}
          alt={displayName}
          isVerified={isVerified}
          size="lg"
          variant="rounded"
        />
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <h1 className="inline-flex items-center gap-2 text-xl font-semibold text-jid-ink">
              <Building2 className="h-5 w-5 text-jid-olive" aria-hidden />
              {displayName}
            </h1>
            {tagline ? (
              <p className="mt-1 text-sm text-jid-ink/70">{tagline}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-jid-ink/60">
            {foundedYear ? (
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {t('foundedYear', { year: foundedYear })}
              </span>
            ) : null}
            {employeeCountRange ? (
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {employeeCountRange}
              </span>
            ) : null}
            {entityState ? (
              <span className="rounded-full bg-jid-gold/15 px-2.5 py-0.5 text-xs font-medium text-jid-olive">
                {entityState}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <OwnerEditControl isOwner={isOwner} editHref={editHref} onEdit={onEdit} />
    </header>
  )
}
