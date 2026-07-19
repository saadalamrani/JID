import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

type StickyFilterBarProps = {
  children: ReactNode
  className?: string
}

export function StickyFilterBar({ children, className }: StickyFilterBarProps) {
  const t = useTranslations('catalogPage.search')

  return (
    <div
      className={cn(
        'sticky top-0 z-20 -mx-4 border-b border-border/40 bg-background/95 px-4 py-4 backdrop-blur-sm sm:-mx-6 sm:px-6',
        className,
      )}
      role="search"
      aria-label={t('filtersLabel')}
    >
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  )
}
