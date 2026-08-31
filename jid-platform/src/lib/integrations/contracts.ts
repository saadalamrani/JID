import { z } from 'zod'

export const INTEGRATION_SCOPES = [
  'opportunities:read',
  'opportunities:write',
  'applications:read',
  'applications:write',
  'organizations:read',
] as const

export type IntegrationScope = (typeof INTEGRATION_SCOPES)[number]
export type ExternalObjectType = 'opportunity' | 'application' | 'organization'

export const approvedOutboundEvents = [
  'opportunity.published.v1',
  'application.submitted.v1',
  'application.status_changed.v1',
] as const

export type ApprovedOutboundEvent = (typeof approvedOutboundEvents)[number]

export const inboundEnvelopeSchema = z.object({
  id: z.string().min(1).max(200),
  type: z.string().min(1).max(120),
  occurredAt: z.string().datetime(),
  data: z.record(z.string(), z.unknown()),
})

export type InboundEnvelope = z.infer<typeof inboundEnvelopeSchema>

export type OutboundEnvelope = {
  id: string
  version: '1.0'
  type: ApprovedOutboundEvent
  occurredAt: string
  organizationId: string
  data: Record<string, unknown>
}

export type ExternalMappingInput = {
  objectType: ExternalObjectType
  jidObjectId: string
  externalObjectId: string
  externalVersion?: string
}

export interface IntegrationConnector {
  readonly key: string
  health(): Promise<{ ok: boolean; detail?: string }>
  normalizeInbound(input: unknown): InboundEnvelope
  buildOutbound(event: ApprovedOutboundEvent, source: unknown): Record<string, unknown>
  mapExternalObject(input: ExternalMappingInput): ExternalMappingInput
  pull(cursor?: string): Promise<{ objects: unknown[]; nextCursor?: string }>
  push(payload: OutboundEnvelope): Promise<{ externalId: string }>
  reconcile(mapping: ExternalMappingInput): Promise<{ conflict: boolean; reason?: string }>
}

export class IntegrationBoundaryError extends Error {
  constructor(
    readonly code:
      | 'unknown_connector'
      | 'revoked'
      | 'invalid_scope'
      | 'invalid_signature'
      | 'replay'
      | 'invalid_payload'
      | 'unapproved_event',
  ) {
    super(code)
  }
}
