/**
 * Global ATS Standard — reverse-chronological, parse-safe single column (Prompt 1).
 * No tables, columns, icons, or graphics.
 */

import React from 'react'
import { Document, Link, Page, Text, View } from '@react-pdf/renderer'
import {
  buildContactSegments,
  CATEGORY_LABELS,
  formatAdditionalItem,
  formatDateRange,
  formatDegreeLine,
  formatGpaLine,
  formatGraduationYearLine,
  getAnchorText,
  groupAdditional,
  LANGUAGE_PROFICIENCY_LABELS,
  sortByOrder,
} from '@/lib/cv/pdf-helpers'
import {
  GLOBAL_ATS_PAGE_SIZE,
  GLOBAL_ATS_SECTION_LABELS,
  globalAtsStyles,
} from '@/lib/cv/formats/global-ats-styles'
import type {
  CvAdditionalData,
  CvData,
  CvEducationData,
  CvExperienceData,
  CvLanguageEntry,
  CvSkillData,
} from '@/types/cv'

type GlobalAtsDocumentProps = {
  data: CvData
}

export function GlobalAtsDocument({ data }: GlobalAtsDocumentProps) {
  const locale = data.locale === 'ar' ? 'ar' : 'en'
  const labels = GLOBAL_ATS_SECTION_LABELS[locale]

  const experienceSorted = sortByOrder(data.experience)
  const educationSorted = sortByOrder(data.education)

  return (
    <Document
      title={data.full_name}
      author={data.full_name}
      subject="ATS Resume"
      creator="JID CV Builder"
      producer="JID"
    >
      <Page size={GLOBAL_ATS_PAGE_SIZE} style={globalAtsStyles.page}>
        <HeaderSection data={data} />

        {data.summary?.trim() ? (
          <View>
            <Text style={globalAtsStyles.sectionTitle}>{labels.summary}</Text>
            <Text style={globalAtsStyles.summary}>{data.summary.trim()}</Text>
          </View>
        ) : null}

        {experienceSorted.length > 0 ? (
          <ExperienceSection title={labels.experience} items={experienceSorted} locale={locale} />
        ) : null}

        {educationSorted.length > 0 ? (
          <EducationSection title={labels.education} items={educationSorted} locale={locale} />
        ) : null}

        {(data.technical_skills.length > 0 ||
          data.languages.length > 0 ||
          data.skills.length > 0) ? (
          <SkillsSection
            title={labels.skills}
            technicalSkills={data.technical_skills}
            languages={data.languages}
            legacySkills={data.skills}
            locale={locale}
            languagesLabel={labels.languages}
          />
        ) : null}

        {data.additional.length > 0 ? (
          <AdditionalSection
            title={labels.additional}
            items={data.additional}
            locale={locale}
          />
        ) : null}
      </Page>
    </Document>
  )
}

function HeaderSection({ data }: { data: CvData }) {
  const segments = buildContactSegments({
    city: data.city,
    country: data.country,
    email: data.email,
    phone: data.phone,
    linkedin_url: data.linkedin_url,
    github_url: data.github_url,
    portfolio_url: data.portfolio_url,
    custom_link_1_label: data.custom_link_1_label,
    custom_link_1_url: data.custom_link_1_url,
    custom_link_2_label: data.custom_link_2_label,
    custom_link_2_url: data.custom_link_2_url,
  })

  const contactLine = segments
    .map((segment) => (segment.kind === 'link' ? segment.label : segment.value))
    .join(' | ')

  return (
    <View>
      <Text style={globalAtsStyles.headerName}>{data.full_name}</Text>
      {contactLine ? <Text style={globalAtsStyles.headerContact}>{contactLine}</Text> : null}
      {segments.some((s) => s.kind === 'link') ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 }}>
          {segments
            .filter((s) => s.kind === 'link')
            .map((segment, index) =>
              segment.kind === 'link' ? (
                <View key={`link-${index}`} style={{ flexDirection: 'row' }}>
                  {index > 0 ? <Text style={globalAtsStyles.headerContact}> | </Text> : null}
                  <Link src={segment.href} style={globalAtsStyles.headerContactLink}>
                    {segment.label}
                  </Link>
                </View>
              ) : null,
            )}
        </View>
      ) : null}
    </View>
  )
}

function ExperienceSection({
  title,
  items,
  locale,
}: {
  title: string
  items: CvExperienceData[]
  locale: 'en' | 'ar'
}) {
  return (
    <View>
      <Text style={globalAtsStyles.sectionTitle}>{title}</Text>
      {items.map((entry, index) => (
        <ExperienceEntry key={`exp-${index}`} entry={entry} locale={locale} />
      ))}
    </View>
  )
}

