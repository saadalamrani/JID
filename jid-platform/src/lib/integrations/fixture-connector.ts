import { projectExternalPayload } from './engine'
import {
  inboundEnvelopeSchema,
  type ApprovedOutboundEvent,
  type ExternalMappingInput,
  type IntegrationConnector,
  type OutboundEnvelope,
} from './contracts'

/** Controlled reference connector; never performs network I/O or holds provider credentials. */
export class FixtureConnector implements IntegrationConnector {
  readonly key = 'jid_fixture_v1'

  async health() { return { ok: true } as const }
  normalizeInbound(input: unknown) { return inboundEnvelopeSchema.parse(input) }
  buildOutbound(event: ApprovedOutboundEvent, source: unknown) {
    return projectExternalPayload(event, source as Record<string, unknown>)
  }
  mapExternalObject(input: ExternalMappingInput) { return { ...input } }
  async pull() { return { objects: [] } }
  async push(payload: OutboundEnvelope) { return { externalId: `fixture:${payload.id}` } }
  async reconcile(_mapping: ExternalMappingInput) { return { conflict: false } }
}
