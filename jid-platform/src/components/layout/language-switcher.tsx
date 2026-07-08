'use client'

import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'
import { cn } from '@/lib/utils'

type LanguageSwitcherProps = {
  className?: string
  variant?: 'inline' | 'compact'
}

/** AR / EN locale toggle — logical inline control for header and profile menu. */
export function LanguageSwitcher({ className, variant = 'inline' }: LanguageSwitcherProps) {
  const locale = useLocale()
  const t = useTranslations('smartHeader.languageSwitcher')

  if (variant === 'compact') {
    return (
      <div
        role="group"
        aria-label={t('groupLabel')}
        className={cn('flex items-center gap-1 text-sm', className)}
      >
        <Link
          href="/"
          locale="ar"
          aria-current={locale === 'ar' ? 'true' : undefined}
          className={cn(
            'rounded-md px-2 py-1 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            locale === 'ar' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {t('arabic')}
        </Link>
        <Link
          href="/"
          locale="en"
          aria-current={locale === 'en' ? 'true' : undefined}
          className={cn(
            'rounded-md px-2 py-1 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            locale === 'en' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {t('english')}
        </Link>
      </div>
    )
  }

  return (
    <div
      role="group"
      aria-label={t('groupLabel')}
      className={cn(
        'inline-flex items-center rounded-lg border border-border bg-background p-1',
        className,
      )}
    >
      <Link
        href="/"
        locale="ar"
        aria-current={locale === 'ar' ? 'true' : undefined}
        className={cn(
          'rounded-md px-2 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          locale === 'ar' ? 'bg-muted text-foreground' : 'text-foreground hover:text-primary',
        )}
      >
        {t('arabicShort')}
      </Link>
      <Link
        href="/"
        locale="en"
        aria-current={locale === 'en' ? 'true' : undefined}
        className={cn(
          'rounded-md px-2 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          locale === 'en' ? 'bg-muted text-foreground' : 'text-foreground hover:text-primary',
        )}
      >
        {t('englishShort')}
      </Link>
    </div>
  )
}
