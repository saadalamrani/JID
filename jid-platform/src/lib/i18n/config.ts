export const locales = ['ar', 'en'] as const

export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'ar'

export const localeLabels: Record<Locale, string> = {
  ar: 'العربية',
  en: 'English',
}

export const localeDirection: Record<Locale, 'rtl' | 'ltr'> = {
  ar: 'rtl',
  en: 'ltr',
}

export const localeConfig = {
  locales,
  defaultLocale,
  labels: localeLabels,
  direction: localeDirection,
} as const

export function isValidLocale(value: string): value is Locale {
  return locales.includes(value as Locale)
}
