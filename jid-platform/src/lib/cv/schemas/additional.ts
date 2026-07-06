import { z } from 'zod'
import { BUILDER_ADDITIONAL_CATEGORIES, type AdditionalCategory, type BuilderAdditionalCategory } from '@/types/cv'
import type { CvAdditionalRecord } from '@/types/cv'

const optionalText = z.string().trim().max(200).optional().or(z.literal(''))
const optionalDescription = z.string().trim().max(2000).optional().or(z.literal(''))
const optionalDate = z.string().trim().optional().or(z.literal(''))

const additionalEntryBase = {
  category: z.enum(
    BUILDER_ADDITIONAL_CATEGORIES as unknown as [
      BuilderAdditionalCategory,
      ...BuilderAdditionalCategory[],
    ],
  ),
  title: z.string().trim().min(1, 'العنوان مطلوب').max(200),
  issuer: optionalText,
  start_date: optionalDate,
  description: optionalDescription,
  sort_order: z.number().int().min(0).default(0),
}

const cvAdditionalEntryObjectSchema = z.object(additionalEntryBase)

export const cvAdditionalEntrySchema = cvAdditionalEntryObjectSchema

export type CvAdditionalEntryInput = z.infer<typeof cvAdditionalEntrySchema>

export const cvAdditionalCreateSchema = cvAdditionalEntryObjectSchema.pick({
  category: true,
  title: true,
  sort_order: true,
})

const dbNullableString = z.union([z.string(), z.null()]).optional()

export const cvAdditionalDbUpdateSchema = z
  .object({
    category: z
      .enum(
        BUILDER_ADDITIONAL_CATEGORIES as unknown as [
          BuilderAdditionalCategory,
          ...BuilderAdditionalCategory[],
        ],
      )
      .optional(),
    title: z.string().trim().min(1, 'العنوان مطلوب').max(200).optional(),
    issuer: dbNullableString,
    start_date: dbNullableString,
    description: dbNullableString,
  })
  .strict()

export type CvAdditionalDbPatch = {
  category?: AdditionalCategory
  title?: string
  issuer?: string | null
  start_date?: string | null
  description?: string | null
  sort_order?: number
}

function emptyStringToNull(value: string | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export function normalizeAdditionalUpdate(values: CvAdditionalEntryInput): CvAdditionalDbPatch {
  return {
    category: values.category,
    title: values.title.trim(),
    issuer: emptyStringToNull(values.issuer),
    start_date: emptyStringToNull(values.start_date),
    description: emptyStringToNull(values.description),
  }
}

export function isBuilderAdditionalCategory(
  category: AdditionalCategory,
): category is BuilderAdditionalCategory {
  return (BUILDER_ADDITIONAL_CATEGORIES as readonly string[]).includes(category)
}

export function additionalRecordToFormValues(entry: CvAdditionalRecord): CvAdditionalEntryInput {
  if (!isBuilderAdditionalCategory(entry.category)) {
    throw new Error(`Unsupported additional category: ${entry.category}`)
  }

  return {
    category: entry.category,
    title: entry.title,
    issuer: entry.issuer ?? '',
    start_date: entry.start_date ?? '',
    description: entry.description ?? '',
    sort_order: entry.sort_order,
  }
}
