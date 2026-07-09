export type SsisStatus = 'draft' | 'pending_approval' | 'active' | 'closed'
export type SsisBlockKind = 'text' | 'scenario'
export type SsisInvitationStatus = 'sent' | 'started' | 'completed' | 'expired'
export type SsisRecommendation = 'advance' | 'review' | 'decline_recommend'

export type SsisRubricCriterion = {
  criterion_ar: string
  weight: number
  indicators_ar: string[]
}

export type SsisGenerationContext = {
  company: {
    name_ar: string
    name_en: string
    sector: string
    ownership: string
    description_ar: string
  }
  job: {
    title_ar: string
    title_en: string
    description_ar: string
    required_skills: string[]
    experience_level: string
    region: string
  }
}

export type SsisBlock = {
  id: string
  screening_id: string
  kind: SsisBlockKind
  display_order: number
  prompt_ar: string
  rubric: SsisRubricCriterion[]
  ai_generated: boolean
  edited_by_human: boolean
  max_score: number
}

export type SsisScreening = {
  id: string
  job_id: string
  company_id: string
  status: SsisStatus
  generation_context: SsisGenerationContext
  model_version: string | null
  pass_threshold: number
  time_limit_minutes: number
  invitation_validity_days: number
  preview_acknowledged_at: string | null
  preview_acknowledged_by: string | null
  approved_at: string | null
  created_at: string
  blocks?: SsisBlock[]
}

export type SsisInvitation = {
  id: string
  screening_id: string
  application_id: string
  consent_given_at: string | null
  expires_at: string
  started_at: string | null
  completed_at: string | null
  status: SsisInvitationStatus
}

export type SsisCriterionEvaluation = {
  criterion: string
  score: number
  evidence_excerpt: string
}

export type SsisBlockEvaluation = {
  block_id: string
  score: number
  per_criterion: SsisCriterionEvaluation[]
}

export type SsisEvaluation = {
  id: string
  invitation_id: string
  composite_score: number
  per_block: SsisBlockEvaluation[]
  recommendation: SsisRecommendation
  model_version: string
  evaluated_at: string
}

export type SsisResultRow = {
  invitation_id: string
  application_id: string
  applicant_name: string | null
  status: SsisInvitationStatus
  composite_score: number | null
  recommendation: SsisRecommendation | null
  evaluation: SsisEvaluation | null
}

export type SsisTimelineEntry = {
  kind: 'invited' | 'started' | 'completed' | 'evaluated' | 'outcome'
  at: string
  label_ar: string
  recommendation?: SsisRecommendation
}
