import { z } from 'zod'
import { CV_LANGUAGE_PROFICIENCY_LEVELS } from '@/types/cv'

export const cvLanguageEntrySchema = z.object({
  name: z.string().trim().min(1, 'اسم اللغة مطلوب').max(80),
  proficiency: z.enum(CV_LANGUAGE_PROFICIENCY_LEVELS, {
    errorMap: () => ({ message: 'مستوى الإتقان غير صالح' }),
  }),
})

export type CvLanguageEntryInput = z.infer<typeof cvLanguageEntrySchema>

export const cvSkillsSectionSchema = z.object({
  technical_skills: z
    .array(z.string().trim().min(1, 'المهارة فارغة').max(80))
    .max(50, 'الحد الأقصى 50 مهارة')
    .default([]),
  languages: z.array(cvLanguageEntrySchema).max(20, 'الحد الأقصى 20 لغة').default([]),
})

export type CvSkillsSectionInput = z.infer<typeof cvSkillsSectionSchema>

export const cvSkillsDbPatchSchema = cvSkillsSectionSchema

export type CvSkillsDbPatch = z.infer<typeof cvSkillsDbPatchSchema>

export function cvRecordToSkillsSectionValues(cv: {
  technical_skills?: string[] | null
  languages?: Array<{ name: string; proficiency: string }> | null
}): CvSkillsSectionInput {
  const languages = (cv.languages ?? [])
    .map((entry) => {
      const parsed = cvLanguageEntrySchema.safeParse(entry)
      return parsed.success ? parsed.data : null
    })
    .filter((entry): entry is CvLanguageEntryInput => entry != null)

  return {
    technical_skills: Array.isArray(cv.technical_skills)
      ? cv.technical_skills.filter((skill) => typeof skill === 'string' && skill.trim())
      : [],
    languages,
  }
}

export function normalizeSkillsPatch(values: CvSkillsSectionInput): CvSkillsDbPatch {
  return {
    technical_skills: values.technical_skills.map((skill) => skill.trim()).filter(Boolean),
    languages: values.languages
      .filter((entry) => entry.name.trim())
      .map((entry) => ({
        name: entry.name.trim(),
        proficiency: entry.proficiency,
      })),
  }
}
