import { z } from 'zod'

export const staffEntityMetadataSchema = z.object({
  entityId: z.string().uuid({ message: 'staff.validation.entityIdInvalid' }),
  sectorId: z.string().uuid().nullable(),
  regionId: z.string().uuid().nullable(),
  descriptionEn: z
    .string()
    .trim()
    .max(5000, { message: 'staff.validation.descriptionMax' })
    .nullable(),
  descriptionAr: z
    .string()
    .trim()
    .max(5000, { message: 'staff.validation.descriptionMax' })
    .nullable(),
  logoUrl: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null))
    .refine((value) => value === null || /^https?:\/\//i.test(value), {
      message: 'staff.validation.logoUrlInvalid',
    }),
  reason: z
    .string()
    .trim()
    .min(3, { message: 'staff.validation.metadataReasonMin' }),
})

export type StaffEntityMetadataInput = z.infer<typeof staffEntityMetadataSchema>
