import 'server-only'

import { fetchJobs } from '@/lib/queries/jobs'
import { fetchLammahPageState } from '@/lib/lammah/server'
import { DEFAULT_JOB_FILTERS, type JobFilters } from '@/types/job'
import type { LammahPageState } from '@/types/lammah'
import type { OpportunityDiscoveryItem, OpportunityDiscoveryPage } from './discovery-types'
import { mapLammahCardToDiscoveryItem } from './map-lammah'
import { mapNativeJobToDiscoveryItem } from './map-native'
import { sortOpportunityDiscovery } from './sort'

export type ListOpportunityDiscoveryInput = {
  nativeFilters?: JobFilters
  includeExternal?: boolean
}

const EMPTY_LAMMAH: LammahPageState = {
  entitled: false,
  available: false,
  data: { items: [], count: 0 },
}

/**
 * Canonical Opportunity Graph discovery loader for Wave 3.
 * Native listing is always attempted. External listing is entitlement-gated
 * inside fetchLammahPageState (no protected rows when unentitled).
 */
export async function listOpportunityDiscovery(
  input: ListOpportunityDiscoveryInput = {},
): Promise<OpportunityDiscoveryPage> {
  const includeExternal = input.includeExternal !== false
  const nativeResult = await fetchJobs({
    ...DEFAULT_JOB_FILTERS,
    ...input.nativeFilters,
    limit: input.nativeFilters?.limit ?? 50,
    page: input.nativeFilters?.page ?? 1,
  })

  const native = nativeResult.jobs.map(mapNativeJobToDiscoveryItem)

  let external: OpportunityDiscoveryItem[] = []
  let externalEntitled = false
  let externalAvailable = true
  let externalLammahState: LammahPageState = EMPTY_LAMMAH

  if (includeExternal) {
    const lammah = await fetchLammahPageState()
    externalLammahState = lammah
    externalEntitled = lammah.entitled
    externalAvailable = lammah.available
    if (lammah.entitled) {
      external = lammah.data.items.map((card) => mapLammahCardToDiscoveryItem(card))
    }
  }

  return {
    native,
    external,
    externalEntitled,
    externalAvailable,
    merged: sortOpportunityDiscovery([...native, ...external]),
    nativeJobsResult: nativeResult,
    externalLammahState,
  }
}

export async function listNativeDiscoveryOpportunities(
  filters?: JobFilters,
): Promise<OpportunityDiscoveryItem[]> {
  const page = await listOpportunityDiscovery({
    nativeFilters: filters,
    includeExternal: false,
  })
  return page.native
}

export async function listExternalDiscoveryOpportunities(): Promise<{
  entitled: boolean
  available: boolean
  items: OpportunityDiscoveryItem[]
}> {
  const page = await listOpportunityDiscovery({ includeExternal: true })
  return {
    entitled: page.externalEntitled,
    available: page.externalAvailable,
    items: page.external,
  }
}
