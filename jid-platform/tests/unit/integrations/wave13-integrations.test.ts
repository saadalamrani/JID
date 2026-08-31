import { describe, expect, it } from 'vitest'
import { authorize, ConnectorRegistry, FixtureConnector, IntegrationBoundaryError, MAX_DELIVERY_ATTEMPTS, nextDeliveryState, projectExternalPayload, signWebhook, verifyInboundWebhook } from '@/lib/integrations'

const auth = { organizationId: 'org-a', connectorKey: 'jid_fixture_v1', scopes: ['applications:read'] as const, revokedAt: null }

describe('Wave 13 integration boundary', () => {
  it('enforces tenant, revocation, and scopes', () => {
    expect(() => authorize(auth, 'org-a', 'applications:read')).not.toThrow()
    expect(() => authorize(auth, 'org-b', 'applications:read')).toThrowError('revoked')
    expect(() => authorize({ ...auth, revokedAt: new Date().toISOString() }, 'org-a', 'applications:read')).toThrowError('revoked')
    expect(() => authorize(auth, 'org-a', 'applications:write')).toThrowError('invalid_scope')
  })
  it('fails closed for unknown connectors', () => {
    const registry = new ConnectorRegistry(); registry.register(new FixtureConnector())
    expect(registry.get('jid_fixture_v1').key).toBe('jid_fixture_v1')
    expect(() => registry.get('pretend_ats')).toThrowError(IntegrationBoundaryError)
  })
  it('verifies signatures and rejects replay timestamps', () => {
    const occurredAt = '2026-08-31T12:00:00.000Z'
    const body = JSON.stringify({ id: 'evt-1', type: 'external.application.changed.v1', occurredAt, data: {} })
    const signature = signWebhook('secret', occurredAt, body)
    expect(verifyInboundWebhook({ body, signature, timestamp: occurredAt, secret: 'secret', now: new Date(occurredAt) }).id).toBe('evt-1')
    expect(() => verifyInboundWebhook({ body, signature: '00', timestamp: occurredAt, secret: 'secret', now: new Date(occurredAt) })).toThrowError('invalid_signature')
    expect(() => verifyInboundWebhook({ body, signature, timestamp: occurredAt, secret: 'secret', now: new Date('2026-08-31T12:06:00Z') })).toThrowError('replay')
  })
  it('projects privacy-safe payloads', () => {
    expect(projectExternalPayload('application.submitted.v1', { id: 'app-1', opportunity_id: 'opp-1', status: 'submitted', email: 'private', career_record: {} }))
      .toEqual({ id: 'app-1', opportunity_id: 'opp-1', status: 'submitted' })
  })
  it('bounds retries and terminal failure', () => {
    expect(nextDeliveryState(1)).toEqual({ state: 'retry_scheduled', delaySeconds: 30 })
    expect(nextDeliveryState(MAX_DELIVERY_ATTEMPTS)).toEqual({ state: 'terminal_failure', delaySeconds: null })
  })
  it('keeps fixture mappings traceable', async () => {
    const connector = new FixtureConnector()
    const mapping = { objectType: 'application' as const, jidObjectId: 'jid-1', externalObjectId: 'ext-1', externalVersion: '7' }
    expect(connector.mapExternalObject(mapping)).toEqual(mapping)
    await expect(connector.reconcile(mapping)).resolves.toEqual({ conflict: false })
  })
})
