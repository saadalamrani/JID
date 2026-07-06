import { z } from 'zod'

export const CRYPTO_BOX_PUBLIC_KEY_BYTES = 32

export const registerEncryptionKeySchema = z.object({
  public_key: z.string().trim().min(1, 'المفتاح العام مطلوب'),
  key_version: z.number().int().positive().optional().default(1),
})

export type RegisterEncryptionKeyInput = z.infer<typeof registerEncryptionKeySchema>

export function isValidPublicKeyBase64(value: string): boolean {
  try {
    const bytes = Buffer.from(value, 'base64')
    return bytes.length === CRYPTO_BOX_PUBLIC_KEY_BYTES
  } catch {
    return false
  }
}
