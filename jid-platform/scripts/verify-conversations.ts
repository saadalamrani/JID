/**
 * Sections 4.11 / 5.4 — encrypted conversations chat.
 * Run: pnpm tsx scripts/verify-conversations.ts
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

const listPage = read('src/app/[locale]/(authenticated)/conversations/page.tsx')
const chatPage = read('src/app/[locale]/(authenticated)/conversations/[conversationId]/page.tsx')
const authLayout = read('src/app/[locale]/(authenticated)/layout.tsx')
const bubble = read('src/app/[locale]/(authenticated)/conversations/_components/message-bubble.tsx')
const inputBar = read('src/app/[locale]/(authenticated)/conversations/_components/chat-input-bar.tsx')
const realtime = read('src/lib/hooks/use-realtime-messages.ts')
const postApi = read('src/app/api/conversations/[id]/messages/route.ts')
const sendLib = read('src/lib/conversations/send-message.ts')

check(authLayout.includes('requireAuthenticatedUser'), '(authenticated) layout guards auth')
check(listPage.includes('fetchUserConversations'), 'conversations list page queries server-side')
check(chatPage.includes('ChatWorkspace'), 'conversation detail renders chat workspace')

check(bubble.includes('decryptState'), 'message bubble handles decrypt states')
check(bubble.includes('decrypting'), 'message bubble shows decrypting state')
check(inputBar.includes('encryptMessage'), 'chat input encrypts before send')

const postBody = inputBar.match(/JSON\.stringify\(([\s\S]*?)\)/)?.[1] ?? ''
check(!postBody.includes('plaintext:'), 'client POST body has no plaintext field')
check(postBody.includes('ciphertext'), 'client sends ciphertext only')
check(postBody.includes('nonce'), 'client sends nonce')

check(postApi.includes('insertEncryptedMessage'), 'POST API inserts encrypted message')
check(sendLib.includes('ciphertext') && sendLib.includes('nonce'), 'server stores ciphertext + nonce')
check(!sendLib.includes('plaintext'), 'server insert never uses plaintext')
check(postApi.includes("'plaintext' in raw"), 'API rejects plaintext in request body')

check(realtime.includes('postgres_changes'), 'realtime hook subscribes to messages')
check(realtime.includes('conversation_id=eq'), 'realtime filter by conversation_id')
check(realtime.includes('decryptMessageRow'), 'realtime decrypts on arrival')

check(read('src/app/[locale]/(authenticated)/conversations/_components/encryption-notice.tsx').includes('end-to-end encrypted'), 'first-time encryption notice exists')
check(read('src/app/[locale]/(authenticated)/conversations/_components/chat-workspace.tsx').includes('EncryptionNotice'), 'chat workspace shows encryption notice')

console.log('\nConversations verification complete.')
