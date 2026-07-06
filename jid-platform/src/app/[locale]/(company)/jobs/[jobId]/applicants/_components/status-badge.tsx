'use client'

import {
  CheckCircle2,
  Clock,
  MessageSquare,
  UserCheck,
  UserX,
  XCircle,
} from 'lucide-react'
import type { ApplicationStatus } from '@/types/application'
import { APPLICATION_STATUS_LABELS } from '@/types/application'
import { cn } from '@/lib/utils'

const STATUS_CONFIG: Record<
  ApplicationStatus,
  { icon: typeof Clock; className: string }
> = {
  draft: { icon: Clock, className: 'bg-jid-line/40 text-jid-ink/60' },
  submitted: { icon: Clock, className: 'bg-sky-50 text-sky-800' },
  under_review: { icon: Clock, className: 'bg-amber-50 text-amber-900' },
  shortlisted: { icon: UserCheck, className: 'bg-emerald-50 text-emerald-800' },
  rejected: { icon: UserX, className: 'bg-red-50 text-red-800' },
  invited: { icon: MessageSquare, className: 'bg-violet-50 text-violet-800' },
  withdrawn: { icon: XCircle, className: 'bg-jid-line/40 text-jid-ink/60' },
  expired: { icon: XCircle, className: 'bg-jid-line/40 text-jid-ink/60' },
}

type StatusBadgeProps = {
  status: ApplicationStatus
  className?: string
}

/** Section 10 — status always uses icon + text, never color-only. */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const label = APPLICATION_STATUS_LABELS[status]
  const config = STATUS_CONFIG[status]
  const Icon = config.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-arabic text-xs font-medium',
        config.className,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>{label}</span>
    </span>
  )
}

/** Bulk action affordance badge (accept/reject/interview). */
export function BulkActionIcon({ action }: { action: 'accept' | 'reject' | 'interview' }) {
  if (action === 'accept') return <CheckCircle2 className="h-4 w-4" aria-hidden />
  if (action === 'reject') return <UserX className="h-4 w-4" aria-hidden />
  return <MessageSquare className="h-4 w-4" aria-hidden />
}
