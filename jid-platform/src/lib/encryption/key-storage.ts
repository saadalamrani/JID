'use client'

const DB_NAME = 'jid-e2e-keys'
const STORE_NAME = 'privateKeys'
const DB_VERSION = 1

type StoredKeyMaterial = {
  privateKeyBase64: string
  publicKeyBase64: string
}

function storageKey(userId: string): string {
  return `user:${userId}`
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available'))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'))
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
  })
}

/** Section 5.3 — persist keypair locally (never sent to the server). */
export async function storePrivateKeyLocally(
  userId: string,
  privateKeyBase64: string,
  publicKeyBase64: string,
): Promise<void> {
  const db = await openDatabase()
  const payload: StoredKeyMaterial = { privateKeyBase64, publicKeyBase64 }

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.put(payload, storageKey(userId))
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('Failed to store private key'))
  })

  db.close()
}

export async function getLocalPrivateKey(userId: string): Promise<string | null> {
  const material = await getLocalKeyMaterial(userId)
  return material?.privateKeyBase64 ?? null
}

export async function getLocalPublicKey(userId: string): Promise<string | null> {
  const material = await getLocalKeyMaterial(userId)
  return material?.publicKeyBase64 ?? null
}

async function getLocalKeyMaterial(userId: string): Promise<StoredKeyMaterial | null> {
  const db = await openDatabase()

  const value = await new Promise<StoredKeyMaterial | string | null>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.get(storageKey(userId))
    request.onsuccess = () => resolve((request.result as StoredKeyMaterial | string | undefined) ?? null)
    request.onerror = () => reject(request.error ?? new Error('Failed to read private key'))
  })

  db.close()

  if (!value) return null
  if (typeof value === 'string') {
    return { privateKeyBase64: value, publicKeyBase64: '' }
  }
  return value
}
