/**
 * Section 4.3 — public mentor discovery constants
 */

export const MENTOR_SPECIALIZATION_OPTIONS = [
  { value: 'career_coaching', labelAr: 'توجيه مهني', labelEn: 'Career coaching' },
  { value: 'interview_prep', labelAr: 'التحضير للمقابلات', labelEn: 'Interview prep' },
  { value: 'leadership', labelAr: 'القيادة', labelEn: 'Leadership' },
  { value: 'entrepreneurship', labelAr: 'ريادة الأعمال', labelEn: 'Entrepreneurship' },
  { value: 'technical_skills', labelAr: 'مهارات تقنية', labelEn: 'Technical skills' },
  { value: 'graduate_transition', labelAr: 'الانتقال بعد التخرج', labelEn: 'Graduate transition' },
] as const

export const MENTOR_NATIONALITY_OPTIONS = [
  { value: 'SA', labelAr: 'السعودية', labelEn: 'Saudi Arabia' },
  { value: 'AE', labelAr: 'الإمارات', labelEn: 'UAE' },
  { value: 'EG', labelAr: 'مصر', labelEn: 'Egypt' },
  { value: 'JO', labelAr: 'الأردن', labelEn: 'Jordan' },
  { value: 'KW', labelAr: 'الكويت', labelEn: 'Kuwait' },
  { value: 'BH', labelAr: 'البحرين', labelEn: 'Bahrain' },
  { value: 'QA', labelAr: 'قطر', labelEn: 'Qatar' },
  { value: 'OM', labelAr: 'عُمان', labelEn: 'Oman' },
  { value: 'LB', labelAr: 'لبنان', labelEn: 'Lebanon' },
  { value: 'OTHER', labelAr: 'أخرى', labelEn: 'Other' },
] as const
