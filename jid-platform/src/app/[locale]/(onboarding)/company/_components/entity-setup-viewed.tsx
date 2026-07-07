'use client'

import { useEffect } from 'react'
import { track } from '@/lib/analytics/track'

type EntitySetupViewedProps = {
  companyId: string
  entityType: string
}

export function EntitySetupViewed({ companyId, entityType }: EntitySetupViewedProps) {
  useEffect(() => {
    track('entity_setup_viewed', { company_id: companyId, entity_type: entityType })
  }, [companyId, entityType])

  return null
}
