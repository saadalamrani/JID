'use client'

import { useEffect } from 'react'
import { localeConfig, type Locale } from '@/lib/i18n/config'

export function LocaleHtmlAttributes({ locale }: { locale: Locale }) {
  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = localeConfig.direction[locale]
  }, [locale])

  return null
}
