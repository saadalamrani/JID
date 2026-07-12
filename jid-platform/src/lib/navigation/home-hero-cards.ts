import 'server-only'

import { FLAG_KEYS } from '@/lib/feature-flags/keys'
import { isFeatureEnabled } from '@/lib/feature-flags/server'
import { fetchLatestActiveJob } from '@/lib/queries/jobs'
import { fetchUserApplications } from '@/lib/queries/radar'
import { fetchUpcomingMeetings } from '@/lib/queries/timeline'
import { resolveSmartHeaderSession } from '@/lib/navigation/smart-header-session'
import {
  formatArabicNumber,
  formatArabicPercentage,
} from '@/lib/pulse/format-helpers'
import { METRICS_CONFIG } from '@/lib/pulse/metrics-config'
import type { MetricAccentColor, MetricFormat } from '@/lib/pulse/metrics-config'
import { fetchPlatformMetrics, fetchThresholds } from '@/lib/pulse/queries'
import { isDbOfflineError } from '@/lib/supabase/offline-error'
import { createClient } from '@/lib/supabase/server'
import { partitionTimelineMeetings } from '@/lib/timeline/partition-meetings'
import { formatRelativeTime } from '@/lib/utils/format-relative-time'
import type { ApplicationStatus } from '@/types/application'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { getLocale, getTranslations } from 'next-intl/server'

type UntypedClient = SupabaseClient<Record<string, unknown>>

function asUntyped(client: SupabaseClient<Database>): UntypedClient {
  return client as unknown as UntypedClient
}

const PULSE_METRIC_I18N_KEYS = {
  total_candidates: 'total_candidates',
  directory_coverage: 'directory_coverage',
  verified_profiles: 'verified_profiles',
  total_jobs: 'total_jobs',
  total_mentors: 'total_mentors',
  total_sessions: 'total_sessions',
  response_rate: 'response_rate',
} as const

type PulseMetricI18nKey = keyof typeof PULSE_METRIC_I18N_KEYS

function pulseMetricI18nKey(thresholdKey: string): PulseMetricI18nKey {
  if (thresholdKey in PULSE_METRIC_I18N_KEYS) {
    return thresholdKey as PulseMetricI18nKey
  }
  return 'total_candidates'
}

export type HomeHeroLatestJobCard = {
  kind: 'latest_job'
  href: `/opportunities/${string}`
  title: string
  orgName: string
  relativeTime: string
  publishedAt: string
}

export type HomeHeroPulseMetricCard = {
  kind: 'pulse_metric'
  metricKey: string
  label: string
  valueFormatted: string
  accentColor?: MetricAccentColor
}

export type HomeHeroRadarUpdateCard = {
  kind: 'radar_update'
  href: '/radar'
  statusLabel: string
  relativeTime: string
  jobTitle: string
}

export type HomeHeroMentorshipCard = {
  kind: 'upcoming_session'
  href: '/radar'
  mentorName: string
  scheduledAt: string
  formattedDateTime: string
}

export type HomeHeroProfileCompletionCard = {
  kind: 'profile_completion'
  href: '/profile/edit'
  completionPct: number
  valueFormatted: string
}

export type HomeHeroFloatingCard =
  | HomeHeroLatestJobCard
  | HomeHeroPulseMetricCard
  | HomeHeroRadarUpdateCard
  | HomeHeroMentorshipCard
  | HomeHeroProfileCompletionCard

function pickLocalizedJobTitle(
  locale: string,
  titleAr: string,
  titleEn: string | null,
): string {
  if (locale === 'en' && titleEn?.trim()) return titleEn.trim()
  return titleAr
}

function pickLocalizedOrgName(
  locale: string,
  nameEn: string,
  nameAr: string | null,
): string {
  if (locale === 'en') return nameEn
  return nameAr?.trim() || nameEn
}

