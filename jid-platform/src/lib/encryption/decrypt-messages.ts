'use client'

import { decryptMessage } from '@/lib/encryption/e2e'
import { getLocalPrivateKey } from '@/lib/encryption/key-storage'
import { getCachedMessagePlaintext } from '@/lib/encryption/message-plaintext-cache'
import type { ConversationMessageRow, DecryptedMessage } from '@/types/conversation'

const publicKeyCache = new Map<string, string>()

async function fetchMeetingSummary(meetingId: string) {
  const response = await fetch(`/api/meetings/${meetingId}`, { credentials: 'include' })
  if (!response.ok) return null
  const body = (await response.json()) as { meeting?: ConversationMessageRow['meeting'] }
  return body.meeting ?? null
}

async function fetchUserPublicKey(userId: string): Promise<string> {
  const cached = publicKeyCache.get(userId)
  if (cached) return cached

  const response = await fetch(`/api/users/${userId}/encryption-key`, {
    credentials: 'include',
  })
  if (!response.ok) {
    throw new Error('Failed to load encryption key')
  }
  const body = (await response.json()) as { public_key: string }
  publicKeyCache.set(userId, body.public_key)
  return body.public_key
}

export async function decryptMessageRow(
  row: ConversationMessageRow,
  viewerId: string,
): Promise<DecryptedMessage> {
  if (row.message_type === 'schedule_proposal') {
    let meeting = row.meeting ?? null
    if (!meeting && row.meeting_id) {
      meeting = await fetchMeetingSummary(row.meeting_id)
    }
    return {
      ...row,
      meeting,
      plaintext: null,
      decryptState: 'skip',
    }
  }

  if (!row.ciphertext || !row.nonce) {
    return { ...row, plaintext: null, decryptState: 'error' }
  }
  if (row.sender_id === viewerId) {
    const cached = getCachedMessagePlaintext(row.id)
    if (cached) {
      return { ...row, plaintext: cached, decryptState: 'ready' }
    }
  }

  try {
    const privateKey = await getLocalPrivateKey(viewerId)
    if (!privateKey) {
      return { ...row, plaintext: null, decryptState: 'error' }
    }

    const senderPublicKey = await fetchUserPublicKey(row.sender_id)
    const plaintext = await decryptMessage(
      row.ciphertext,
      row.nonce,
      senderPublicKey,
      privateKey,
    )

    return { ...row, plaintext, decryptState: 'ready' }
  } catch {
    return { ...row, plaintext: null, decryptState: 'error' }
  }
}

export async function decryptMessageRows(
  rows: ConversationMessageRow[],
  viewerId: string,
): Promise<DecryptedMessage[]> {
  return Promise.all(rows.map((row) => decryptMessageRow(row, viewerId)))
}
