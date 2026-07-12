// @vitest-environment node
/**
 * Example RLS test — profiles_select_own (036_rls_auth_policies.sql)
 *
 * Rule: authenticated users may SELECT their own profile row (auth.uid() = id)
 * but cannot SELECT another user's private profile.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createPrivateProfileUser, deleteRlsTestUser, type RlsTestUser } from './fixtures/profiles'
import {
  createAuthenticatedClient,
  createServiceRoleClient,
  getRlsTestEnv,
} from './helpers/supabase-clients'

const env = getRlsTestEnv()
const describeRls = env ? describe : describe.skip

describeRls('profiles RLS — select own only', () => {
  const admin = env ? createServiceRoleClient(env) : null
  let userA: RlsTestUser
  let userB: RlsTestUser

  beforeAll(async () => {
    if (!admin || !env) return
    userA = await createPrivateProfileUser(admin, 'user-a')
    userB = await createPrivateProfileUser(admin, 'user-b')
  })

  afterAll(async () => {
    if (!admin) return
    await deleteRlsTestUser(admin, userB.id)
    await deleteRlsTestUser(admin, userA.id)
  })

  it('allows a user to SELECT their own profile row', async () => {
    if (!env) return
    const client = await createAuthenticatedClient(env, userA.email, userA.password)

    const { data, error } = await client.from('profiles').select('id, full_name').eq('id', userA.id).single()

    expect(error).toBeNull()
    expect(data?.id).toBe(userA.id)
    expect(data?.full_name).toBeTruthy()
  })

  it('denies SELECT on another user private profile row', async () => {
    if (!env) return
    const client = await createAuthenticatedClient(env, userA.email, userA.password)

    const { data, error } = await client.from('profiles').select('id').eq('id', userB.id).maybeSingle()

    expect(error).toBeNull()
    expect(data).toBeNull()
  })
})
