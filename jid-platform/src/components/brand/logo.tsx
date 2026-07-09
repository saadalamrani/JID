'use client'

import { cn } from '@/lib/utils'
import { useLocale } from 'next-intl'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export type LogoSize = 'sm' | 'md' | 'lg'

type LogoProps = {
  size?: LogoSize
  className?: string
}

const LOGO_ASSETS = {
  ar: {
    light: '/brand/logo_ar_transparent.png',
    dark: '/brand/logo_ar_white.png',
  },
  en: {
    light: '/brand/logo_full_transparent.png',
    dark: '/brand/logo_full_white.png',
  },
} as const

/** Height-locked — width follows PNG aspect ratio. */
export const LOGO_SIZE_CONFIG: Record<LogoSize, { className: string; height: number }> = {
  sm: { className: 'h-6 w-auto max-h-6', height: 24 },
  md: { className: 'h-8 w-auto max-h-8', height: 32 },
  lg: { className: 'h-12 w-auto max-h-12', height: 48 },
}

export function Logo({ size = 'md', className }: LogoProps) {
  const locale = useLocale()
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const isArabic = locale === 'ar'
  const localeKey = isArabic ? 'ar' : 'en'
  const themeKey = mounted && resolvedTheme === 'dark' ? 'dark' : 'light'
  const src = LOGO_ASSETS[localeKey][themeKey]
  const alt = isArabic ? 'جِد' : 'JID'
  const { className: sizeClassName, height } = LOGO_SIZE_CONFIG[size]

  return (
    // eslint-disable-next-line @next/next/no-img-element -- static brand PNG from /public
    <img
      src={src}
      alt={alt}
      height={height}
      width={Math.round(height * 2.2)}
      className={cn('block shrink-0 object-contain object-left', sizeClassName, className)}
      decoding="async"
    />
  )
}
