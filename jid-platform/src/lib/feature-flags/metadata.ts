import type { FlagKey } from '@/lib/feature-flags/keys'
import { FLAG_KEYS } from '@/lib/feature-flags/keys'

export type FlagMetadata = {
  labelAr: string
  labelEn: string
  fallbackMessageAr: string
  fallbackMessageEn: string
}

/** Master Prompt Section 3.2 — display labels and user-facing fallback copy per flag. */
export const FLAG_METADATA: Record<FlagKey, FlagMetadata> = {
  [FLAG_KEYS.PULSE]: {
    labelAr: 'نبض المنصة',
    labelEn: 'Platform Pulse',
    fallbackMessageAr: 'نبض المنصة غير متاح حالياً.',
    fallbackMessageEn: 'Platform Pulse is currently unavailable.',
  },
  [FLAG_KEYS.MENTORSHIP]: {
    labelAr: 'الإرشاد المهني',
    labelEn: 'Mentorship',
    fallbackMessageAr: 'الإرشاد المهني غير متاح حالياً.',
    fallbackMessageEn: 'Mentorship is currently unavailable.',
  },
  [FLAG_KEYS.CV_BUILDER]: {
    labelAr: 'باني السيرة',
    labelEn: 'CV Builder',
    fallbackMessageAr: 'باني السيرة غير متاح حالياً.',
    fallbackMessageEn: 'CV Builder is currently unavailable.',
  },
  [FLAG_KEYS.UNIVERSITIES]: {
    labelAr: 'دليل الجامعات',
    labelEn: 'Universities',
    fallbackMessageAr: 'دليل الجامعات غير متاح حالياً.',
    fallbackMessageEn: 'Universities is currently unavailable.',
  },
  [FLAG_KEYS.RADAR]: {
    labelAr: 'رادار الفرص',
    labelEn: 'Opportunity Radar',
    fallbackMessageAr: 'رادار الفرص غير متاح حالياً.',
    fallbackMessageEn: 'Opportunity Radar is currently unavailable.',
  },
  [FLAG_KEYS.JOBS]: {
    labelAr: 'لوحة الوظائف',
    labelEn: 'Job Board',
    fallbackMessageAr: 'لوحة الوظائف غير متاحة حالياً.',
    fallbackMessageEn: 'Job Board is currently unavailable.',
  },
  [FLAG_KEYS.PROFILE]: {
    labelAr: 'الملف الشخصي',
    labelEn: 'Profile',
    fallbackMessageAr: 'الملف الشخصي غير متاح حالياً.',
    fallbackMessageEn: 'Profile is currently unavailable.',
  },
  [FLAG_KEYS.PULSE_PUBLIC]: {
    labelAr: 'نبض المنصة العام',
    labelEn: 'Public Platform Pulse',
    fallbackMessageAr: 'صفحة نبض المنصة غير متاحة للعامة حالياً.',
    fallbackMessageEn: 'Public Platform Pulse is currently unavailable.',
  },
  [FLAG_KEYS.PULSE_BILLBOARD]: {
    labelAr: 'لوحة الإعلانات',
    labelEn: 'Announcements Billboard',
    fallbackMessageAr: 'لوحة الإعلانات غير متاحة حالياً.',
    fallbackMessageEn: 'Announcements billboard is currently unavailable.',
  },
  [FLAG_KEYS.PULSE_LIVE_METRICS]: {
    labelAr: 'المقاييس الحية',
    labelEn: 'Live Metrics',
    fallbackMessageAr: 'المقاييس الحية غير متاحة حالياً.',
    fallbackMessageEn: 'Live metrics are currently unavailable.',
  },
  [FLAG_KEYS.PULSE_MARKET_TRENDS]: {
    labelAr: 'اتجاهات السوق',
    labelEn: 'Market Trends',
    fallbackMessageAr: 'اتجاهات السوق غير متاحة حالياً.',
    fallbackMessageEn: 'Market trends are currently unavailable.',
  },
  [FLAG_KEYS.UNIVERSITIES_DISCOVER]: {
    labelAr: 'اكتشاف الجامعات',
    labelEn: 'University Discovery',
    fallbackMessageAr: 'اكتشاف الجامعات غير متاح حالياً.',
    fallbackMessageEn: 'University discovery is currently unavailable.',
  },
  [FLAG_KEYS.CV_BUILDER_SMART_HINTS]: {
    labelAr: 'التلميحات الذكية',
    labelEn: 'Smart Hints',
    fallbackMessageAr: 'التلميحات الذكية غير متاحة حالياً.',
    fallbackMessageEn: 'Smart hints are currently unavailable.',
  },
  [FLAG_KEYS.JOBS_SMART_MATCHING]: {
    labelAr: 'المطابقة الذكية',
    labelEn: 'Smart Matching',
    fallbackMessageAr: 'المطابقة الذكية للوظائف غير متاحة حالياً.',
    fallbackMessageEn: 'Job smart matching is currently unavailable.',
  },
  [FLAG_KEYS.JOBS_APPLICATION_ANALYTICS]: {
    labelAr: 'تحليلات التقديم',
    labelEn: 'Application Analytics',
    fallbackMessageAr: 'تحليلات التقديم غير متاحة حالياً.',
    fallbackMessageEn: 'Application analytics are currently unavailable.',
  },
  [FLAG_KEYS.RADAR_REALTIME_UPDATES]: {
    labelAr: 'تحديثات الرادار الفورية',
    labelEn: 'Radar Realtime Updates',
    fallbackMessageAr: 'التحديثات الفورية للرادار غير متاحة حالياً.',
    fallbackMessageEn: 'Radar realtime updates are currently unavailable.',
  },
  [FLAG_KEYS.MENTORSHIP_DISCOVERY]: {
    labelAr: 'اكتشاف المرشدين',
    labelEn: 'Mentorship Discovery',
    fallbackMessageAr: 'اكتشاف المرشدين غير متاح حالياً.',
    fallbackMessageEn: 'Mentorship discovery is currently unavailable.',
  },
}

export function getFlagMetadata(key: FlagKey): FlagMetadata {
  return FLAG_METADATA[key]
}
