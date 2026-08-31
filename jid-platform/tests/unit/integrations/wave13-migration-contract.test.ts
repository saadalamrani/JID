import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const sql = fs.readFileSync(path.join(process.cwd(), 'supabase/migrations/20260831180000_wave13_integrations_foundation.sql'), 'utf8')

describe('Wave 13 database contract', () => {
  it('provides idempotency, retry bounds, audit, conflict state, and RLS', () => {
    expect(sql).toContain('UNIQUE (integration_id, provider_event_id)')
    expect(sql).toContain('attempt_count BETWEEN 0 AND 5')
    expect(sql).toContain('integration_audit_events')
    expect(sql).toContain("state = 'conflict' AND conflict_detail IS NOT NULL")
    expect(sql.match(/ENABLE ROW LEVEL SECURITY/g)?.length).toBe(8)
  })
  it('stores only secret references and validates HTTPS destinations', () => {
    expect(sql).toContain("secret_reference ~ '^(vault|env|kms)://'")
    expect(sql).toContain("destination_url ~ '^https://'")
  })
})
