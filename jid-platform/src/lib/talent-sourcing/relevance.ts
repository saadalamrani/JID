import type {
  DiscoverableTalentCard,
  RelevanceReason,
} from '@/types/contracts/talent-sourcing'

export type CriterionRef = {
  id: string
  labelAr: string
  labelEn: string
}

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function tokens(value: string): string[] {
  return normalize(value)
    .split(/[^a-z0-9\u0600-\u06ff]+/i)
    .filter((token) => token.length >= 3)
}

function publishedText(card: DiscoverableTalentCard): string {
  const skillText = card.skills
    .flatMap((skill) => [skill.name, skill.nameAr ?? ''])
    .join(' ')
  return [
    card.headline ?? '',
    card.about ?? '',
    skillText,
    ...card.targetSectors,
    ...card.targetProgramTypes,
    ...card.targetRegions,
  ].join(' ')
}

function evidenceSupportsCriterion(card: DiscoverableTalentCard, criterion: CriterionRef): boolean {
  const haystack = publishedText(card)
  const haystackNorm = normalize(haystack)
  const labels = [criterion.labelAr, criterion.labelEn].map(normalize).filter(Boolean)
  for (const label of labels) {
    if (label.length >= 2 && haystackNorm.includes(label)) return true
    for (const token of tokens(label)) {
      if (haystackNorm.includes(token)) return true
    }
  }
  return false
}

export function explainCriterionEvidence(
  card: DiscoverableTalentCard,
  criterion: CriterionRef,
): RelevanceReason {
  const evidencePresent = evidenceSupportsCriterion(card, criterion)
  if (evidencePresent) {
    return {
      criterionId: criterion.id,
      criterionLabelAr: criterion.labelAr,
      criterionLabelEn: criterion.labelEn,
      evidencePresent: true,
      reasonAr: `ظهرت هذه الخبرة لأنها تدعم معيار «${criterion.labelAr}».`,
      reasonEn: `This published evidence appears because it supports criterion "${criterion.labelEn}".`,
    }
  }
  return {
    criterionId: criterion.id,
    criterionLabelAr: criterion.labelAr,
    criterionLabelEn: criterion.labelEn,
    evidencePresent: false,
    reasonAr: `لا توجد لدينا أدلة كافية على «${criterion.labelAr}».`,
    reasonEn: `We do not have sufficient published evidence for "${criterion.labelEn}".`,
  }
}

export function explainTalentRelevance(
  card: DiscoverableTalentCard,
  criteria: readonly CriterionRef[],
): RelevanceReason[] {
  return criteria.map((criterion) => explainCriterionEvidence(card, criterion))
}

export function hasAnyCriterionEvidence(
  card: DiscoverableTalentCard,
  criteria: readonly CriterionRef[],
): boolean {
  if (criteria.length === 0) return false
  return criteria.some((criterion) => evidenceSupportsCriterion(card, criterion))
}
