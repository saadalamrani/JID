import { createHash, randomUUID } from 'crypto'

const INVITE_TTL_DAYS = 7

export function generateInviteToken(): string {
  return `${randomUUID()}${randomUUID()}`
}

export function hashInviteToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function getInviteExpiryIso(): string {
  const expires = new Date()
  expires.setDate(expires.getDate() + INVITE_TTL_DAYS)
  return expires.toISOString()
}

export function buildAcceptInviteUrl(appUrl: string, token: string): string {
  const url = new URL('/staff/accept-invite', appUrl)
  url.searchParams.set('token', token)
  return url.toString()
}
