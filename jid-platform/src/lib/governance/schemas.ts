import { z } from 'zod'

/** Mirrors public.user_role_enum (Auth/RBAC 029 + entity admin roles 039). */
export const userRoleSchema = z.enum([
  'individual',
  'entity',
  'company_admin',
  'university_admin',
  'staff',
  'admin',
  'super_admin',
])

export type UserRole = z.infer<typeof userRoleSchema>

export const featureFlagKeySchema = z.enum([
  'catalog',
  'jobs',
  'mentorship',
  'cv_builder',
  'radar',
  'entity_signup',
  'phone_verification',
  'maintenance_mode',
  'pulse.billboard',
])

export type FeatureFlagKey = z.infer<typeof featureFlagKeySchema>

export const featureFlagCategorySchema = z.enum(['modules', 'platform', 'pulse'])

export type FeatureFlagCategory = z.infer<typeof featureFlagCategorySchema>

export const userOverridesSchema = z.record(z.string().uuid(), z.boolean())

export type UserOverridesMap = z.infer<typeof userOverridesSchema>

export const featureFlagSchema = z.object({
  key: z.string().min(1).max(64),
  category: featureFlagCategorySchema,
  label_ar: z.string().min(1),
  label_en: z.string().min(1),
  description_ar: z.string().nullable().optional(),
  description_en: z.string().nullable().optional(),
  is_enabled: z.boolean(),
  min_role: userRoleSchema,
  enabled_for_roles: z.array(userRoleSchema),
  user_overrides: userOverridesSchema,
  created_at: z.string().datetime({ offset: true }).optional(),
  updated_at: z.string().datetime({ offset: true }).optional(),
  updated_by: z.string().uuid().nullable().optional(),
})

export type FeatureFlag = z.infer<typeof featureFlagSchema>

export const featureFlagUpdateSchema = featureFlagSchema
  .pick({
    is_enabled: true,
    min_role: true,
    enabled_for_roles: true,
    user_overrides: true,
    label_ar: true,
    label_en: true,
    description_ar: true,
    description_en: true,
  })
  .partial()

export type FeatureFlagUpdate = z.infer<typeof featureFlagUpdateSchema>

export const platformConfigSchema = z.object({
  key: z.string().min(1).max(128),
  value: z.unknown(),
  description: z.string().nullable().optional(),
  is_secret: z.boolean().default(false),
  category: z.enum(['platform', 'security', 'operations', 'integrations']).default('platform'),
  value_type: z.enum(['string', 'number', 'boolean', 'json']).default('json'),
  updated_at: z.string().datetime({ offset: true }).optional(),
  updated_by: z.string().uuid().nullable().optional(),
})

export type PlatformConfig = z.infer<typeof platformConfigSchema>

export const platformConfigUpdateSchema = platformConfigSchema.pick({ value: true, description: true }).partial()

export type PlatformConfigUpdate = z.infer<typeof platformConfigUpdateSchema>

export const emergencyActionSchema = z.object({
  id: z.string().uuid(),
  action_type: z.string().min(1).max(64),
  reason: z.string().min(3),
  payload: z.record(z.unknown()),
  is_active: z.boolean(),
  activated_by: z.string().uuid(),
  activated_at: z.string().datetime({ offset: true }),
  deactivated_at: z.string().datetime({ offset: true }).nullable().optional(),
  deactivated_by: z.string().uuid().nullable().optional(),
})

export type EmergencyAction = z.infer<typeof emergencyActionSchema>

export const emergencyActionCreateSchema = z.object({
  action_type: z.string().min(1).max(64),
  reason: z.string().min(3),
  payload: z.record(z.unknown()).default({}),
})

export type EmergencyActionCreate = z.infer<typeof emergencyActionCreateSchema>

export const sysDashboardMetricsSchema = z.object({
  id: z.number().int(),
  refreshed_at: z.string().datetime({ offset: true }),
  total_users: z.number().int().nonnegative(),
  suspended_users: z.number().int().nonnegative(),
  active_sessions_now: z.number().int().nonnegative(),
  pending_claims: z.number().int().nonnegative(),
  overdue_claims: z.number().int().nonnegative(),
  audit_events_24h: z.number().int().nonnegative(),
  pending_mentor_applications: z.number().int().nonnegative(),
  pending_staff_invites: z.number().int().nonnegative(),
})

export type SysDashboardMetrics = z.infer<typeof sysDashboardMetricsSchema>
