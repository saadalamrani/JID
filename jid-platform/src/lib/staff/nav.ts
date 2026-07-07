import type { LucideIcon } from 'lucide-react'
import {
  Building2,
  ClipboardList,
  Flag,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  ScrollText,
  Users,
} from 'lucide-react'

export type StaffNavBadgeKey = 'claims' | 'mentorApplications' | 'openFlags'

export type StaffNavItem = {
  key: string
  href: string
  icon: LucideIcon
  badgeKey?: StaffNavBadgeKey
}

export type StaffNavSection = {
  sectionKey: string
  items: StaffNavItem[]
}

/** Section 5.1 — sidebar navigation structure (يومي / المراجعات / الإدارة اليومية / أنا). */
export const STAFF_NAV_SECTIONS: StaffNavSection[] = [
  {
    sectionKey: 'daily',
    items: [{ key: 'dashboard', href: '/staff', icon: LayoutDashboard }],
  },
  {
    sectionKey: 'reviews',
    items: [
      {
        key: 'claims',
        href: '/staff/claims',
        icon: ClipboardList,
        badgeKey: 'claims',
      },
      {
        key: 'mentorApplications',
        href: '/staff/mentor-applications',
        icon: GraduationCap,
        badgeKey: 'mentorApplications',
      },
    ],
  },
  {
    sectionKey: 'operations',
    items: [
      { key: 'users', href: '/staff/users', icon: Users },
      { key: 'entities', href: '/staff/entities', icon: Building2 },
      { key: 'moderation', href: '/staff/moderation', icon: Flag, badgeKey: 'openFlags' },
      { key: 'announcements', href: '/staff/announcements', icon: Megaphone },
    ],
  },
  {
    sectionKey: 'me',
    items: [{ key: 'audit', href: '/staff/audit', icon: ScrollText }],
  },
]
