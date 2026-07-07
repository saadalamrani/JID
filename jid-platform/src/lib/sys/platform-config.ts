import { z } from 'zod'

export const platformConfigValueTypeSchema = z.enum(['string', 'number', 'boolean', 'json'])

export type PlatformConfigValueType = z.infer<typeof platformConfigValueTypeSchema>

export const platformConfigCategorySchema = z.enum([
  'platform',
  'security',
  'operations',
  'integrations',
])

export type PlatformConfigCategory = z.infer<typeof platformConfigCategorySchema>

export const platformConfigRowSchema = z.object({
  key: z.string().min(1).max(128),
  value: z.unknown(),
  description: z.string().nullable().optional(),
  is_secret: z.boolean().default(false),
  category: platformConfigCategorySchema.default('platform'),
  value_type: platformConfigValueTypeSchema.default('json'),
  updated_at: z.string().datetime({ offset: true }).optional(),
  updated_by: z.string().uuid().nullable().optional(),
})

export type PlatformConfigRow = z.infer<typeof platformConfigRowSchema>

/** Parse raw form input according to declared value_type. */
export function parsePlatformConfigInput(
  valueType: PlatformConfigValueType,
  raw: string,
): unknown {
  switch (valueType) {
    case 'boolean': {
      const normalized = raw.trim().toLowerCase()
      if (normalized === 'true') return true
      if (normalized === 'false') return false
      throw new Error('Boolean value must be true or false')
    }
    case 'number': {
      const num = Number(raw.trim())
      if (!Number.isFinite(num)) throw new Error('Invalid number')
      return num
    }
    case 'string':
      return raw
    case 'json': {
      try {
        return JSON.parse(raw) as unknown
      } catch {
        throw new Error('Invalid JSON')
      }
    }
    default:
      throw new Error('Unsupported value type')
  }
}

export function formatPlatformConfigForEdit(
  valueType: PlatformConfigValueType,
  value: unknown,
): string {
  if (valueType === 'json') return JSON.stringify(value ?? {}, null, 2)
  if (valueType === 'boolean') return value === true ? 'true' : 'false'
  if (valueType === 'number') return String(value ?? '')
  return String(value ?? '')
}

export function maskPlatformConfigValue(isSecret: boolean): string {
  return isSecret ? '••••••••' : ''
}
