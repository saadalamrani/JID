import { z } from 'zod'

export const CV_SKILL_PROFICIENCY_LEVELS = [
  'beginner',
  'intermediate',
  'advanced',
  'expert',
] as const

export type CvSkillProficiency = (typeof CV_SKILL_PROFICIENCY_LEVELS)[number]

export const cvSkillEntrySchema = z.object({
  skill_name: z.string().trim().min(1, 'اسم المهارة مطلوب').max(80),
  proficiency: z.enum(CV_SKILL_PROFICIENCY_LEVELS).optional().nullable(),
  sort_order: z.number().int().min(0).default(0),
})

export type CvSkillEntryInput = z.infer<typeof cvSkillEntrySchema>

export const cvSkillListSchema = z
  .array(cvSkillEntrySchema)
  .max(50, 'الحد الأقصى 50 مهارة')

export type CvSkillListInput = z.infer<typeof cvSkillListSchema>
