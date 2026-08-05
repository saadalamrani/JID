'use client'

import type { LucideIcon } from 'lucide-react'
import {
  Bell,
  Briefcase,
  Building2,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  FileQuestion,
  GraduationCap,
  Inbox,
  KeyRound,
  Link2Off,
  Mail,
  MessageSquare,
  Scale,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Smartphone,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { NotificationCategory, NotificationPriority } from '@/lib/notifications/types'

const CATEGORY_ICONS: Partial<Record<NotificationCategory, LucideIcon>> = {
  'auth.email_verified': ShieldCheck,
  'auth.mfa_disabled': ShieldOff,
  'auth.mfa_enabled': Shield,
  'auth.new_device_login': Smartphone,
  'auth.password_changed': KeyRound,
  'auth.password_reset_requested': KeyRound,
  'auth.phone_verified': Smartphone,
  'auth.session_revoked': ShieldAlert,
  'account.reinstated': UserCheck,
  'account.suspended': UserX,
  'claim.approved': Building2,
  'claim.needs_more_info': FileQuestion,
  'claim.rejected': Building2,
  'directory.correction_approved': Building2,
  'directory.correction_rejected': Building2,
  'company.link_broken': Link2Off,
  'job.application_expired': Briefcase,
  'job.application_received': Inbox,
  'job.application_status_changed': Briefcase,
  'job.expiring_soon': CalendarClock,
  'job.posted': Briefcase,
  'legal.privacy_updated': Scale,
  'legal.terms_updated': Scale,
  'mentor.application_approved': GraduationCap,
  'mentor.application_rejected': GraduationCap,
  'mentorship.feedback_requested': MessageSquare,
  'mentorship.meeting_confirmed': CalendarDays,
  'mentorship.meeting_proposed': CalendarDays,
  'mentorship.meeting_reminder': CalendarClock,
  'mentorship.request_accepted': Users,
  'mentorship.request_declined': Users,
  'mentorship.request_received': Users,
  'staff.claim_assigned': ClipboardList,
  'ssis.invitation': ClipboardList,
  'ssis.evaluation_ready': Briefcase,
  'digest.daily_summary': Mail,
}

const PRIORITY_STYLES: Record<NotificationPriority, { container: string; icon: string }> = {
  low: {
    container: 'bg-muted',
    icon: 'text-muted-foreground',
  },
  normal: {
    container: 'bg-primary/10',
    icon: 'text-primary',
  },
  high: {
    container: 'bg-amber-100',
    icon: 'text-amber-700',
  },
  critical: {
    container: 'bg-red-100',
    icon: 'text-red-700',
  },
}

type CategoryIconProps = {
  category: NotificationCategory | string
  priority: NotificationPriority | string
  className?: string
}

export function CategoryIcon({ category, priority, className }: CategoryIconProps) {
  const Icon = CATEGORY_ICONS[category as NotificationCategory] ?? Bell
  const styles = PRIORITY_STYLES[priority as NotificationPriority] ?? PRIORITY_STYLES.normal

  return (
    <span
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
        styles.container,
        className,
      )}
      aria-hidden
      data-category-fallback={CATEGORY_ICONS[category as NotificationCategory] ? undefined : 'bell'}
    >
      <Icon className={cn('h-4 w-4', styles.icon)} />
    </span>
  )
}
