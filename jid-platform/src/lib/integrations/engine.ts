import { createHmac, timingSafeEqual } from 'node:crypto'
import {
  approvedOutboundEvents,
  inboundEnvelopeSchema,
  IntegrationBoundaryError,
  type ApprovedOutboundEvent,
  type InboundEnvelope,
  type IntegrationConnector,
  type IntegrationScope,
  type OutboundEnvelope,
} from './contracts'

export type Authorization = {
  organizationId: string
  connectorKey: string
  scopes: readonly IntegrationScope[]
  revokedAt: string | null
}

const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000
export const MAX_DELIVERY_ATTEMPTS = 5

export class ConnectorRegistry {
  private readonly connectors = new Map<string, IntegrationConnector>()

  register(connector: IntegrationConnector): void {
    if (this.connectors.has(connector.key)) throw new Error(`duplicate_connector:${connector.key}`)
    this.connectors.set(connector.key, connector)
  }

  get(key: string): IntegrationConnector {
    const connector = this.connectors.get(key)
    if (!connector) throw new IntegrationBoundaryError('unknown_connector')
    return connector
  }
}

export function authorize(
  authorization: Authorization,
  organizationId: string,
  requiredScope: IntegrationScope,
): void {
  if (authorization.organizationId !== organizationId || authorization.revokedAt) {
    throw new IntegrationBoundaryError('revoked')
  }
  if (!authorization.scopes.includes(requiredScope)) {
    throw new IntegrationBoundaryError('invalid_scope')
  }
}

export function signWebhook(secret: string, timestamp: string, body: string): string {
  return createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')
}

export function verifyInboundWebhook(input: {
  body: string
  signature: string
  timestamp: string
  secret: string
  now?: Date
}): InboundEnvelope {
  const timestampMs = Date.parse(input.timestamp)
  const nowMs = (input.now ?? new Date()).getTime()
  if (!Number.isFinite(timestampMs) || Math.abs(nowMs - timestampMs) > MAX_CLOCK_SKEW_MS) {
    throw new IntegrationBoundaryError('replay')
  }
  const expected = Buffer.from(signWebhook(input.secret, input.timestamp, input.body), 'hex')
  const received = Buffer.from(input.signature, 'hex')
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    throw new IntegrationBoundaryError('invalid_signature')
  }
  const parsed: unknown = JSON.parse(input.body)
  const result = inboundEnvelopeSchema.safeParse(parsed)
  if (!result.success) throw new IntegrationBoundaryError('invalid_payload')
  return result.data
}

export function buildOutboundEnvelope(input: {
  id: string
  type: ApprovedOutboundEvent
  occurredAt: string
  organizationId: string
  data: Record<string, unknown>
}): OutboundEnvelope {
  if (!approvedOutboundEvents.includes(input.type)) {
    throw new IntegrationBoundaryError('unapproved_event')
  }
  return { version: '1.0', ...input }
}

export function nextDeliveryState(attempts: number): {
  state: 'retry_scheduled' | 'terminal_failure'
  delaySeconds: number | null
} {
  if (attempts >= MAX_DELIVERY_ATTEMPTS) return { state: 'terminal_failure', delaySeconds: null }
  return { state: 'retry_scheduled', delaySeconds: Math.min(30 * 2 ** (attempts - 1), 3600) }
}

/** Explicit allow-list projections. Canonical/private rows must never be passed through. */
export function projectExternalPayload(
  event: ApprovedOutboundEvent,
  source: Record<string, unknown>,
): Record<string, unknown> {
  if (event === 'opportunity.published.v1') {
    return pick(source, ['id', 'title', 'employment_type', 'location', 'published_at'])
  }
  if (event === 'application.submitted.v1') {
    return pick(source, ['id', 'opportunity_id', 'submitted_at', 'status'])
  }
  return pick(source, ['id', 'opportunity_id', 'status', 'changed_at'])
}

function pick(source: Record<string, unknown>, keys: readonly string[]): Record<string, unknown> {
  return Object.fromEntries(keys.filter((key) => source[key] !== undefined).map((key) => [key, source[key]]))
}
