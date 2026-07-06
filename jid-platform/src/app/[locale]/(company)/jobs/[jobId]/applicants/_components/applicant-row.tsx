'use client'

import Image from 'next/image'
import { toast } from 'sonner'
import { handleApplicantNameClick } from '@/lib/applications/handle-applicant-name-click'
import { useRouter } from '@/lib/i18n/navigation'
import type { TriageApplicant } from '@/types/application'
import { cn } from '@/lib/utils'
import { StatusBadge } from './status-badge'

type ApplicantRowProps = {
  applicant: TriageApplicant
  selected: boolean
  focused: boolean
  onSelect: (checked: boolean) => void
  rowRef?: (element: HTMLTableRowElement | null) => void
}

function formatSubmittedAt(value: string | null): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat('ar-SA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

/** Section 5.3 — single applicant row with privacy-gated name click. */
export function ApplicantRow({
  applicant,
  selected,
  focused,
  onSelect,
  rowRef,
}: ApplicantRowProps) {
  const router = useRouter()
  const profile = applicant.applicant
  const displayName = profile?.full_name?.trim() || 'متقدم بدون اسم'

  function onNameClick() {
    if (!profile) return
    handleApplicantNameClick(
      { id: profile.id, show_profile_to_recruiters: profile.show_profile_to_recruiters },
      {
        openProfile: (path) => router.push(path),
        showToast: (message) => toast.message(message),
      },
    )
  }

  return (
    <tr
      ref={rowRef}
      className={cn(
        'border-b border-jid-line/40 transition-colors',
        focused && 'bg-jid-beige/60',
        selected && 'bg-jid-beige/30',
      )}
      data-application-id={applicant.id}
    >
      <td className="px-3 py-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={(event) => onSelect(event.target.checked)}
          aria-label={`تحديد ${displayName}`}
          className="h-4 w-4 rounded border-jid-line text-jid-olive focus:ring-jid-olive"
        />
      </td>
      <td className="px-3 py-3">
        <button
          type="button"
          onClick={onNameClick}
          className="flex items-center gap-3 text-start font-arabic text-sm text-jid-ink hover:text-jid-olive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jid-olive"
        >
          {profile?.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full bg-jid-line/50 font-arabic text-xs text-jid-ink/70"
              aria-hidden
            >
              {displayName.slice(0, 1)}
            </span>
          )}
          <span>
            <span className="block font-medium">{displayName}</span>
            {profile?.headline ? (
              <span className="block text-xs text-jid-ink/60">{profile.headline}</span>
            ) : null}
          </span>
        </button>
      </td>
      <td className="hidden px-3 py-3 font-arabic text-sm text-jid-ink/70 md:table-cell">
        {applicant.contact_email ?? '—'}
      </td>
      <td className="px-3 py-3">
        <StatusBadge status={applicant.status} />
      </td>
      <td className="hidden px-3 py-3 font-arabic text-sm text-jid-ink/70 lg:table-cell">
        {formatSubmittedAt(applicant.submitted_at)}
      </td>
    </tr>
  )
}
