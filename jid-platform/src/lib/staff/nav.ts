import type { LucideIcon } from 'lucide-react'
import {
  BookOpen,
  Building2,
  ClipboardList,
  CreditCard,
  Flag,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  Radar,
  ScrollText,
  Users,
  UserSquare2,
} from 'lucide-react'

export type StaffNavBadgeKey =
  | 'verification'
  | 'claims'
  | 'mentorApplications'
  | 'openFlags'
  | 'lammahHidden'
  | 'correctionSuggestions'

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

/** P-108 — sidebar navigation with verification + directory editorial entries. */
export const STAFF_NAV_SECTIONS: StaffNavSection[] = [
  {
    sectionKey: 'daily',
    items: [{ key: 'dashboard', href: '/staff', icon: LayoutDashboard }],
  },
  {
    sectionKey: 'reviews',
    items: [
      {
        key: 'verification',
        href: '/staff/verification',
        icon: ClipboardList,
        badgeKey: 'verification',
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
    sectionKey: 'directory',
    items: [
      { key: 'directory', href: '/staff/directory', icon: BookOpen },
      {
        key: 'correctionSuggestions',
        href: '/staff/directory/suggestions',
        icon: Building2,
        badgeKey: 'correctionSuggestions',
      },
      { key: 'profileModeration', href: '/staff/directory/profiles', icon: UserSquare2 },
    ],
  },
  {
    sectionKey: 'operations',
    items: [
      { key: 'users', href: '/staff/users', icon: Users },
      { key: 'entities', href: '/staff/entities', icon: Building2 },
      { key: 'moderation', href: '/staff/moderation', icon: Flag, badgeKey: 'openFlags' },
      {
        key: 'lammah',
        href: '/staff/lammah',
        icon: Radar,
        badgeKey: 'lammahHidden',
      },
      { key: 'announcements', href: '/staff/announcements', icon: Megaphone },
      { key: 'billing', href: '/staff/billing', icon: CreditCard },
    ],
  },
  {
    sectionKey: 'me',
    items: [{ key: 'audit', href: '/staff/audit', icon: ScrollText }],
  },
]
