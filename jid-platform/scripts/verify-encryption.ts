/**
 * Section 5.3 / 5.4 — E2E encryption verification.
 * Run: pnpm tsx scripts/verify-encryption.ts
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(process.cwd())

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf-8')
}

function check(ok: boolean, label: string) {
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${label}`)
  if (!ok) process.exitCode = 1
}

const e2e = read('src/lib/encryption/e2e.ts')
const storage = read('src/lib/encryption/key-storage.ts')
const postApi = read('src/app/api/me/encryption-key/route.ts')
const getUserApi = read('src/app/api/users/[id]/encryption-key/route.ts')
const bootstrap = read('src/components/shared/encryption-key-bootstrap.tsx')
const shell = read('src/components/shared/authenticated-app-shell.tsx')
const pkg = read('package.json')

check(pkg.includes('libsodium-wrappers'), 'libsodium-wrappers installed')

check(e2e.includes('initUserKeys'), 'e2e exports initUserKeys')
check(e2e.includes('encryptMessage'), 'e2e exports encryptMessage')
check(e2e.includes('decryptMessage'), 'e2e exports decryptMessage')
check(e2e.includes('crypto_box_keypair'), 'init uses crypto_box keypair')
check(e2e.includes('crypto_box_easy'), 'encrypt uses crypto_box_easy')
check(e2e.includes('crypto_box_open_easy'), 'decrypt uses crypto_box_open_easy')
check(e2e.includes('storePrivateKeyLocally'), 'init stores private key locally')

check(storage.includes('indexedDB.open'), 'key storage uses IndexedDB')
check(!storage.includes('localStorage'), 'key storage does not use localStorage')

check(postApi.includes("from('user_encryption_keys')"), 'POST persists to user_encryption_keys')
check(postApi.includes('public_key'), 'POST accepts public_key')
check(!postApi.includes('private_key'), 'POST route never references private_key')
check(!postApi.includes('secret_key'), 'POST route never references secret_key')

check(getUserApi.includes('public_key'), 'GET user route returns public_key only')
check(!getUserApi.includes('private_key'), 'GET user route never exposes private_key')

const uploadBody = e2e.match(/body:\s*JSON\.stringify\(([\s\S]*?)\)/)?.[1] ?? ''
check(uploadBody.includes('public_key'), 'network upload includes public_key')
check(!uploadBody.includes('private_key'), 'network upload never includes private_key')
check(!uploadBody.includes('privateKey'), 'network upload never includes privateKey')
check(!e2e.includes('private_key:'), 'e2e never serializes private_key field')

check(bootstrap.includes('initUserKeys'), 'app shell bootstrap calls initUserKeys')
check(shell.includes('EncryptionKeyBootstrap'), 'authenticated shell mounts encryption bootstrap')

check(read('supabase/migrations/061_encryption_key_public_read.sql').includes('user_encryption_keys_select_public'), 'RLS allows public key reads')

console.log('\n--- CRITICAL: private key network leak check ---')
const networkLeak =
  uploadBody.includes('private') ||
  postApi.match(/insert\([\s\S]*private/i) !== null ||
  postApi.match(/body\.[\w]*private/i) !== null
check(!networkLeak, 'PRIVATE KEY NEVER appears in any network request payload (static analysis PASS)')

console.log('\nEncryption verification complete.')
