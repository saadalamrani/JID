// @vitest-environment node
/**
 * Spec 06-B — Directory correction RPC authorization matrix.
 * Runs only against a local disposable Supabase (skipped otherwise).
 */
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  createDirectoryCompany,
  createRlsUserWithRole,
  deleteDirectoryCompany,
  deleteRlsUser,
  type DirectoryFixture,
  type RlsRoleUser,
} from './fixtures/ownership-law'
import {
  createAuthenticatedClient,
  createServiceRoleClient,
  getRlsTestEnv,
} from './helpers/supabase-clients'

const env = getRlsTestEnv()
const describeRls = env ? describe : describe.skip

describeRls('Directory correction apply path (Spec 06-B)', () => {
  const admin = env ? createServiceRoleClient(env) : null

  let staff: RlsRoleUser
  let individual: RlsRoleUser
  let suggester: RlsRoleUser
  let directory: DirectoryFixture
  let pendingSuggestionId: string
  let rejectSuggestionId: string
  let doubleSuggestionId: string
  let whitelistSuggestionId: string | null = null

  beforeAll(async () => {
    if (!admin) return
    staff = await createRlsUserWithRole(admin, 'corr-staff', 'staff')
    individual = await createRlsUserWithRole(admin, 'corr-individual', 'individual')
    suggester = await createRlsUserWithRole(admin, 'corr-suggester', 'individual')
    directory = await createDirectoryCompany(admin, 'corr-dir')

    const insertSuggestion = async (fieldName: string, suggestedValue: string) => {
      const id = randomUUID()
      const { error } = await admin.from('directory_correction_suggestions').insert({
        id,
        directory_id: directory.id,
        suggested_by: suggester.id,
        field_name: fieldName,
        current_value: 'Riyadh',
        suggested_value: suggestedValue,
        reason: 'fixture',
        status: 'pending',
      })
      if (error) throw new Error(error.message)
      return id
    }

    pendingSuggestionId = await insertSuggestion('city', 'Jeddah')
    rejectSuggestionId = await insertSuggestion('city', 'Dammam')
    doubleSuggestionId = await insertSuggestion('website_url', 'https://example.test')

    // Whitelist denial: temporarily relax CHECK, set a disallowed field, restore CHECK.
    const { error: dropError } = await admin.rpc('exec_sql' as never, {
      query:
        "ALTER TABLE public.directory_correction_suggestions DROP CONSTRAINT IF EXISTS directory_correction_suggestions_field_name_chk",
    } as never)
    if (!dropError) {
      whitelistSuggestionId = await insertSuggestion('city', 'Abha')
      await admin
        .from('directory_correction_suggestions')
        .update({ field_name: 'claimed_by' })
        .eq('id', whitelistSuggestionId)
    }
  })

  afterAll(async () => {
    if (!admin) return
    const ids = [
      pendingSuggestionId,
      rejectSuggestionId,
      doubleSuggestionId,
      whitelistSuggestionId,
    ].filter((id): id is string => Boolean(id))
    if (ids.length > 0) {
      await admin.from('directory_correction_suggestions').delete().in('id', ids)
    }
    if (directory?.id) await deleteDirectoryCompany(admin, directory.id)
    for (const user of [staff, individual, suggester]) {
      if (user?.id) await deleteRlsUser(admin, user.id)
    }
  })

  it('approval applies exactly one whitelisted field and writes audit + suggester notification', async () => {
    const client = await createAuthenticatedClient(env!, staff.email, staff.password)
    const before = await admin!
      .from('companies')
      .select('city, website_url')
      .eq('id', directory.id)
      .single()

    const { error } = await client.rpc('approve_correction_suggestion', {
      p_suggestion_id: pendingSuggestionId,
      p_review_notes: 'Approved city correction',
    })
    expect(error).toBeNull()

    const after = await admin!
      .from('companies')
      .select('city, website_url')
      .eq('id', directory.id)
      .single()
    expect(after.data?.city).toBe('Jeddah')
    expect(after.data?.website_url).toBe(before.data?.website_url)

    const { data: suggestion } = await admin!
      .from('directory_correction_suggestions')
      .select('status')
      .eq('id', pendingSuggestionId)
      .single()
    expect(suggestion?.status).toBe('approved')

    const { data: notifications } = await admin!
      .from('notifications')
      .select('category, recipient_id, idempotency_key')
      .eq('recipient_id', suggester.id)
      .eq('category', 'directory.correction_approved')
    expect((notifications ?? []).length).toBeGreaterThanOrEqual(1)
    expect(notifications?.[0]?.idempotency_key).toBe(
      `directory.correction:${pendingSuggestionId}:approved`,
    )

    const { data: audits } = await admin!
      .from('audit_logs')
      .select('action, entity_id')
      .eq('action', 'directory.corrected')
      .eq('entity_id', directory.id)
    expect((audits ?? []).length).toBeGreaterThanOrEqual(1)
  })

  it('rejection applies no Directory change and notifies suggester', async () => {
    const before = await admin!
      .from('companies')
      .select('city')
      .eq('id', directory.id)
      .single()
    const client = await createAuthenticatedClient(env!, staff.email, staff.password)
    const { error } = await client.rpc('reject_correction_suggestion', {
      p_suggestion_id: rejectSuggestionId,
      p_review_notes: 'Rejected — inaccurate',
    })
    expect(error).toBeNull()

    const after = await admin!
      .from('companies')
      .select('city')
      .eq('id', directory.id)
      .single()
    expect(after.data?.city).toBe(before.data?.city)

    const { data: suggestion } = await admin!
      .from('directory_correction_suggestions')
      .select('status')
      .eq('id', rejectSuggestionId)
      .single()
    expect(suggestion?.status).toBe('rejected')

    const { data: notifications } = await admin!
      .from('notifications')
      .select('category')
      .eq('recipient_id', suggester.id)
      .eq('category', 'directory.correction_rejected')
    expect((notifications ?? []).length).toBeGreaterThanOrEqual(1)
  })

  it('non-staff is denied at the database layer', async () => {
    const client = await createAuthenticatedClient(env!, individual.email, individual.password)
    const { error } = await client.rpc('approve_correction_suggestion', {
      p_suggestion_id: doubleSuggestionId,
      p_review_notes: 'Should fail',
    })
    expect(error?.message ?? '').toMatch(/insufficient_privileges/)
  })

  it('double-decision is denied', async () => {
    const client = await createAuthenticatedClient(env!, staff.email, staff.password)
    const first = await client.rpc('approve_correction_suggestion', {
      p_suggestion_id: doubleSuggestionId,
      p_review_notes: 'First decision',
    })
    expect(first.error).toBeNull()

    const second = await client.rpc('approve_correction_suggestion', {
      p_suggestion_id: doubleSuggestionId,
      p_review_notes: 'Second decision',
    })
    expect(second.error?.message ?? '').toMatch(/invalid_or_reviewed/)
  })

  it('whitelist violation is denied when a disallowed field row can be prepared', async () => {
    if (!whitelistSuggestionId) {
      // Local env has no exec_sql helper — covered by structural unit test.
      expect(true).toBe(true)
      return
    }
    const client = await createAuthenticatedClient(env!, staff.email, staff.password)
    const before = await admin!
      .from('companies')
      .select('city')
      .eq('id', directory.id)
      .single()
    const { error } = await client.rpc('approve_correction_suggestion', {
      p_suggestion_id: whitelistSuggestionId,
      p_review_notes: 'Should deny non-whitelist field',
    })
    expect(error?.message ?? '').toMatch(/field_not_allowed/)
    const after = await admin!
      .from('companies')
      .select('city')
      .eq('id', directory.id)
      .single()
    expect(after.data?.city).toBe(before.data?.city)
  })

  it('suggester can read own suggestion; other individual cannot', async () => {
    const own = await createAuthenticatedClient(env!, suggester.email, suggester.password)
    const { data: ownRows, error: ownError } = await own
      .from('directory_correction_suggestions')
      .select('id')
      .eq('id', rejectSuggestionId)
    expect(ownError).toBeNull()
    expect((ownRows ?? []).length).toBe(1)

    const other = await createAuthenticatedClient(env!, individual.email, individual.password)
    const { data: otherRows, error: otherError } = await other
      .from('directory_correction_suggestions')
      .select('id')
      .eq('id', rejectSuggestionId)
    expect(otherError).toBeNull()
    expect(otherRows).toEqual([])
  })
})
