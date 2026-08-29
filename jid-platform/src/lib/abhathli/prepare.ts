import { extractCareerRecordTokens, tokenizeOpportunityText } from '@/lib/career-operations/intelligence'
import type { AbhathliDraft, AbhathliRecommendation } from './types'
import { sanitizeUntrustedPosting } from './untrusted-posting'

export function prepareApplicationDraft(input: {
  recommendation: AbhathliRecommendation
  careerFacts: ReadonlyArray<{ category: string; payload: Record<string, unknown> }>
  postingText?: string
}): AbhathliDraft {
  const facts = extractCareerRecordTokens(input.careerFacts).filter(Boolean)
  const postingTokens = tokenizeOpportunityText(
    sanitizeUntrustedPosting(
      input.postingText ??
        [input.recommendation.title_ar, input.recommendation.title_en, input.recommendation.organization_name]
          .filter(Boolean)
          .join(' '),
    ),
  )
  const evidenced = new Set(facts)
  const used = facts.filter((token) => postingTokens.includes(token)).slice(0, 8)
  const omitted = postingTokens.filter((token) => !evidenced.has(token)).slice(0, 8)
  const title = input.recommendation.title_ar || input.recommendation.title_en || input.recommendation.opportunity_id
  const org = input.recommendation.organization_name ?? ''

  const usedListAr = used.length > 0 ? used.join('، ') : 'لا توجد حقائق متطابقة من السجل'
  const usedListEn = used.length > 0 ? used.join(', ') : 'no overlapping Career Record facts'
  const omittedListAr = omitted.length > 0 ? omitted.join('، ') : 'لا توجد فجوات مستخرجة'
  const omittedListEn = omitted.length > 0 ? omitted.join(', ') : 'no extracted gaps'

  return {
    opportunity_id: input.recommendation.opportunity_id,
    materials_kind: 'application_prep',
    facts_used: used,
    omitted_unknowns: omitted,
    cover_letter_ar: `مسودة للمراجعة فقط — ليست إرسالاً.\nالعنوان: ${title}\nالجهة: ${org}\nحقائق من السجل استُخدمت: ${usedListAr}\nما لم يُستدل عليه من السجل: ${omittedListAr}\nلم تُختلق أي خبرة.`,
    cover_letter_en: `Draft for review only — not a submission.\nTitle: ${title}\nOrganization: ${org}\nCareer Record facts used: ${usedListEn}\nNot evidenced in the Career Record: ${omittedListEn}\nNo experience was invented.`,
    gap_list_ar: omitted.map((token) => `غير موثّق في السجل: ${token}`),
    gap_list_en: omitted.map((token) => `Not evidenced in Career Record: ${token}`),
    requires_user_review: true,
    invents_experience: false,
  }
}
