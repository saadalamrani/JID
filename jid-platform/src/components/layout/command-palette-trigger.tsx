'use client'

import { Search } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

type CommandPaletteTriggerProps = {
  onClick: () => void
  className?: string
}

/** Part 6 — opens the command palette; pairs with useCommandPaletteHotkey. */
export function CommandPaletteTrigger({ onClick, className }: CommandPaletteTriggerProps) {
  const t = useTranslations('smartHeader')

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background/40 text-muted-foreground transition-colors hover:bg-muted sm:hidden',
          className,
        )}
        aria-label={t('searchPlaceholder')}
      >
        <Search className="h-4 w-4" aria-hidden />
      </button>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'hidden items-center gap-2 rounded-lg border border-border bg-background/40 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted sm:inline-flex',
          className,
        )}
        aria-label={t('searchPlaceholder')}
      >
        <Search className="h-4 w-4 shrink-0" aria-hidden />
        <span className="truncate">{t('searchPlaceholder')}</span>
        <kbd className="rounded border border-border bg-card px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          {t('searchShortcut')}
        </kbd>
      </button>
    </>
  )
}
