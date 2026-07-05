/**
 * Unifonic SMS helpers (client-safe formatting only — API calls run in Edge Functions).
 */

import { toUnifonicRecipient } from './phone'

export type UnifonicSendParams = {
  recipient: string
  body: string
  senderId?: string
}

export function formatUnifonicRecipient(e164Phone: string): string {
  return toUnifonicRecipient(e164Phone)
}

export function buildOtpSmsBody(otp: string, locale: 'ar' | 'en' = 'ar'): string {
  if (locale === 'en') {
    return `Your JID verification code is ${otp}. Valid for 5 minutes. Do not share this code.`
  }
  return `رمز التحقق من جِد: ${otp}. صالح لمدة 5 دقائق. لا تشارك هذا الرمز.`
}

export type UnifonicApiResponse = {
  success: boolean
  message?: string
  errorCode?: string
}
