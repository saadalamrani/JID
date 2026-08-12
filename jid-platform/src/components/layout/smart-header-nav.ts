/**
 * Shared primary nav link definitions for SmartHeader (desktop + mobile).
 * Actor-specific lists live in `@/lib/navigation/actor-shell` — this module
 * re-exports the Individual contract for callers that still import the constant.
 */
export type { ShellNavItem as SmartNavItem } from '@/lib/navigation/actor-shell'
export {
  INDIVIDUAL_SHELL_NAV_ITEMS as SMART_HEADER_NAV_ITEMS,
  getSmartHeaderNavItems,
} from '@/lib/navigation/actor-shell'
