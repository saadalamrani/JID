import type { CareerEvidence } from '@/types/contracts'
import type { SurfaceState } from '@/lib/ui/surface-state'
import type { CareerEvidenceLifecycleCapabilities } from './operations'

export type CareerRecordViewState =
  | { status: 'loading' }
  | { status: 'unavailable' }
  | { status: 'forbidden' }
  | { status: 'error'; message?: string }
  | { status: 'empty' }
  | { status: 'stale'; items: readonly CareerEvidence[]; asOfLabel?: string }
  | { status: 'ready'; items: readonly CareerEvidence[] }

export function careerRecordSurfaceState(state: CareerRecordViewState): SurfaceState {
  return state.status
}

export type CareerRecordIntentHandlers = {
  onCreateDeclared?: (payload: {
    category: CareerEvidence['category']
    fact_payload: Readonly<Record<string, unknown>>
  }) => void
  onRevise?: (payload: {
    evidence_id: string
    expected_revision_no: number
    fact_payload: Readonly<Record<string, unknown>>
  }) => void
  onLifecycle?: (payload: {
    evidence_id: string
    action: 'archive' | 'dispute' | 'revoke' | 'expire'
  }) => void
  onRetry?: () => void
  lifecycleCapabilities?: CareerEvidenceLifecycleCapabilities
}

export type CvProjectionViewStatus =
  | 'loading'
  | 'unavailable'
  | 'forbidden'
  | 'error'
  | 'empty'
  | 'stale'
  | 'ready'