function formatMeetingDateTime(iso: string, locale: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString(locale === 'en' ? 'en-US' : 'ar-SA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function formatMetricValue(value: number, format: MetricFormat): string {
  return format === 'percentage' ? formatArabicPercentage(value) : formatArabicNumber(value)
}

async function resolveGuestCards(locale: string): Promise<HomeHeroFloatingCard[]> {
  const cards: HomeHeroFloatingCard[] = []
  const relativeLocale = locale === 'en' ? 'en' : 'ar'

  try {
    const latestJob = await fetchLatestActiveJob()
    if (latestJob) {
      cards.push({
        kind: 'latest_job',
        href: `/opportunities/${latestJob.slug ?? latestJob.id}`,
        title: pickLocalizedJobTitle(locale, latestJob.title_ar, latestJob.title_en),
        orgName: pickLocalizedOrgName(
          locale,
          latestJob.company_name_en,
          latestJob.company_name_ar,
        ),
        relativeTime: formatRelativeTime(latestJob.published_at, relativeLocale),
        publishedAt: latestJob.published_at,
      })
    }
  } catch {
    // Omit card — hero must not crash when job status enum drifts from local migrations.
  }

  try {
    const pulsePublic = await isFeatureEnabled(FLAG_KEYS.PULSE_PUBLIC)
    if (!pulsePublic) return cards

    const [snapshot, thresholds, tPulse] = await Promise.all([
      fetchPlatformMetrics(),
      fetchThresholds(),
      getTranslations('pulse.metrics'),
    ])

    if (!snapshot) return cards

    const thresholdByKey = new Map(thresholds.map((item) => [item.metric_key, item]))
    const priorityMetric = METRICS_CONFIG.find(
      (config) => thresholdByKey.get(config.thresholdKey)?.is_displayed === true,
    )

    if (!priorityMetric) return cards

    const key = pulseMetricI18nKey(priorityMetric.thresholdKey)
    const value = Number(snapshot[priorityMetric.snapshotField] ?? 0)

    cards.push({
      kind: 'pulse_metric',
      metricKey: priorityMetric.thresholdKey,
      label: tPulse(`${key}.label`),
      valueFormatted: formatMetricValue(value, priorityMetric.format),
      accentColor: priorityMetric.accentColor,
    })
  } catch (error) {
    if (!isDbOfflineError(error)) throw error
  }

  return cards
}

async function resolveAuthenticatedIndividualCards(
  userId: string,
  locale: string,
): Promise<HomeHeroFloatingCard[]> {
  const cards: HomeHeroFloatingCard[] = []
  const relativeLocale = locale === 'en' ? 'en' : 'ar'
  const tStatus = await getTranslations('landing.hero.cards.applicationStatus')

  try {
    const { applications, count } = await fetchUserApplications(userId)
    const latest = applications[0]
    if ((count ?? applications.length) > 0 && latest) {
      const jobTitle = latest.job
        ? pickLocalizedJobTitle(locale, latest.job.title_ar, latest.job.title_en)
        : ''
      const statusKey = latest.status as ApplicationStatus
      cards.push({
        kind: 'radar_update',
        href: '/radar',
        statusLabel: tStatus(statusKey),
        relativeTime: formatRelativeTime(latest.updated_at, relativeLocale),
        jobTitle,
      })
    }
  } catch (error) {
    if (!isDbOfflineError(error)) throw error
  }

  try {
    const { meetings } = await fetchUpcomingMeetings(userId)
    const { upcoming } = partitionTimelineMeetings(meetings)
    const next = upcoming.find(
      (meeting) =>
        meeting.scheduled_for && new Date(meeting.scheduled_for).getTime() >= Date.now(),
    )

    if (next?.scheduled_for) {
      const mentorName =
        next.mentor?.profile?.full_name?.trim() ||
        (await getTranslations('landing.hero.cards'))('mentorFallback')
      cards.push({
        kind: 'upcoming_session',
        href: '/radar',
        mentorName,
        scheduledAt: next.scheduled_for,
        formattedDateTime: formatMeetingDateTime(next.scheduled_for, locale),
      })
    }
  } catch (error) {
    if (!isDbOfflineError(error)) throw error
  }

  try {
    const supabase = await createClient()
    const client = asUntyped(supabase)
    const { data: profile, error: profileError } = await client
      .from('profiles')
      .select('profile_completion_pct')
      .eq('id', userId)
      .maybeSingle()

    if (profileError) throw new Error(profileError.message)
    if (!profile) return cards

    const completionPct = Number(
      (profile as { profile_completion_pct?: number }).profile_completion_pct ?? 0,
    )

    cards.push({
      kind: 'profile_completion',
      href: '/profile/edit',
      completionPct,
      valueFormatted: formatArabicPercentage(completionPct),
    })
  } catch (error) {
    if (!isDbOfflineError(error)) throw error
  }

  return cards
}

/** Tasks 4–5 — honestly sourced floating hero cards (max 3 auth / 2 guest). */
export async function resolveHomeHeroCards(): Promise<HomeHeroFloatingCard[]> {
  const [session, locale] = await Promise.all([resolveSmartHeaderSession(), getLocale()])

  if (session.isAuthenticated && session.userId && session.role === 'individual') {
    const personal = await resolveAuthenticatedIndividualCards(session.userId, locale)
    if (personal.length > 0) {
      return personal.slice(0, 3)
    }
    return resolveGuestCards(locale)
  }

  return resolveGuestCards(locale)
}
