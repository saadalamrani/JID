import type { OpportunityDiscoveryItem } from '@/lib/opportunity/discovery-types'
import { extractCareerRecordTokens, tokenizeOpportunityText } from '@/lib/career-operations/intelligence'
import type {
  AbhathliCriterionMatch,
  AbhathliEvidenceLink,
  AbhathliMandateInput,
  AbhathliRecommendation,
} from './types'
import { sanitizeUntrustedPosting } from './untrusted-posting'

function titleOf(item: OpportunityDiscoveryItem): { ar: string | null; en: string | null } {
  return {
    ar: item.title.ar?.trim() || null,
    en: item.title.en?.trim() || null,
  }
}

export function explainOpportunityAgainstMandate(
  item: OpportunityDiscoveryItem,
  mandate: AbhathliMandateInput,
  careerFacts: ReadonlyArray<{ category: string; payload: Record<string, unknown> }>,
): AbhathliRecommendation {
  const haystack = sanitizeUntrustedPosting(
    [item.title.ar, item.title.en, item.excerpt, item.organization_name].filter(Boolean).join(' '),
  )
  const criteria: AbhathliCriterionMatch[] = []

  if (mandate.keywords.length > 0) {
    const lowered = haystack.toLocaleLowerCase('en-US')
    const matchedKeywords = mandate.keywords.filter((keyword) =>
      lowered.includes(keyword.trim().toLocaleLowerCase('en-US')),
    )
    criteria.push({
      key: 'keyword',
      matched: matchedKeywords.length > 0,
      detail: matchedKeywords.join(', ') || mandate.keywords.join(', '),
    })
  }
  if (mandate.families.length > 0) {
    criteria.push({
      key: 'family',
      matched: mandate.families.includes(item.opportunity_family),
      detail: item.opportunity_family,
    })
  }
  if (mandate.cities.length > 0) {
    const city = (item.location?.city ?? '').toLocaleLowerCase('en-US')
    const region = (item.location?.region ?? '').toLocaleLowerCase('en-US')
    const matched = mandate.cities.some((wanted) => {
      const needle = wanted.toLocaleLowerCase('en-US')
      return city.includes(needle) || region.includes(needle)
    })
    criteria.push({
      key: 'location',
      matched,
      detail: [item.location?.city, item.location?.region].filter(Boolean).join(', ') || 'unspecified',
    })
  }
  if (mandate.remote_only) {
    criteria.push({
      key: 'remote',
      matched: item.location?.is_remote === true,
      detail: item.location?.is_remote === true ? 'remote' : 'not_remote_or_unknown',
    })
  }

  const requiredCount = criteria.length
  const matchedCount = criteria.filter((entry) => entry.matched).length
  const recordTokens = extractCareerRecordTokens(careerFacts)
  const postingTokens = tokenizeOpportunityText(haystack)
  const evidenced = new Set(recordTokens)
  const evidenceLinks: AbhathliEvidenceLink[] = []
  const gapsAr: string[] = []
  const gapsEn: string[] = []

  for (const token of postingTokens.slice(0, 12)) {
    if (evidenced.has(token)) {
      evidenceLinks.push({
        category: 'SKILL',
        fact: token,
        relation: 'meets',
      })
    } else if (token.length >= 3) {
      evidenceLinks.push({
        category: 'SKILL',
        fact: token,
        relation: 'missing',
      })
      gapsAr.push(`«${token}» مذكورة في نص الفرصة وغير موثّقة في السجل المهني.`)
      gapsEn.push(`"${token}" appears in the posting and is not evidenced in the Career Record.`)
    }
  }

  const titles = titleOf(item)
  const whyAr = `أُدرجت لأنها تطابق ${matchedCount} من ${requiredCount || 1} شروط البحث الصريحة. ليست نسبة توافق.`
  const whyEn = `Included because it meets ${matchedCount} of ${requiredCount || 1} explicit search criteria. This is not a match percentage.`

  return {
    opportunity_id: item.opportunity_id,
    title_ar: titles.ar,
    title_en: titles.en,
    organization_name: item.organization_name ?? null,
    source_class: item.source_class,
    apply_authority: item.apply_authority,
    apply_url: item.apply_url ?? null,
    expires_at: item.expires_at ?? null,
    criteria_matches: criteria,
    matched_count: matchedCount,
    required_count: requiredCount || 1,
    evidence_links: evidenceLinks.slice(0, 8),
    why_included_ar: whyAr,
    why_included_en: whyEn,
    gaps_ar: gapsAr.slice(0, 5),
    gaps_en: gapsEn.slice(0, 5),
  }
}
