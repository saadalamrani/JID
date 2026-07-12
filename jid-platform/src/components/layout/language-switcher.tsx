'use client'

import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'
import { cn } from '@/lib/utils'

type LanguageSwitcherProps = {
  className?: string
  variant?: 'inline' | 'compact'
  tone?: 'default' | 'on-dark'
}

/** AR / EN locale toggle — logical inline control for header and profile menu. */
export function LanguageSwitcher({
  className,
  variant = 'inline',
  tone = 'default',
}: LanguageSwitcherProps) {
  const locale = useLocale()
  const t = useTranslations('smartHeader.languageSwitcher')

  const onDark = tone === 'on-dark'
  const activeClass = onDark
    ? 'bg-jid-olive-800 text-jid-beige'
    : 'bg-muted text-foreground'
  const idleClass = onDark
    ? 'text-jid-beige/70 hover:text-jid-beige'
    : 'text-muted-foreground hover:text-foreground'
  const containerClass = onDark
    ? 'border-jid-olive-700/80 bg-jid-olive-800/60'
    : 'border-border bg-background'

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
            locale === 'ar' ? activeClass : idleClass,
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
            locale === 'en' ? activeClass : idleClass,
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
      className={cn('inline-flex items-center rounded-lg border p-1', containerClass, className)}
    >
      <Link
        href="/"
        locale="ar"
        aria-current={locale === 'ar' ? 'true' : undefined}
        className={cn(
          'rounded-md px-2 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          locale === 'ar' ? activeClass : idleClass,
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
          locale === 'en' ? activeClass : idleClass,
        )}
      >
        {t('englishShort')}
      </Link>
    </div>
  )
}
