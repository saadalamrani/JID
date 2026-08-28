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
  { key: 'profile', href: '/profile', keywords: ['me', 'account'] },
  { key: 'radar', href: '/radar', keywords: ['meetings', 'sessions'] },
  { key: 'careerRecord', href: '/profile/career-record', keywords: ['record', 'سجل'] },
  { key: 'cvProjection', href: '/profile/cv-projection', keywords: ['resume', 'سيرة'] },
  { key: 'cv', href: '/profile/cv', keywords: ['resume', 'builder'] },
  { key: 'notifications', href: '/notifications', keywords: ['alerts', 'inbox'] },
  { key: 'settings', href: '/profile/edit', keywords: ['preferences', 'account'] },
]

export const PUBLIC_GUEST_QUICK_ACTIONS: IndividualQuickAction[] = [
  { key: 'login', href: '/login', keywords: ['sign in'] },
  { key: 'signup', href: '/signup', keywords: ['register', 'create account'] },
]
