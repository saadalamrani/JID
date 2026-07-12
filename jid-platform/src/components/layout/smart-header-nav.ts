/** Shared primary nav link definitions for SmartHeader (desktop + mobile). */
export type SmartNavItem = {
  href: '/' | '/opportunities' | '/radar' | '/mentors' | '/catalog'
  labelKey: 'home' | 'exploreOpportunities' | 'radar' | 'mentorship' | 'catalog'
}

/**
 * Five center links per homepage spec — no 6th item.
 * Pulse removed from nav; homepage hero covers Platform Pulse positioning.
 */
export const SMART_HEADER_NAV_ITEMS: readonly SmartNavItem[] = [
  { href: '/', labelKey: 'home' },
  { href: '/opportunities', labelKey: 'exploreOpportunities' },
  { href: '/radar', labelKey: 'radar' },
  { href: '/mentors', labelKey: 'mentorship' },
  { href: '/catalog', labelKey: 'catalog' },
] as const
