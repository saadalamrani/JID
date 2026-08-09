'use client'

import { cn } from '@/lib/utils'
import { useLocale } from 'next-intl'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import {
  LOGO_ASSETS,
  LOGO_SIZE_CONFIG,
  logoDisplayWidth,
  type LogoSize,
} from '@/components/brand/logo-assets'

export type { LogoSize } from '@/components/brand/logo-assets'
export { LOGO_SIZE_CONFIG, logoDisplayWidth } from '@/components/brand/logo-assets'

type LogoProps = {
  size?: LogoSize
  className?: string
  /** Force light-on-dark wordmark regardless of site theme toggle. */
  appearance?: 'auto' | 'on-dark'
}

export function Logo({ size = 'md', className, appearance = 'auto' }: LogoProps) {
  const locale = useLocale()
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const isArabic = locale === 'ar'
  const localeKey = isArabic ? 'ar' : 'en'
  const themeKey =
    appearance === 'on-dark' ? 'dark' : mounted && resolvedTheme === 'dark' ? 'dark' : 'light'
  const asset = LOGO_ASSETS[localeKey]
  const src = asset[themeKey]
  const alt = isArabic ? 'جِد' : 'JID'
  const { className: sizeClassName, height } = LOGO_SIZE_CONFIG[size]
  const width = logoDisplayWidth(localeKey, height)

  return (
    // eslint-disable-next-line @next/next/no-img-element -- static brand PNG from /public
    <img
      src={src}
      alt={alt}
      height={height}
      width={width}
      className={cn('block shrink-0 object-contain object-left', sizeClassName, className)}
      decoding="async"
    />
  )
}
