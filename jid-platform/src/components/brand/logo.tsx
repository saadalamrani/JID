'use client'

import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import { useLocale } from 'next-intl'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export type LogoSize = 'sm' | 'md' | 'lg'

type LogoProps = {
  size?: LogoSize
  className?: string
}

const LOGO_TRANSITION = { duration: 0.25, ease: 'easeInOut' } as const

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

/** Fixed box per size — prevents layout shift when locale or theme changes. */
export const LOGO_SIZE_CONFIG: Record<
  LogoSize,
  { width: number; height: number; className: string }
> = {
  sm: { width: 120, height: 32, className: 'h-8 w-[7.5rem]' },
  md: { width: 140, height: 40, className: 'h-10 w-[8.75rem]' },
  lg: { width: 168, height: 48, className: 'h-12 w-[10.5rem]' },
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
  const { width, height, className: sizeClassName } = LOGO_SIZE_CONFIG[size]

  return (
    <span
      className={cn('relative inline-block shrink-0', sizeClassName, className)}
      style={{ width, height }}
      aria-hidden={false}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={`${localeKey}-${themeKey}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={LOGO_TRANSITION}
          className="absolute inset-0 block"
        >
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            className="h-full w-full object-contain object-left"
            priority
          />
        </motion.span>
      </AnimatePresence>
    </span>
  )
}
