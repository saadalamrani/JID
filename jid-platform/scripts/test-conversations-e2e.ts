/**
 * Live E2E test: mentee encrypts → DB stores ciphertext only → mentor decrypts via Realtime.
 * Run: pnpm tsx scripts/test-conversations-e2e.ts
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (+ anon for Realtime).
 */

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import sodium from 'libsodium-wrappers'

const MENTEE_ID = 'a0000000-0000-4000-8000-000000000002'
const MENTOR_ID = 'e0000000-0000-4000-8000-000000000001'
const PLAINTEXT = `JID E2E test ${Date.now()}`

function loadEnvFile(filename: string): Record<string, string> {
  const filePath = join(process.cwd(), filename)
  if (!existsSync(filePath)) return {}

  const vars: Record<string, string> = {}
  for (const line of readFileSync(filePath, 'utf-8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    vars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
  }
  return vars
}

function check(ok: boolean, label: string, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${label}${detail ? ` — ${detail}` : ''}`)
  if (!ok) process.exitCode = 1
}

function toBase64(bytes: Uint8Array): string {
  return sodium.to_base64(bytes, sodium.base64_variants.ORIGINAL)
}

function fromBase64(value: string): Uint8Array {
  return sodium.from_base64(value, sodium.base64_variants.ORIGINAL)
}

function encryptForRecipient(
  plaintext: string,
  recipientPublicKeyBase64: string,
  senderPrivateKeyBase64: string,
) {
  const message = sodium.from_string(plaintext)
  const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES)
  const ciphertext = sodium.crypto_box_easy(
    message,
    nonce,
    fromBase64(recipientPublicKeyBase64),
    fromBase64(senderPrivateKeyBase64),
  )
  return { ciphertext: toBase64(ciphertext), nonce: toBase64(nonce) }
}

function decryptFromSender(
  ciphertextBase64: string,
  nonceBase64: string,
  senderPublicKeyBase64: string,
  recipientPrivateKeyBase64: string,
): string {
  const plaintext = sodium.crypto_box_open_easy(
    fromBase64(ciphertextBase64),
    fromBase64(nonceBase64),
    fromBase64(senderPublicKeyBase64),
    fromBase64(recipientPrivateKeyBase64),
  )
  return sodium.to_string(plaintext)
}

async function ensureUserKeyPair(
  admin: ReturnType<typeof createClient>,
  userId: string,
): Promise<{ publicKey: string; privateKey: string }> {
  const keyPair = sodium.crypto_box_keypair()
  const privateKey = toBase64(keyPair.privateKey)
  const publicKey = toBase64(keyPair.publicKey)

  const { error } = await admin.from('user_encryption_keys').upsert({
    user_id: userId,
    public_key: publicKey,
    key_version: 1,
  })
  if (error) throw new Error(`key upsert ${userId}: ${error.message}`)
  return { publicKey, privateKey }
}

async function main() {
  const env = { ...loadEnvFile('.env'), ...loadEnvFile('.env.local'), ...process.env }
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !serviceKey) {
    console.log('SKIP: Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for live test.')
    return
  }

  await sodium.ready
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

  const menteeKeys = await ensureUserKeyPair(admin, MENTEE_ID)
  const mentorKeys = await ensureUserKeyPair(admin, MENTOR_ID)

  const { data: conversation, error: convError } = await admin
    .from('conversations')
    .select('id')
    .eq('mentor_id', MENTOR_ID)
    .eq('mentee_id', MENTEE_ID)
    .maybeSingle()

  let conversationId = conversation?.id as string | undefined

  if (!conversationId) {
    const { data: created, error: createError } = await admin
      .from('conversations')
      .insert({ mentor_id: MENTOR_ID, mentee_id: MENTEE_ID })
      .select('id')
      .single()
    if (createError) throw new Error(`conversation create: ${createError.message}`)
    conversationId = created.id
    console.log(`Created test conversation ${conversationId}`)
  }

  const encrypted = encryptForRecipient(PLAINTEXT, mentorKeys.publicKey, menteeKeys.privateKey)

  check(encrypted.ciphertext !== PLAINTEXT, 'ciphertext differs from plaintext')
  check(!encrypted.ciphertext.includes(PLAINTEXT), 'ciphertext does not embed plaintext')

  let realtimeMs = -1
  const realtimePromise = new Promise<void>((resolve, reject) => {
    if (!anonKey) {
      resolve()
      return
    }

    const realtimeClient = createClient(url, anonKey, { auth: { persistSession: false } })
    const started = Date.now()
    const channel = realtimeClient
      .channel(`e2e-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          realtimeMs = Date.now() - started
          const row = payload.new as {
            ciphertext: string
            nonce: string
            sender_id: string
          }
          try {
            const decrypted = decryptFromSender(
              row.ciphertext,
              row.nonce,
              menteeKeys.publicKey,
              mentorKeys.privateKey,
            )
            check(decrypted === PLAINTEXT, 'realtime payload decrypts to original plaintext')
            check(row.ciphertext !== PLAINTEXT, 'realtime row ciphertext is not plaintext')
          } catch (error) {
            reject(error)
            return
          }
          void realtimeClient.removeChannel(channel)
          resolve()
        },
      )
      .subscribe()

    setTimeout(() => {
      void realtimeClient.removeChannel(channel)
      reject(new Error('Realtime timeout after 5s'))
    }, 5000)
  })

  await new Promise((r) => setTimeout(r, 500))

  const { data: inserted, error: insertError } = await admin
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: MENTEE_ID,
      ciphertext: encrypted.ciphertext,
      nonce: encrypted.nonce,
    })
    .select('id, ciphertext, nonce, sender_id')
    .single()

  if (insertError) throw new Error(`message insert: ${insertError.message}`)

  const { data: dbRow, error: dbError } = await admin
    .from('messages')
    .select('id, ciphertext, nonce, sender_id')
    .eq('id', inserted.id)
    .single()

  if (dbError) throw new Error(`message fetch: ${dbError.message}`)

  check(dbRow.ciphertext === encrypted.ciphertext, 'DB stores ciphertext blob')
  check(dbRow.nonce === encrypted.nonce, 'DB stores nonce')
  check(dbRow.ciphertext !== PLAINTEXT, 'DB row has no plaintext leakage')

  const mentorView = decryptFromSender(
    dbRow.ciphertext,
    dbRow.nonce,
    menteeKeys.publicKey,
    mentorKeys.privateKey,
  )
  check(mentorView === PLAINTEXT, 'mentor decrypts stored ciphertext correctly')

  try {
    await realtimePromise
    if (realtimeMs >= 0) {
      check(realtimeMs < 2000, 'realtime delivery under 2s', `${realtimeMs}ms`)
    } else {
      console.log('SKIP: realtime timing (no anon key or event)')
    }
  } catch (error) {
    check(false, 'realtime subscription', error instanceof Error ? error.message : 'failed')
  }

  await admin.from('messages').delete().eq('id', inserted.id)

  console.log('\nConversations live E2E complete.')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
