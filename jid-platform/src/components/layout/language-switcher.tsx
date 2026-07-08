'use client'

import { useLocale } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'
import { cn } from '@/lib/utils'

type LanguageSwitcherProps = {
  className?: string
  variant?: 'inline' | 'compact'
}

/** AR / EN locale toggle — logical inline control for header and profile menu. */
export function LanguageSwitcher({ className, variant = 'inline' }: LanguageSwitcherProps) {
  const locale = useLocale()

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-1 text-sm', className)}>
        <Link
          href="/"
          locale="ar"
          className={cn(
            'rounded-md px-2 py-1 font-medium transition-colors',
            locale === 'ar' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          AR
        </Link>
        <Link
          href="/"
          locale="en"
          className={cn(
            'rounded-md px-2 py-1 font-medium transition-colors',
            locale === 'en' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          EN
        </Link>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-lg border border-border bg-background p-1',
        className,
      )}
    >
      <Link
        href="/"
        locale="ar"
        className={cn(
          'rounded-md px-2 py-1 text-xs font-medium transition-colors',
          locale === 'ar' ? 'bg-muted text-foreground' : 'text-foreground hover:text-primary',
        )}
      >
        AR
      </Link>
      <Link
        href="/"
        locale="en"
        className={cn(
          'rounded-md px-2 py-1 text-xs font-medium transition-colors',
          locale === 'en' ? 'bg-muted text-foreground' : 'text-foreground hover:text-primary',
        )}
      >
        EN
      </Link>
    </div>
  )
}
