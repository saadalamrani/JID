export const MENTOR_LANGUAGE_OPTIONS = [
  { value: 'ar', labelAr: 'العربية', labelEn: 'Arabic' },
  { value: 'en', labelAr: 'الإنجليزية', labelEn: 'English' },
  { value: 'fr', labelAr: 'الفرنسية', labelEn: 'French' },
  { value: 'de', labelAr: 'الألمانية', labelEn: 'German' },
  { value: 'es', labelAr: 'الإسبانية', labelEn: 'Spanish' },
] as const

export const MENTOR_MEDIUM_OPTIONS = [
  { value: 'video', labelAr: 'مكالمة فيديو', labelEn: 'Video call' },
  { value: 'voice', labelAr: 'مكالمة صوتية', labelEn: 'Voice call' },
  { value: 'chat', labelAr: 'محادثة نصية', labelEn: 'Text chat' },
  { value: 'in_person', labelAr: 'لقاء حضوري', labelEn: 'In person' },
] as const

export type MentorLanguageValue = (typeof MENTOR_LANGUAGE_OPTIONS)[number]['value']
export type MentorMediumValue = (typeof MENTOR_MEDIUM_OPTIONS)[number]['value']
