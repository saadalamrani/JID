import type { OpportunityDiscoveryItem } from '@/lib/opportunity/discovery-types'
import type { AbhathliMandateInput, AbhathliRecommendation } from './types'
import { explainOpportunityAgainstMandate } from './explain'
import { sanitizeUntrustedPosting } from './untrusted-posting'

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase('en-US')
}

function itemText(item: OpportunityDiscoveryItem): string {
  return sanitizeUntrustedPosting(
    [
      item.title.ar,
      item.title.en,
      item.excerpt,
      item.organization_name,
      item.location?.city,
      item.location?.region,
    ]
      .filter(Boolean)
      .join(' '),
  )
}

export function opportunityMatchesMandate(
  item: OpportunityDiscoveryItem,
  mandate: AbhathliMandateInput,
): boolean {
  if (mandate.families.length > 0 && !mandate.families.includes(item.opportunity_family)) {
    return false
  }
  if (mandate.remote_only && item.location?.is_remote !== true) {
    return false
  }
  if (mandate.cities.length > 0) {
    const city = normalize(item.location?.city ?? '')
    const region = normalize(item.location?.region ?? '')
    const wanted = mandate.cities.map(normalize)
    if (!wanted.some((entry) => city.includes(entry) || region.includes(entry))) {
      return false
    }
  }
  if (mandate.keywords.length > 0) {
    const haystack = normalize(itemText(item))
    const matched = mandate.keywords.some((keyword) => haystack.includes(normalize(keyword)))
    if (!matched) return false
  }
  return true
}

export function searchOpportunityGraph(input: {
  inventory: readonly OpportunityDiscoveryItem[]
  mandate: AbhathliMandateInput
  careerFacts: ReadonlyArray<{ category: string; payload: Record<string, unknown> }>
}): AbhathliRecommendation[] {
  const matched = input.inventory.filter((item) => opportunityMatchesMandate(item, input.mandate))
  return matched.map((item) => explainOpportunityAgainstMandate(item, input.mandate, input.careerFacts))
}
