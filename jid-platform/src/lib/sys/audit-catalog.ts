import type { LucideIcon } from 'lucide-react'
import {
  Building2,
  ClipboardCheck,
  Download,
  Flag,
  GraduationCap,
  KeyRound,
  LogOut,
  Phone,
  Route,
  ScrollText,
  Shield,
  ShieldAlert,
  ShieldOff,
  UserCog,
  UserMinus,
  UserPlus,
} from 'lucide-react'

export type AuditCatalogEntry = {
  /** Stored audit_logs.action value */
  action: string
  label: string
  icon: LucideIcon
  /** Section 10 filter aliases (e.g. flag.enabled → feature_flag.toggle_global) */
  aliases?: string[]
}

/**
 * Section 10.2 — every action written to audit_logs across the platform.
 * Reconciled from migrations + app code (DISTINCT action values).
 */
export const AUDIT_ACTION_CATALOG: AuditCatalogEntry[] = [
  { action: 'audit.exported', label: 'Audit log exported', icon: Download },
  { action: 'emergency.maintenance_enabled', label: 'Maintenance mode enabled', icon: ShieldAlert },
  { action: 'emergency.maintenance_disabled', label: 'Maintenance mode disabled', icon: Shield },
  { action: 'emergency.registrations_closed', label: 'Registrations closed', icon: ShieldOff },
  { action: 'emergency.registrations_opened', label: 'Registrations opened', icon: Shield },
  { action: 'session.bulk_revoked', label: 'All sessions bulk-revoked', icon: LogOut },
  {
    action: 'feature_flag.toggle_global',
    label: 'Feature flag toggled',
    icon: Flag,
    aliases: ['flag.enabled', 'flag.disabled'],
  },
  { action: 'feature_flag.set_role_override', label: 'Flag role override set', icon: Flag },
  { action: 'feature_flag.set_user_override', label: 'Flag user override set', icon: Flag },
  { action: 'feature_flag.remove_user_override', label: 'Flag user override removed', icon: Flag },
  { action: 'platform_config.updated', label: 'Platform config updated', icon: KeyRound },
  { action: 'claim.approved', label: 'Claim approved (staff)', icon: ClipboardCheck },
  { action: 'claim.rejected', label: 'Claim rejected (staff)', icon: ClipboardCheck },
  {
    action: 'entity.force_approved',
    label: 'Entity force-approved (Super Admin)',
    icon: Building2,
  },
  { action: 'entity.force_rejected', label: 'Entity force-rejected (Super Admin)', icon: Building2 },
  { action: 'entity.metadata_updated', label: 'Entity metadata updated', icon: Building2 },
  { action: 'mentor.approved', label: 'Mentor application approved', icon: GraduationCap },
  { action: 'mentor.rejected', label: 'Mentor application rejected', icon: GraduationCap },
  { action: 'content_flag.resolved', label: 'Content flag resolved', icon: Flag },
  { action: 'content_flag.resolved_hidden', label: 'Content flag resolved (hidden)', icon: Flag },
  { action: 'content_flag.dismissed', label: 'Content flag dismissed', icon: Flag },
  {
    action: 'mentor.rejection_overridden',
    label: 'Mentor rejection overridden',
    icon: GraduationCap,
  },
  { action: 'mentor.suspended', label: 'Mentor suspended', icon: GraduationCap },
  { action: 'staff.invited', label: 'Staff member invited', icon: UserPlus },
  { action: 'staff.invite_accepted', label: 'Staff invite accepted', icon: UserPlus },
  { action: 'staff.access_revoked', label: 'Staff access revoked', icon: UserMinus },
  { action: 'user.suspended', label: 'User suspended', icon: ShieldOff },
  { action: 'user.reinstated', label: 'User reinstated', icon: Shield },
  { action: 'profile.reinstated', label: 'Profile reinstated', icon: Shield },
  { action: 'user.sessions_revoked', label: 'User sessions revoked', icon: LogOut },
  { action: 'session.revoked', label: 'Session revoked', icon: LogOut },
  { action: 'user.role_changed', label: 'User role changed', icon: UserCog },
  { action: 'user.phone_verified', label: 'Phone verified', icon: Phone },
  { action: 'route.access', label: 'Route access', icon: Route },
  { action: 'catalog.broken_link_7days', label: 'Catalog broken link (7 days)', icon: ScrollText },
]

const catalogByAction = new Map(AUDIT_ACTION_CATALOG.map((entry) => [entry.action, entry]))

const aliasToAction = new Map<string, string>()
for (const entry of AUDIT_ACTION_CATALOG) {
  for (const alias of entry.aliases ?? []) {
    aliasToAction.set(alias, entry.action)
  }
}

/** Resolve Section 10 action_type filter (supports aliases like flag.enabled). */
export function resolveAuditActionFilter(actionType: string): string {
  return aliasToAction.get(actionType) ?? actionType
}

export function getAuditCatalogEntry(action: string): AuditCatalogEntry {
  return (
    catalogByAction.get(action) ?? {
      action,
      label: action,
      icon: ScrollText,
    }
  )
}

export function listAuditActionFilterOptions(): Array<{ value: string; label: string }> {
  const options: Array<{ value: string; label: string }> = []
  for (const entry of AUDIT_ACTION_CATALOG) {
    options.push({ value: entry.action, label: entry.label })
    for (const alias of entry.aliases ?? []) {
      options.push({ value: alias, label: `${entry.label} (${alias})` })
    }
  }
  return options.sort((a, b) => a.label.localeCompare(b.label))
}
