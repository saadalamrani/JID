import type { SsisRecommendation } from './types'

export const SSIS_AUTOSAVE_MS = 15_000

export const SSIS_RECOMMENDATION_LABELS_AR: Record<SsisRecommendation, string> = {
  advance: 'يُنصح بالتقدم',
  review: 'يحتاج مراجعة بشرية',
  decline_recommend: 'يُنصح بعدم التقدم',
}

export const SSIS_CONSENT_TEXT_AR =
  'أوافق على معالجة إجاباتي النصية لأغراض التقييم الأولي وفق معايير معلنة. القرار النهائي بشري. لا يُستنتَج أي بيانات بيومترية أو عاطفية.'

export const SSIS_AI_DISCLAIMER_AR =
  'يُقيَّم بمساعدة الذكاء الاصطناعي وفق معايير معلنة، والقرار النهائي بشري.'

export const SSIS_STATIC_NOTE_AR =
  'فحص نصّي/سيناريو فقط — لا فيديو ولا استنتاج بيومتري في النموذج الأول.'
