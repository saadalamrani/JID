import type { LucideIcon } from 'lucide-react'
import {
  AlertTriangle,
  Building2,
  ClipboardList,
  Flag,
  GraduationCap,
  LayoutDashboard,
  ScrollText,
  Settings2,
  UserCog,
  Users,
} from 'lucide-react'

export type SysNavItem = {
  key: string
  href: string
  icon: LucideIcon
  /** Section 5.2 — red-tinted Emergency link */
  danger?: boolean
}

export type SysNavSection = {
  sectionKey: string
  items: SysNavItem[]
}

/** Section 5.2 — sidebar navigation structure */
export const SYS_NAV_SECTIONS: SysNavSection[] = [
  {
    sectionKey: 'overview',
    items: [{ key: 'dashboard', href: '/sys/dashboard', icon: LayoutDashboard }],
  },
  {
    sectionKey: 'operations',
    items: [
      { key: 'users', href: '/sys/users', icon: Users },
      { key: 'entities', href: '/sys/entities', icon: Building2 },
      { key: 'claims', href: '/sys/claims', icon: ClipboardList },
      { key: 'mentorApplications', href: '/sys/mentor-applications', icon: GraduationCap },
    ],
  },
  {
    sectionKey: 'internal',
    items: [
      { key: 'staff', href: '/sys/staff', icon: UserCog },
      { key: 'audit', href: '/sys/audit', icon: ScrollText },
    ],
  },
  {
    sectionKey: 'governance',
    items: [
      { key: 'flags', href: '/sys/flags', icon: Flag },
      { key: 'platformPulse', href: '/sys/features', icon: Flag },
      { key: 'config', href: '/sys/config', icon: Settings2 },
      { key: 'sessions', href: '/sys/system/sessions', icon: Users },
    ],
  },
  {
    sectionKey: 'danger',
    items: [
      {
        key: 'emergency',
        href: '/sys/system/emergency',
        icon: AlertTriangle,
        danger: true,
      },
    ],
  },
]

export type SysQuickAction = {
  key: string
  href: string
  keywords?: string[]
}

/** Section 9 — command palette quick actions (shown when query is empty) */
export const SYS_QUICK_ACTIONS: SysQuickAction[] = [
  { key: 'dashboard', href: '/sys/dashboard', keywords: ['home', 'overview'] },
  { key: 'users', href: '/sys/users', keywords: ['people', 'profiles'] },
  { key: 'entities', href: '/sys/entities', keywords: ['companies', 'organizations'] },
  { key: 'claims', href: '/sys/claims', keywords: ['queue', 'ownership'] },
  { key: 'inviteStaff', href: '/sys/staff/new', keywords: ['invite', 'staff'] },
  { key: 'audit', href: '/sys/audit', keywords: ['log', 'history'] },
  { key: 'emergency', href: '/sys/system/emergency', keywords: ['kill', 'danger'] },
]
