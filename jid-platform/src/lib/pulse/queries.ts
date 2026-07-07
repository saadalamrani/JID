import 'server-only'

import type { AnnouncementCategory } from '@/lib/validations/announcement'
import { createClient } from '@/lib/supabase/server'

export type PlatformMetricsSnapshot = {
  id: number
  refreshed_at: string
  total_candidates: number
  total_companies: number
  active_jobs: number
  total_jobs_ever: number
  total_mentors: number
  total_sessions: number
  jid_response_rate_pct: number
}

export type PulseMetricThreshold = {
  metric_key: string
  label_en: string
  label_ar: string
  min_value: number
  current_value: number
  /** DB column `is_met` — threshold met ⇒ metric may display publicly. */
  is_displayed: boolean
}

export type SectorDemandRow = {
  sector_id: string
  sector_slug: string
  name_en: string
  name_ar: string | null
  active_job_count: number
  application_count: number
  refreshed_at: string
}

export type SkillsDemandRow = {
  skill_name: string
  active_job_count: number
  application_count: number
  refreshed_at: string
}

/** Section 6.4 — public carousel announcement row (RLS-filtered). */
export type PulseAnnouncement = {
  id: string
  title_ar: string
  body_ar: string | null
  category: AnnouncementCategory
  cta_url: string | null
  cta_label_ar: string | null
  is_featured: boolean
  starts_at: string
  expires_at: string
}

/**
 * Section 12 Step 7 — active public announcements (published + in date range via RLS).
 * Featured items surface first, then newest by start time.
 */
export async function fetchActiveAnnouncements(): Promise<PulseAnnouncement[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('public_announcements')
    .select(
      'id, title_ar, body_ar, category, cta_url, cta_label_ar, is_featured, starts_at, expires_at',
    )
    .order('is_featured', { ascending: false })
    .order('starts_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as PulseAnnouncement[]
}

export async function fetchPlatformMetricsSnapshot(): Promise<PlatformMetricsSnapshot | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('platform_metrics_snapshot')
    .select(
      'id, refreshed_at, total_candidates, total_companies, active_jobs, total_jobs_ever, total_mentors, total_sessions, jid_response_rate_pct',
    )
    .eq('id', 1)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null

  return {
    id: Number(data.id),
    refreshed_at: data.refreshed_at,
    total_candidates: Number(data.total_candidates),
    total_companies: Number(data.total_companies),
    active_jobs: Number(data.active_jobs),
    total_jobs_ever: Number(data.total_jobs_ever),
    total_mentors: Number(data.total_mentors),
    total_sessions: Number(data.total_sessions),
    jid_response_rate_pct: Number(data.jid_response_rate_pct),
  }
}

/** Section 6.2 data layer alias — canonical name used by Pulse page. */
export async function fetchPlatformMetrics(): Promise<PlatformMetricsSnapshot | null> {
  return fetchPlatformMetricsSnapshot()
}

export async function fetchPulseMetricThresholds(): Promise<PulseMetricThreshold[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('metric_thresholds')
    .select('metric_key, label_en, label_ar, min_value, current_value, is_met')
    .order('metric_key')

  if (error) throw new Error(error.message)

  return (data ?? []).map((row) => ({
    metric_key: row.metric_key,
    label_en: row.label_en,
    label_ar: row.label_ar,
    min_value: Number(row.min_value),
    current_value: Number(row.current_value),
    is_displayed: row.is_met,
  }))
}

/** Section 6.2 data layer alias — canonical name used by Pulse page. */
export async function fetchThresholds(): Promise<PulseMetricThreshold[]> {
  return fetchPulseMetricThresholds()
}

export async function fetchSectorDemand(): Promise<SectorDemandRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sector_demand_snapshot')
    .select(
      'sector_id, sector_slug, name_en, name_ar, active_job_count, application_count, refreshed_at',
    )
    .gt('active_job_count', 0)
    .order('active_job_count', { ascending: false })
    .limit(10)

  if (error) throw new Error(error.message)
  return (data ?? []) as SectorDemandRow[]
}

export async function fetchSkillsDemand(): Promise<SkillsDemandRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('skills_demand_snapshot')
    .select('skill_name, active_job_count, application_count, refreshed_at')
    .gt('active_job_count', 0)
    .order('active_job_count', { ascending: false })
    .limit(10)

  if (error) throw new Error(error.message)
  return (data ?? []) as SkillsDemandRow[]
}
