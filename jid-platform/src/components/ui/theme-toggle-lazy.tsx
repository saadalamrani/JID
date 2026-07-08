'use client'

import dynamic from 'next/dynamic'

/** Part 8 — code-split next-themes toggle from header/topbar initial bundles. */
export const ThemeToggleLazy = dynamic(
  () => import('@/components/ui/theme-toggle').then((mod) => ({ default: mod.ThemeToggle })),
  {
    ssr: false,
    loading: () => <div className="h-9 w-9 shrink-0" aria-hidden />,
  },
)