function ExperienceEntry({ entry, locale }: { entry: CvExperienceData; locale: 'en' | 'ar' }) {
  const dates = formatDateRange(
    entry.start_month,
    entry.start_year,
    entry.end_month,
    entry.end_year,
    entry.is_current,
    locale,
  )

  return (
    <View style={globalAtsStyles.entryBlock}>
      <View style={globalAtsStyles.entryRow}>
        <Text style={globalAtsStyles.entryTitle}>
          {entry.job_title} — {entry.company_name}
        </Text>
        {dates ? <Text style={globalAtsStyles.entryDate}>{dates}</Text> : null}
      </View>
      {entry.bullets.map((bullet, bulletIndex) => (
        <View key={`bullet-${bulletIndex}`} style={globalAtsStyles.bulletRow}>
          <Text style={globalAtsStyles.bulletMarker}>-</Text>
          <Text style={globalAtsStyles.bulletText}>{bullet}</Text>
        </View>
      ))}
    </View>
  )
}

function EducationSection({
  title,
  items,
  locale,
}: {
  title: string
  items: CvEducationData[]
  locale: 'en' | 'ar'
}) {
  return (
    <View>
      <Text style={globalAtsStyles.sectionTitle}>{title}</Text>
      {items.map((entry, index) => (
        <EducationEntry key={`edu-${index}`} entry={entry} locale={locale} />
      ))}
    </View>
  )
}

function EducationEntry({ entry, locale }: { entry: CvEducationData; locale: 'en' | 'ar' }) {
  const dates = formatDateRange(
    entry.start_month,
    entry.start_year,
    entry.end_month,
    entry.end_year,
    entry.is_current,
    locale,
  )
  const degreeLine = formatDegreeLine(entry.degree, entry.field_of_study)
  const gpaLine = formatGpaLine(entry.gpa_value, entry.gpa_scale, locale)

  return (
    <View style={globalAtsStyles.entryBlock}>
      <View style={globalAtsStyles.entryRow}>
        <Text style={globalAtsStyles.entryTitle}>{entry.institution_name}</Text>
        {dates ? <Text style={globalAtsStyles.entryDate}>{dates}</Text> : null}
      </View>
      {degreeLine ? <Text style={globalAtsStyles.entrySubtitle}>{degreeLine}</Text> : null}
      {gpaLine ? <Text style={globalAtsStyles.entryDetail}>{gpaLine}</Text> : null}
    </View>
  )
}

function SkillsSection({
  title,
  technicalSkills,
  languages,
  legacySkills,
  locale,
  languagesLabel,
}: {
  title: string
  technicalSkills: string[]
  languages: CvLanguageEntry[]
  legacySkills: CvSkillData[]
  locale: 'en' | 'ar'
  languagesLabel: string
}) {
  const lines: string[] = []

  if (technicalSkills.length > 0) {
    lines.push(technicalSkills.join(', '))
  } else if (legacySkills.length > 0) {
    lines.push(
      sortByOrder(legacySkills)
        .map((s) => (s.proficiency?.trim() ? `${s.skill_name} (${s.proficiency})` : s.skill_name))
        .join(', '),
    )
  }

  if (languages.length > 0) {
    lines.push(
      `${languagesLabel}: ${languages
        .map((e) => `${e.name} (${LANGUAGE_PROFICIENCY_LABELS[locale][e.proficiency]})`)
        .join(', ')}`,
    )
  }

  return (
    <View>
      <Text style={globalAtsStyles.sectionTitle}>{title}</Text>
      {lines.map((line, index) => (
        <Text key={`skill-${index}`} style={globalAtsStyles.skillsText}>
          {line}
        </Text>
      ))}
    </View>
  )
}

function AdditionalSection({
  title,
  items,
  locale,
}: {
  title: string
  items: CvAdditionalData[]
  locale: 'en' | 'ar'
}) {
  const groups = groupAdditional(items)

  return (
    <View>
      <Text style={globalAtsStyles.sectionTitle}>{title}</Text>
      {groups.map((group) => (
        <View key={group.category}>
          <Text style={globalAtsStyles.entrySubtitle}>
            {CATEGORY_LABELS[locale][group.category]}
          </Text>
          {group.items.map((item, index) => (
            <AdditionalLine key={`${group.category}-${index}`} item={item} locale={locale} />
          ))}
        </View>
      ))}
    </View>
  )
}

function AdditionalLine({ item, locale }: { item: CvAdditionalData; locale: 'en' | 'ar' }) {
  const line = formatAdditionalItem(item, locale)

  return (
    <View style={globalAtsStyles.entryBlock}>
      <Text style={globalAtsStyles.skillsText}>{line}</Text>
      {item.url?.trim() ? (
        <Link src={item.url.trim()} style={globalAtsStyles.headerContactLink}>
          {getAnchorText(item.url.trim())}
        </Link>
      ) : null}
    </View>
  )
}
