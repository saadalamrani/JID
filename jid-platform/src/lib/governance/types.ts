import type { Database } from '@/lib/supabase/types'
import type {
  EmergencyAction,
  FeatureFlag,
  FeatureFlagKey,
  PlatformConfig,
  SysDashboardMetrics,
  UserRole,
} from '@/lib/governance/schemas'

export type FeatureFlagRow = Database['public']['Tables']['feature_flags']['Row']
export type FeatureFlagInsert = Database['public']['Tables']['feature_flags']['Insert']
export type FeatureFlagUpdateRow = Database['public']['Tables']['feature_flags']['Update']

export type PlatformConfigRow = Database['public']['Tables']['platform_config']['Row']
export type PlatformConfigInsert = Database['public']['Tables']['platform_config']['Insert']
export type PlatformConfigUpdateRow = Database['public']['Tables']['platform_config']['Update']

export type EmergencyActionRow = Database['public']['Tables']['emergency_actions']['Row']
export type EmergencyActionInsert = Database['public']['Tables']['emergency_actions']['Insert']
export type EmergencyActionUpdateRow = Database['public']['Tables']['emergency_actions']['Update']

export type SysDashboardMetricsRow = Database['public']['Views']['mv_sys_dashboard_metrics']['Row']

export type {
  EmergencyAction,
  FeatureFlag,
  FeatureFlagKey,
  PlatformConfig,
  SysDashboardMetrics,
  UserRole,
}
