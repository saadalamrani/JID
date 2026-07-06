'use client'

import { useLocale, useTranslations } from 'next-intl'
import { MultiSelectFilter } from '@/components/filters/multi-select-filter'
import { useMentorFilters } from './mentor-filter-context'

export function ExpertiseAreaFilter() {
  const t = useTranslations('mentorship.discovery.filters')
  const { filters, expertiseAreaOptions, toggleExpertiseArea } = useMentorFilters()

  const options = expertiseAreaOptions.map((value) => ({ value, label: value }))

  return (
    <MultiSelectFilter
      label={t('expertise')}
      options={options}
      selected={filters.expertise_areas}
      onToggle={toggleExpertiseArea}
      emptyLabel={t('expertiseEmpty')}
      selectedLabel={(count) => t('expertiseSelected', { count })}
    />
  )
}

export function SpecializationFilter() {
  const t = useTranslations('mentorship.discovery.filters')
  const locale = useLocale()
  const isEn = locale === 'en'
  const { filters, toggleSpecialization } = useMentorFilters()

  const options = (
    [
      { value: 'career_coaching', labelAr: 'توجيه مهني', labelEn: 'Career coaching' },
      { value: 'interview_prep', labelAr: 'التحضير للمقابلات', labelEn: 'Interview prep' },
      { value: 'leadership', labelAr: 'القيادة', labelEn: 'Leadership' },
      { value: 'entrepreneurship', labelAr: 'ريادة الأعمال', labelEn: 'Entrepreneurship' },
      { value: 'technical_skills', labelAr: 'مهارات تقنية', labelEn: 'Technical skills' },
      { value: 'graduate_transition', labelAr: 'الانتقال بعد التخرج', labelEn: 'Graduate transition' },
    ] as const
  ).map((item) => ({
    value: item.value,
    label: isEn ? item.labelEn : item.labelAr,
  }))

  return (
    <MultiSelectFilter
      label={t('specialization')}
      options={options}
      selected={filters.specializations}
      onToggle={toggleSpecialization}
      emptyLabel={t('specializationEmpty')}
      selectedLabel={(count) => t('specializationSelected', { count })}
    />
  )
}

export function LanguageFilter() {
  const t = useTranslations('mentorship.discovery.filters')
  const locale = useLocale()
  const isEn = locale === 'en'
  const { filters, toggleLanguage } = useMentorFilters()

  const options = (
    [
      { value: 'ar', labelAr: 'العربية', labelEn: 'Arabic' },
      { value: 'en', labelAr: 'الإنجليزية', labelEn: 'English' },
      { value: 'fr', labelAr: 'الفرنسية', labelEn: 'French' },
      { value: 'de', labelAr: 'الألمانية', labelEn: 'German' },
      { value: 'es', labelAr: 'الإسبانية', labelEn: 'Spanish' },
    ] as const
  ).map((item) => ({
    value: item.value,
    label: isEn ? item.labelEn : item.labelAr,
  }))

  return (
    <MultiSelectFilter
      label={t('language')}
      options={options}
      selected={filters.languages}
      onToggle={toggleLanguage}
      emptyLabel={t('languageEmpty')}
      selectedLabel={(count) => t('languageSelected', { count })}
    />
  )
}

export function NationalityFilter() {
  const t = useTranslations('mentorship.discovery.filters')
  const locale = useLocale()
  const isEn = locale === 'en'
  const { filters, toggleNationality } = useMentorFilters()

  const options = (
    [
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
  ).map((item) => ({
    value: item.value,
    label: isEn ? item.labelEn : item.labelAr,
  }))

  return (
    <MultiSelectFilter
      label={t('nationality')}
      options={options}
      selected={filters.nationalities}
      onToggle={toggleNationality}
      emptyLabel={t('nationalityEmpty')}
      selectedLabel={(count) => t('nationalitySelected', { count })}
    />
  )
}
