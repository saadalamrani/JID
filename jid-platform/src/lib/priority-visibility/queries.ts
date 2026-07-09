import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { companyHasEntitlement } from '@/lib/monetization/entitlements-server'

export type JobBoostState = {
  isBoosted: boolean
  boostStartsAt: string | null
  boostEndsAt: string | null
}

export type CompanyBoostUsage = {
  quota: number
  activeCount: number
  hasEntitlement: boolean
}

export type JobBoostDailyStat = {
  statDate: string
  impressions: number
  cardOpens: number
  intentClicks: number
  declarations: number
}

export type JobBoostPerformance = {
  stats: JobBoostDailyStat[]
  baselineImpressionsPerDay: number
  boostedImpressionsPerDay: number
  liftMultiplier: number | null
}

export async function fetchJobBoostState(jobId: string): Promise<JobBoostState | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('jobs')
    .select('is_boosted, boost_starts_at, boost_ends_at')
    .eq('id', jobId)
    .maybeSingle()

  if (error || !data) return null

  return {
    isBoosted: data.is_boosted,
    boostStartsAt: data.boost_starts_at,
    boostEndsAt: data.boost_ends_at,
  }
}

export async function fetchCompanyBoostUsage(companyId: string): Promise<CompanyBoostUsage> {
  const supabase = await createClient()
  const hasEntitlement = await companyHasEntitlement(companyId, 'priority_visibility')

  const { data, error } = await supabase.rpc('get_company_boost_usage', {
    p_company_id: companyId,
  })

  if (error || !data?.length) {
    return { quota: 0, activeCount: 0, hasEntitlement }
  }

  const row = data[0] as { quota: number | null; active_count: number | null }
  return {
    quota: row.quota ?? 0,
    activeCount: row.active_count ?? 0,
    hasEntitlement,
  }
}

export async function fetchJobBoostPerformance(jobId: string): Promise<JobBoostPerformance> {
  const supabase = await createClient()

  const [{ data: job }, { data: stats, error }] = await Promise.all([
    supabase.from('jobs').select('boost_starts_at').eq('id', jobId).maybeSingle(),
    supabase
      .from('job_boost_daily_stats')
      .select('stat_date, impressions, card_opens, intent_clicks, declarations')
      .eq('job_id', jobId)
      .order('stat_date', { ascending: true })
      .limit(60),
  ])

  if (error) throw new Error(error.message)

  const rows = (stats ?? []).map((row) => ({
    statDate: row.stat_date,
    impressions: row.impressions,
    cardOpens: row.card_opens,
    intentClicks: row.intent_clicks,
    declarations: row.declarations,
  }))

  const boostStart = job?.boost_starts_at ? new Date(job.boost_starts_at) : null
  let baselineTotal = 0
  let baselineDays = 0
  let boostedTotal = 0
  let boostedDays = 0

  for (const row of rows) {
    const day = new Date(row.statDate)
    if (boostStart && day < boostStart) {
      baselineTotal += row.impressions
      baselineDays += 1
    } else if (boostStart) {
      boostedTotal += row.impressions
      boostedDays += 1
    }
  }

  const baselineImpressionsPerDay = baselineDays > 0 ? baselineTotal / baselineDays : 0
  const boostedImpressionsPerDay = boostedDays > 0 ? boostedTotal / boostedDays : 0
  const liftMultiplier =
    baselineImpressionsPerDay > 0 && boostedImpressionsPerDay > 0
      ? boostedImpressionsPerDay / baselineImpressionsPerDay
      : null

  return {
    stats: rows,
    baselineImpressionsPerDay,
    boostedImpressionsPerDay,
    liftMultiplier,
  }
}
