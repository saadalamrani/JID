'use client'

import sodium from 'libsodium-wrappers'
import { getLocalPrivateKey, getLocalPublicKey, storePrivateKeyLocally } from '@/lib/encryption/key-storage'

export type EncryptedMessagePayload = {
  ciphertext: string
  nonce: string
}

export type InitUserKeysResult = {
  publicKey: string
  keyVersion: number
  created: boolean
}

let sodiumReady: Promise<void> | null = null

async function readySodium(): Promise<typeof sodium> {
  if (!sodiumReady) {
    sodiumReady = sodium.ready.then(() => undefined)
  }
  await sodiumReady
  return sodium
}

function toBase64(bytes: Uint8Array): string {
  return sodium.to_base64(bytes, sodium.base64_variants.ORIGINAL)
}

function fromBase64(value: string): Uint8Array {
  return sodium.from_base64(value, sodium.base64_variants.ORIGINAL)
}

async function uploadPublicKey(publicKeyBase64: string, keyVersion = 1): Promise<void> {
  const response = await fetch('/api/me/encryption-key', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      public_key: publicKeyBase64,
      key_version: keyVersion,
    }),
  })

  if (response.status === 401) {
    throw new Error('UNAUTHORIZED')
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error ?? 'Failed to register encryption public key')
  }
}

/**
 * Section 5.3 — generate or restore local keypair and register public key server-side.
 * Private key never leaves the browser (IndexedDB only).
 */
export async function initUserKeys(userId: string): Promise<InitUserKeysResult> {
  await readySodium()

  const existingPrivateKey = await getLocalPrivateKey(userId)
  const existingPublicKey = await getLocalPublicKey(userId)
  if (existingPrivateKey && existingPublicKey) {
    await uploadPublicKey(existingPublicKey)
    return { publicKey: existingPublicKey, keyVersion: 1, created: false }
  }

  const keyPair = sodium.crypto_box_keypair()
  const privateKeyBase64 = toBase64(keyPair.privateKey)
  const publicKeyBase64 = toBase64(keyPair.publicKey)

  await storePrivateKeyLocally(userId, privateKeyBase64, publicKeyBase64)
  await uploadPublicKey(publicKeyBase64)

  return { publicKey: publicKeyBase64, keyVersion: 1, created: true }
}

/** Section 5.3 — encrypt a UTF-8 message for a recipient's public key. */
export async function encryptMessage(
  plaintext: string,
  recipientPublicKeyBase64: string,
  senderPrivateKeyBase64: string,
): Promise<EncryptedMessagePayload> {
  await readySodium()

  const message = sodium.from_string(plaintext)
  const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES)
  const ciphertext = sodium.crypto_box_easy(
    message,
    nonce,
    fromBase64(recipientPublicKeyBase64),
    fromBase64(senderPrivateKeyBase64),
  )

  return {
    ciphertext: toBase64(ciphertext),
    nonce: toBase64(nonce),
  }
}

/** Section 5.3 — decrypt a message using sender public key + recipient private key. */
export async function decryptMessage(
  ciphertextBase64: string,
  nonceBase64: string,
  senderPublicKeyBase64: string,
  recipientPrivateKeyBase64: string,
): Promise<string> {
  await readySodium()

  const plaintext = sodium.crypto_box_open_easy(
    fromBase64(ciphertextBase64),
    fromBase64(nonceBase64),
    fromBase64(senderPublicKeyBase64),
    fromBase64(recipientPrivateKeyBase64),
  )

  return sodium.to_string(plaintext)
}
