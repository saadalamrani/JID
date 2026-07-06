/**
 * Section 6.1 — Harvard-style CV PDF (Section 4.4 section order).
 * Primitives only: Document, Page, View, Text, Link — no HTML, colors, icons, or branding.
 */

import React from 'react'
import { Document, Link, Page, Text, View } from '@react-pdf/renderer'
import type { CvAdditionalData, CvData, CvEducationData, CvExperienceData, CvLanguageEntry, CvSkillData } from '@/types/cv'
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
  SECTION_LABELS,
  sortByOrder,
} from '@/lib/cv/pdf-helpers'
import { PDF_PAGE_SIZE, pdfStyles } from '@/lib/cv/pdf-styles'

type CvDocumentProps = {
  data: CvData
}

export function CvDocument({ data }: CvDocumentProps) {
  const locale = data.locale
  const labels = SECTION_LABELS[locale]

  return (
    <Document
      title={data.full_name}
      author={data.full_name}
      subject="Resume"
      creator="Resume Builder"
      producer="PDF Generator"
    >
      <Page size={PDF_PAGE_SIZE} style={pdfStyles.page}>
        <HeaderSection data={data} />
        {data.summary?.trim() ? <SummarySection summary={data.summary.trim()} /> : null}
        {data.education.length > 0 ? (
          <EducationSection title={labels.education} items={data.education} locale={locale} />
        ) : null}
        {data.experience.length > 0 ? (
          <ExperienceSection title={labels.experience} items={data.experience} locale={locale} />
        ) : null}
        {(data.technical_skills.length > 0 || data.languages.length > 0 || data.skills.length > 0) ? (
          <SkillsSection
            title={labels.skills}
            technicalSkills={data.technical_skills}
            languages={data.languages}
            legacySkills={data.skills}
            locale={locale}
          />
        ) : null}
        {data.additional.length > 0 ? (
          <AdditionalSection items={data.additional} locale={locale} />
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

  return (
    <View>
      <Text style={pdfStyles.headerName}>{data.full_name}</Text>
      {segments.length > 0 ? (
        <View style={pdfStyles.headerContactRow}>
          {segments.map((segment, index) => (
            <View key={`contact-${index}`} style={{ flexDirection: 'row' }}>
              {index > 0 ? <Text style={pdfStyles.contactSeparator}> | </Text> : null}
              {segment.kind === 'link' ? (
                <Link src={segment.href} style={pdfStyles.headerContactLink}>
                  {segment.label}
                </Link>
              ) : (
                <Text style={pdfStyles.headerContact}>{segment.value}</Text>
              )}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  )
}

function SummarySection({ summary }: { summary: string }) {
  return <Text style={pdfStyles.summary}>{summary}</Text>
}

function SectionHeading({ title }: { title: string }) {
  return <Text style={pdfStyles.sectionTitle}>{title}</Text>
}

function EducationSection({
  title,
  items,
  locale,
}: {
  title: string
  items: CvEducationData[]
  locale: 'ar' | 'en'
}) {
  return (
    <View>
      <SectionHeading title={title} />
      {sortByOrder(items).map((entry, index) => (
        <EducationEntry key={`edu-${index}`} entry={entry} locale={locale} />
      ))}
    </View>
  )
}

function EducationEntry({ entry, locale }: { entry: CvEducationData; locale: 'ar' | 'en' }) {
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
  const gradLine = formatGraduationYearLine(entry.graduation_year, locale)
  const locationLine = [entry.institution_city, entry.institution_country]
    .filter((part) => part?.trim())
    .join(', ')

  return (
    <View style={pdfStyles.entryBlock}>
      <View style={pdfStyles.entryRow}>
        <Text style={pdfStyles.entryTitle}>{entry.institution_name}</Text>
        {dates ? <Text style={pdfStyles.entryDate}>{dates}</Text> : null}
      </View>
      {locationLine ? <Text style={pdfStyles.entryDetail}>{locationLine}</Text> : null}
      {degreeLine ? <Text style={pdfStyles.entrySubtitle}>{degreeLine}</Text> : null}
      {gpaLine ? <Text style={pdfStyles.entryDetail}>{gpaLine}</Text> : null}
      {gradLine ? <Text style={pdfStyles.entryDetail}>{gradLine}</Text> : null}
      {entry.honors?.trim() ? <Text style={pdfStyles.entryDetail}>{entry.honors.trim()}</Text> : null}
      {entry.relevant_coursework?.trim() ? (
        <Text style={pdfStyles.entryDetail}>{entry.relevant_coursework.trim()}</Text>
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
  locale: 'ar' | 'en'
}) {
  return (
    <View>
      <SectionHeading title={title} />
      {sortByOrder(items).map((entry, index) => (
        <ExperienceEntry key={`exp-${index}`} entry={entry} locale={locale} />
      ))}
    </View>
  )
}

function ExperienceEntry({ entry, locale }: { entry: CvExperienceData; locale: 'ar' | 'en' }) {
  const dates = formatDateRange(
    entry.start_month,
    entry.start_year,
    entry.end_month,
    entry.end_year,
    entry.is_current,
    locale,
  )
  const locationLine = [entry.company_city, entry.company_country]
    .filter((part) => part?.trim())
    .join(', ')
  const subtitleLine = [entry.job_title, entry.employment_type?.trim()]
    .filter(Boolean)
    .join(' — ')

  return (
    <View style={pdfStyles.entryBlock}>
      <View style={pdfStyles.entryRow}>
        <Text style={pdfStyles.entryTitle}>{entry.company_name}</Text>
        {dates ? <Text style={pdfStyles.entryDate}>{dates}</Text> : null}
      </View>
      <Text style={pdfStyles.entrySubtitle}>{subtitleLine}</Text>
      {locationLine ? <Text style={pdfStyles.entryDetail}>{locationLine}</Text> : null}
      {!locationLine && entry.location?.trim() ? (
        <Text style={pdfStyles.entryDetail}>{entry.location.trim()}</Text>
      ) : null}
      {entry.bullets.map((bullet, bulletIndex) => (
        <View key={`bullet-${bulletIndex}`} style={pdfStyles.bulletRow}>
          <Text style={pdfStyles.bulletMarker}>•</Text>
          <Text style={pdfStyles.bulletText}>{bullet}</Text>
        </View>
      ))}
    </View>
  )
}

function SkillsSection({
  title,
  technicalSkills,
  languages,
  legacySkills,
  locale,
}: {
  title: string
  technicalSkills: string[]
  languages: CvLanguageEntry[]
  legacySkills: CvSkillData[]
  locale: 'ar' | 'en'
}) {
  const skillLines: string[] = []

  if (technicalSkills.length > 0) {
    skillLines.push(technicalSkills.join(locale === 'ar' ? '، ' : ', '))
  } else if (legacySkills.length > 0) {
    const sorted = sortByOrder(legacySkills)
    skillLines.push(
      sorted
        .map((skill) =>
          skill.proficiency?.trim() ? `${skill.skill_name} (${skill.proficiency})` : skill.skill_name,
        )
        .join(locale === 'ar' ? '، ' : ', '),
    )
  }

  if (languages.length > 0) {
    const languageLine = languages
      .map(
        (entry) =>
          `${entry.name} (${LANGUAGE_PROFICIENCY_LABELS[locale][entry.proficiency]})`,
      )
      .join(locale === 'ar' ? '، ' : ', ')
    skillLines.push(`${SECTION_LABELS[locale].languages}: ${languageLine}`)
  }

  return (
    <View>
      <SectionHeading title={title} />
      {skillLines.map((line, index) => (
        <Text key={`skill-line-${index}`} style={pdfStyles.skillsText}>
          {line}
        </Text>
      ))}
    </View>
  )
}

function AdditionalSection({ items, locale }: { items: CvAdditionalData[]; locale: 'ar' | 'en' }) {
  const groups = groupAdditional(items)
  if (groups.length === 0) return null

  return (
    <View>
      {groups.map((group) => (
        <View key={group.category}>
          <Text style={pdfStyles.additionalCategory}>
            {CATEGORY_LABELS[locale][group.category]}
          </Text>
          {group.items.map((item, index) => (
            <AdditionalEntry key={`${group.category}-${index}`} item={item} locale={locale} />
          ))}
        </View>
      ))}
    </View>
  )
}

function AdditionalEntry({ item, locale }: { item: CvAdditionalData; locale: 'ar' | 'en' }) {
  const line = formatAdditionalItem(item, locale)

  return (
    <View style={pdfStyles.additionalItem}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        <Text style={pdfStyles.additionalItem}>{line}</Text>
        {item.url?.trim() ? (
          <>
            <Text style={pdfStyles.additionalItem}> — </Text>
            <Link src={item.url.trim()} style={pdfStyles.additionalLink}>
              {getAnchorText(item.url.trim())}
            </Link>
          </>
        ) : null}
      </View>
      {item.description?.trim() ? (
        <Text style={pdfStyles.entryDetail}>{item.description.trim()}</Text>
      ) : null}
    </View>
  )
}
