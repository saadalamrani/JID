/**
 * Harvard Resume Format — strict single-column document (Prompt 1).
 * Section order: Education → Experience → Leadership & Activities → Skills & Interests.
 * No photos, graphics, or decorative elements.
 */

import React from 'react'
import { Document, Link, Page, Text, View } from '@react-pdf/renderer'
import {
  buildContactSegments,
  formatAdditionalItem,
  formatDateRange,
  formatDegreeLine,
  formatGpaLine,
  formatGraduationYearLine,
  getAnchorText,
  LANGUAGE_PROFICIENCY_LABELS,
  sortByOrder,
} from '@/lib/cv/pdf-helpers'
import { HARVARD_PAGE_SIZE, HARVARD_SECTION_LABELS, harvardStyles } from '@/lib/cv/formats/harvard-styles'
import { partitionAdditionalForHarvard } from '@/lib/cv/formats/section-model'
import type {
  CvAdditionalData,
  CvData,
  CvEducationData,
  CvExperienceData,
  CvLanguageEntry,
  CvSkillData,
} from '@/types/cv'

type HarvardDocumentProps = {
  data: CvData
}

export function HarvardDocument({ data }: HarvardDocumentProps) {
  const locale = 'en' as const
  const labels = HARVARD_SECTION_LABELS[locale]
  const { leadership, interests } = partitionAdditionalForHarvard(data.additional)

  return (
    <Document
      title={data.full_name}
      author={data.full_name}
      subject="Harvard Resume"
      creator="JID CV Builder"
      producer="JID"
    >
      <Page size={HARVARD_PAGE_SIZE} style={harvardStyles.page}>
        <HeaderSection data={data} />

        {data.education.length > 0 ? (
          <EducationSection title={labels.education} items={data.education} locale={locale} />
        ) : null}

        {data.experience.length > 0 ? (
          <ExperienceSection title={labels.experience} items={data.experience} locale={locale} />
        ) : null}

        {leadership.length > 0 ? (
          <LeadershipSection title={labels.leadership} items={leadership} locale={locale} />
        ) : null}

        <SkillsInterestsSection
          title={labels.skillsInterests}
          data={data}
          interestItems={interests}
          locale={locale}
          labels={labels}
        />
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
      <Text style={harvardStyles.headerName}>{data.full_name}</Text>
      {segments.length > 0 ? (
        <View style={harvardStyles.headerContactRow}>
          {segments.map((segment, index) => (
            <View key={`contact-${index}`} style={{ flexDirection: 'row' }}>
              {index > 0 ? <Text style={harvardStyles.contactSeparator}> | </Text> : null}
              {segment.kind === 'link' ? (
                <Link src={segment.href} style={harvardStyles.headerContactLink}>
                  {segment.label}
                </Link>
              ) : (
                <Text style={harvardStyles.headerContact}>{segment.value}</Text>
              )}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  )
}

function SectionHeading({ title }: { title: string }) {
  return <Text style={harvardStyles.sectionTitle}>{title}</Text>
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
      <SectionHeading title={title} />
      {sortByOrder(items).map((entry, index) => (
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
  const gradLine = formatGraduationYearLine(entry.graduation_year, locale)
  const locationLine = [entry.institution_city, entry.institution_country]
    .filter((part) => part?.trim())
    .join(', ')

  return (
    <View style={harvardStyles.entryBlock}>
      <View style={harvardStyles.entryRow}>
        <Text style={harvardStyles.entryTitle}>{entry.institution_name}</Text>
        {dates ? <Text style={harvardStyles.entryDate}>{dates}</Text> : null}
      </View>
      {locationLine ? <Text style={harvardStyles.entryDetail}>{locationLine}</Text> : null}
      {degreeLine ? <Text style={harvardStyles.entrySubtitle}>{degreeLine}</Text> : null}
      {gpaLine ? <Text style={harvardStyles.entryDetail}>{gpaLine}</Text> : null}
      {gradLine ? <Text style={harvardStyles.entryDetail}>{gradLine}</Text> : null}
      {entry.honors?.trim() ? <Text style={harvardStyles.entryDetail}>{entry.honors.trim()}</Text> : null}
      {entry.relevant_coursework?.trim() ? (
        <Text style={harvardStyles.entryDetail}>{entry.relevant_coursework.trim()}</Text>
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
      <SectionHeading title={title} />
      {sortByOrder(items).map((entry, index) => (
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
  const locationLine = [entry.company_city, entry.company_country]
    .filter((part) => part?.trim())
    .join(', ')
  const subtitleLine = [entry.job_title, entry.employment_type?.trim()].filter(Boolean).join(' — ')

  return (
    <View style={harvardStyles.entryBlock}>
      <View style={harvardStyles.entryRow}>
        <Text style={harvardStyles.entryTitle}>{entry.company_name}</Text>
        {dates ? <Text style={harvardStyles.entryDate}>{dates}</Text> : null}
      </View>
      <Text style={harvardStyles.entrySubtitle}>{subtitleLine}</Text>
      {locationLine ? <Text style={harvardStyles.entryDetail}>{locationLine}</Text> : null}
      {!locationLine && entry.location?.trim() ? (
        <Text style={harvardStyles.entryDetail}>{entry.location.trim()}</Text>
      ) : null}
      {entry.bullets.map((bullet, bulletIndex) => (
        <View key={`bullet-${bulletIndex}`} style={harvardStyles.bulletRow}>
          <Text style={harvardStyles.bulletMarker}>•</Text>
          <Text style={harvardStyles.bulletText}>{bullet}</Text>
        </View>
      ))}
    </View>
  )
}

function LeadershipSection({
  title,
  items,
  locale,
}: {
  title: string
  items: CvAdditionalData[]
  locale: 'en' | 'ar'
}) {
  return (
    <View>
      <SectionHeading title={title} />
      {sortByOrder(items).map((item, index) => (
        <AdditionalLine key={`lead-${index}`} item={item} locale={locale} />
      ))}
    </View>
  )
}

function SkillsInterestsSection({
  title,
  data,
  interestItems,
  locale,
  labels,
}: {
  title: string
  data: CvData
  interestItems: CvAdditionalData[]
  locale: 'en' | 'ar'
  labels: (typeof HARVARD_SECTION_LABELS)['en']
}) {
  const hasSkills =
    data.technical_skills.length > 0 ||
    data.languages.length > 0 ||
    data.skills.length > 0 ||
    interestItems.length > 0

  if (!hasSkills) return null

  return (
    <View>
      <SectionHeading title={title} />
      {data.technical_skills.length > 0 ? (
        <Text style={harvardStyles.skillsLine}>
          <Text style={harvardStyles.skillsLabel}>{labels.technical}: </Text>
          {data.technical_skills.join(', ')}
        </Text>
      ) : (
        <LegacySkillsLine skills={data.skills} locale={locale} labels={labels} />
      )}
      {data.languages.length > 0 ? (
        <Text style={harvardStyles.skillsLine}>
          <Text style={harvardStyles.skillsLabel}>{labels.languages}: </Text>
          {formatLanguages(data.languages, locale)}
        </Text>
      ) : null}
      {interestItems.length > 0 ? (
        <View style={{ marginTop: 2 }}>
          <Text style={harvardStyles.skillsLabel}>{labels.interests}</Text>
          {sortByOrder(interestItems).map((item, index) => (
            <AdditionalLine key={`int-${index}`} item={item} locale={locale} />
          ))}
        </View>
      ) : null}
    </View>
  )
}

function LegacySkillsLine({
  skills,
  locale: _locale,
  labels,
}: {
  skills: CvSkillData[]
  locale: 'en' | 'ar'
  labels: (typeof HARVARD_SECTION_LABELS)['en']
}) {
  if (skills.length === 0) return null
  const sorted = sortByOrder(skills)
  const line = sorted
    .map((skill) =>
      skill.proficiency?.trim() ? `${skill.skill_name} (${skill.proficiency})` : skill.skill_name,
    )
    .join(', ')

  return (
    <Text style={harvardStyles.skillsLine}>
      <Text style={harvardStyles.skillsLabel}>{labels.technical}: </Text>
      {line}
    </Text>
  )
}

function formatLanguages(languages: CvLanguageEntry[], locale: 'en' | 'ar'): string {
  return languages
    .map((entry) => `${entry.name} (${LANGUAGE_PROFICIENCY_LABELS[locale][entry.proficiency]})`)
    .join(', ')
}

function AdditionalLine({ item, locale }: { item: CvAdditionalData; locale: 'en' | 'ar' }) {
  const line = formatAdditionalItem(item, locale)

  return (
    <View style={harvardStyles.additionalItem}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        <Text style={harvardStyles.additionalItem}>{line}</Text>
        {item.url?.trim() ? (
          <>
            <Text style={harvardStyles.additionalItem}> — </Text>
            <Link src={item.url.trim()} style={harvardStyles.additionalLink}>
              {getAnchorText(item.url.trim())}
            </Link>
          </>
        ) : null}
      </View>
      {item.description?.trim() ? (
        <Text style={harvardStyles.entryDetail}>{item.description.trim()}</Text>
      ) : null}
    </View>
  )
}
