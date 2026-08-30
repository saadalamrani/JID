import { assertNoAggregate } from '@/lib/hiring-evidence/evidence-comparison'
import { explainCriterionEvidence, type CriterionRef } from '@/lib/talent-sourcing/relevance'
import type {
  DiscoverableTalentCard,
  SourcingComparisonGrid,
} from '@/types/contracts/talent-sourcing'

export function buildSourcingComparisonGrid(input: {
  hiringRoleId: string
  criteria: readonly CriterionRef[]
  candidates: readonly DiscoverableTalentCard[]
}): SourcingComparisonGrid {
  const grid: SourcingComparisonGrid = {
    hiringRoleId: input.hiringRoleId,
    criteria: input.criteria.map((criterion) => ({
      criterionId: criterion.id,
      labelAr: criterion.labelAr,
      labelEn: criterion.labelEn,
    })),
    rows: input.candidates.map((card) => ({
      profileId: card.profileId,
      displayName: card.displayName,
      cells: input.criteria.map((criterion) => {
        const reason = explainCriterionEvidence(card, criterion)
        return {
          profileId: card.profileId,
          criterionId: criterion.id,
          evidencePresent: reason.evidencePresent,
          observationAr: reason.reasonAr,
          observationEn: reason.reasonEn,
        }
      }),
    })),
  }
  assertNoAggregate(grid, 'sourcing comparison')
  return grid
}
