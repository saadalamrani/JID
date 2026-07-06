'use client'

const STORAGE_PREFIX = 'jid-msg-plaintext:'

export function cacheSentMessagePlaintext(messageId: string, plaintext: string): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.setItem(`${STORAGE_PREFIX}${messageId}`, plaintext)
  } catch {
    // ignore quota errors
  }
}

export function getCachedMessagePlaintext(messageId: string): string | null {
  if (typeof sessionStorage === 'undefined') return null
  try {
    return sessionStorage.getItem(`${STORAGE_PREFIX}${messageId}`)
  } catch {
    return null
  }
}
