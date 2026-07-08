export type IndividualQuickAction = {
  key: string
  href: string
  keywords?: string[]
}

/** Part 6 — individual/public command palette quick actions (client-filtered, no server search). */
export const INDIVIDUAL_QUICK_ACTIONS: IndividualQuickAction[] = [
  { key: 'opportunities', href: '/opportunities', keywords: ['jobs', 'careers'] },
  { key: 'mentors', href: '/mentors', keywords: ['mentorship'] },
  { key: 'catalog', href: '/catalog', keywords: ['companies'] },
  { key: 'pulse', href: '/pulse', keywords: ['news', 'announcements'] },
  { key: 'profile', href: '/profile', keywords: ['me', 'account'] },
  { key: 'radar', href: '/radar', keywords: ['meetings', 'sessions'] },
  { key: 'cv', href: '/profile/cv', keywords: ['resume', 'builder'] },
  { key: 'notifications', href: '/notifications', keywords: ['alerts', 'inbox'] },
  { key: 'settings', href: '/profile/edit', keywords: ['preferences', 'account'] },
]

export const PUBLIC_GUEST_QUICK_ACTIONS: IndividualQuickAction[] = [
  { key: 'login', href: '/login', keywords: ['sign in'] },
  { key: 'signup', href: '/signup', keywords: ['register', 'create account'] },
]
