'use client'

import { useRef, useState } from 'react'
import {
  Briefcase,
  Camera,
  GraduationCap,
  MapPin,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/lib/i18n/navigation'
import { toast } from 'sonner'
import { BadgePill } from '@/components/profile/badge-pill'
import { ProfileAvatar } from '@/components/profile/profile-avatar'
import { uploadProfileAvatar } from '@/lib/profile/mutations'
import type { IndividualProfileProjection } from '@/lib/profile/individual-projection-types'

type IndividualIdentityCardProps = {
  projection: IndividualProfileProjection
  locale: 'ar' | 'en'
}

export function IndividualIdentityCard({ projection, locale }: IndividualIdentityCardProps) {
  const t = useTranslations('profile.workspace')
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const { identity, viewState } = projection
  const isOwner = viewState === 'owner'
  const displayName = identity.fullName ?? '—'

  const graduateBadge = projection.badges.find((b) => b.slug === 'mentorship_graduate')
  const showGraduateBadge = identity.showGraduateBadge && graduateBadge

  const statusLabel = identity.employmentStatus
    ? t(`employmentStatus.${identity.employmentStatus}` as 'employmentStatus.student')
    : null

  async function handleAvatarChange(file: File) {
    setUploading(true)
    try {
      await uploadProfileAvatar(file)
      toast.success(t('avatarUploaded'))
      router.refresh()
    } catch {
      toast.error(t('avatarUploadFailed'))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="relative">
          <ProfileAvatar
            src={identity.avatarUrl}
            alt={displayName}
            size="lg"
            variant="circle"
          />
          {isOwner ? (
            <>
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 end-0 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-primary shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
                aria-label={t('uploadAvatar')}
              >
                <Camera className="h-4 w-4" aria-hidden />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void handleAvatarChange(file)
                }}
              />
            </>
          ) : null}
        </div>

        <div className="w-full space-y-1">
          <h1 className="text-xl font-semibold text-foreground">{displayName}</h1>
          {identity.headline ? (
            <p className="text-sm text-muted-foreground">{identity.headline}</p>
          ) : null}
        </div>

        <div className="flex w-full flex-col gap-1.5 text-sm text-muted-foreground">
          {identity.city ? (
            <span className="inline-flex items-center justify-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {identity.city}
            </span>
          ) : null}
          {identity.fieldLabel ? (
            <span className="inline-flex items-center justify-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {identity.fieldLabel}
            </span>
          ) : null}
          {identity.universityName ? (
            <span className="inline-flex items-center justify-center gap-1.5">
              <GraduationCap className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {identity.universityName}
              {identity.collegeName ? ` · ${identity.collegeName}` : ''}
            </span>
          ) : null}
          {identity.graduationYear ? (
            <span>{t('graduationYear', { year: identity.graduationYear })}</span>
          ) : null}
          {statusLabel ? (
            <span className="mx-auto rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              {statusLabel}
            </span>
          ) : null}
        </div>

        {showGraduateBadge && graduateBadge ? (
          <BadgePill badge={graduateBadge} locale={locale} />
        ) : null}
      </div>
    </div>
  )
}
