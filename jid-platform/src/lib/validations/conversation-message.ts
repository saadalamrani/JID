import { z } from 'zod'

export const sendEncryptedMessageSchema = z.object({
  ciphertext: z.string().trim().min(1, 'النص المشفّر مطلوب'),
  nonce: z.string().trim().min(1, 'nonce مطلوب'),
})

export type SendEncryptedMessageInput = z.infer<typeof sendEncryptedMessageSchema>
