import type {
  CvAdditionalData,
  CvData,
  CvEducationData,
  CvExperienceData,
  CvFullRecord,
  CvLanguageEntry,
  CvSkillData,
} from '@/types/cv'
import { CV_LANGUAGE_PROFICIENCY_LEVELS, type CvLanguageProficiency } from '@/types/cv'

export function mapCvFullRecordToCvData(cv: CvFullRecord): CvData {
  return {
    locale: cv.locale === 'en' ? 'en' : 'ar',
    full_name: cv.full_name ?? '',
    email: cv.email,
    phone: cv.phone,
    city: cv.city,
    country: cv.country,
    linkedin_url: cv.linkedin_url,
    github_url: cv.github_url ?? null,
    portfolio_url: cv.portfolio_url ?? null,
    custom_link_1_label: cv.custom_link_1_label ?? null,
    custom_link_1_url: cv.custom_link_1_url ?? null,
    custom_link_2_label: cv.custom_link_2_label ?? null,
    custom_link_2_url: cv.custom_link_2_url ?? null,
    summary: cv.summary,
    technical_skills: cv.technical_skills ?? [],
    languages: parseLanguages(cv.languages),
    education: cv.education.map(mapEducationRow),
    experience: cv.experience.map(mapExperienceRow),
    skills: cv.skills.map(mapSkillRow),
    additional: cv.additional.map(mapAdditionalRow),
  }
}

function parseLanguages(value: CvFullRecord['languages']): CvLanguageEntry[] {
  if (!Array.isArray(value)) return []
  return value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null
      const name = 'name' in entry && typeof entry.name === 'string' ? entry.name.trim() : ''
      const proficiency =
        'proficiency' in entry &&
        typeof entry.proficiency === 'string' &&
        (CV_LANGUAGE_PROFICIENCY_LEVELS as readonly string[]).includes(entry.proficiency)
          ? (entry.proficiency as CvLanguageProficiency)
          : null
      if (!name || !proficiency) return null
      return { name, proficiency }
    })
    .filter((entry): entry is CvLanguageEntry => entry != null)
}

function mapEducationRow(row: CvFullRecord['education'][number]): CvEducationData {
  return {
    institution_name: row.institution_name,
    institution_city: row.institution_city ?? null,
    institution_country: row.institution_country ?? null,
    degree: row.degree,
    field_of_study: row.field_of_study,
    graduation_year: row.graduation_year,
    gpa_value: row.gpa_value,
    gpa_scale: row.gpa_scale,
    honors: row.honors ?? null,
    relevant_coursework: row.relevant_coursework ?? null,
    start_month: row.start_month,
    start_year: row.start_year,
    end_month: row.end_month,
    end_year: row.end_year,
    is_current: row.is_current,
    sort_order: row.sort_order,
  }
}

function mapExperienceRow(row: CvFullRecord['experience'][number]): CvExperienceData {
  return {
    company_name: row.company_name,
    company_city: row.company_city ?? null,
    company_country: row.company_country ?? null,
    job_title: row.job_title,
    location: row.location,
    employment_type: row.employment_type,
    start_month: row.start_month,
    start_year: row.start_year,
    end_month: row.end_month,
    end_year: row.end_year,
    is_current: row.is_current,
    bullets: row.bullets,
    sort_order: row.sort_order,
  }
}

function mapSkillRow(row: CvFullRecord['skills'][number]): CvSkillData {
  return {
    skill_name: row.skill_name,
    proficiency: row.proficiency,
    sort_order: row.sort_order,
  }
}

function mapAdditionalRow(row: CvFullRecord['additional'][number]): CvAdditionalData {
  return {
    category: row.category,
    title: row.title,
    issuer: row.issuer,
    description: row.description,
    start_date: row.start_date,
    end_date: row.end_date,
    url: row.url,
    sort_order: row.sort_order,
  }
}
