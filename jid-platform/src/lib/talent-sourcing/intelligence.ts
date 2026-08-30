import type { HiringIntelligenceReport } from '@/types/contracts/talent-sourcing'

export type IntelligenceCounts = {
  sourcedCandidates: number
  invitationsSent: number
  responses: number
  applicationsFromSourcing: number
  candidatesWithAnyEvidence: number
  criterionCount: number
}

const WINDOW_DAYS = 30

export function buildHiringIntelligenceReport(input: {
  hiringRoleId: string
  generatedAt: string
  counts: IntelligenceCounts
}): HiringIntelligenceReport {
  const window = `last_${WINDOW_DAYS}_days_asia_riyadh`
  const population = `hiring_role:${input.hiringRoleId}`
  const sourced = input.counts.sourcedCandidates
  const evidenceRatio =
    sourced === 0 || input.counts.criterionCount === 0
      ? 0
      : input.counts.candidatesWithAnyEvidence / sourced

  return {
    hiringRoleId: input.hiringRoleId,
    generatedAt: input.generatedAt,
    metrics: [
      {
        id: 'sourced_candidates',
        labelAr: 'ملفات اكتُشفت ضمن الدور',
        labelEn: 'Discoverable people shown for this role',
        value: sourced,
        unit: 'count',
        source: 'talent_sourcing_events.event_type=search|card_viewed',
        population,
        timeWindow: window,
        coverage: 'counted only when a verified employer search returned the person',
        missingness: sourced === 0 ? 'no searches in window; value is 0, not unknown' : 'complete for logged searches',
      },
      {
        id: 'invitations_sent',
        labelAr: 'دعوات الاهتمام المرسلة',
        labelEn: 'Hiring-interest invitations sent',
        value: input.counts.invitationsSent,
        unit: 'count',
        source: 'talent_sourcing_invitations',
        population,
        timeWindow: window,
        coverage: 'all invitations created for this hiring role in the window',
        missingness: 'withdrawn invitations remain in the count of sent invitations',
      },
      {
        id: 'responses',
        labelAr: 'ردود الأفراد على الدعوات',
        labelEn: 'Individual responses to invitations',
        value: input.counts.responses,
        unit: 'count',
        source: 'talent_sourcing_invitations.state in (interested, declined)',
        population,
        timeWindow: window,
        coverage: 'explicit candidate responses only',
        missingness: 'silence is not counted as decline or interest',
      },
      {
        id: 'applications_from_sourcing',
        labelAr: 'طلبات نتجت بعد دعوة (بفعل الفرد)',
        labelEn: 'Applications after an invitation (candidate-created)',
        value: input.counts.applicationsFromSourcing,
        unit: 'count',
        source: 'talent_sourcing_invitations.application_id linked after candidate apply',
        population,
        timeWindow: window,
        coverage: 'only when the Individual later created an Application for the same role',
        missingness: 'invitation without a later application is not an application',
      },
      {
        id: 'evidence_coverage',
        labelAr: 'تغطية الأدلة المنشورة لأي معيار',
        labelEn: 'Share with published evidence for at least one criterion',
        value: evidenceRatio,
        unit: 'ratio',
        source: 'published profile skills/headline matched to hiring_criteria labels',
        population: `${population}; sourced_candidates=${sourced}`,
        timeWindow: window,
        coverage: 'ratio over sourced people in the window; not a quality or match score',
        missingness:
          sourced === 0
            ? 'no sourced population; ratio is 0 and must not be read as quality'
            : 'missing evidence stays missing; it is not treated as failure',
      },
    ],
  }
}
