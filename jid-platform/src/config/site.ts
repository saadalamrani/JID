import { defaultLocale, locales } from '@/lib/i18n/config'

export const siteConfig = {
  name: 'جِد',
  nameEn: 'JID',
  description: 'منصة التوظيف والإرشاد المهني — ربط المواهب بالفرص',
  descriptionEn: 'Employment & mentorship platform — connecting talent with opportunities',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  defaultLocale,
  locales,
  links: {
    github: 'https://github.com/saadalamrani/JID',
    supabase: 'https://supabase.com/dashboard',
  },
  ogImage: '/og-image.png',
} as const

export type SiteConfig = typeof siteConfig
