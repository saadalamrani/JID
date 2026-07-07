import { Resend } from 'https://esm.sh/resend@4.0.1'

export type ResendSendParams = {
  to: string
  subject: string
  html: string
  headers?: Record<string, string>
  tags?: Array<{ name: string; value: string }>
}

export type ResendSendResult = {
  id: string | null
  skipped: boolean
}

let resendClient: Resend | null = null

function getResendClient(): Resend | null {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  if (!apiKey) return null
  if (!resendClient) {
    resendClient = new Resend(apiKey)
  }
  return resendClient
}

export function getResendFromAddress(): string {
  return Deno.env.get('RESEND_FROM_EMAIL') ?? 'JID <onboarding@resend.dev>'
}

/** Send via official Resend SDK — returns provider message id when configured. */
export async function sendResendEmailWithMeta(
  params: ResendSendParams,
): Promise<ResendSendResult> {
  const client = getResendClient()
  if (!client) {
    console.warn('Resend not configured — email skipped', { to: params.to, subject: params.subject })
    return { id: null, skipped: true }
  }

  const result = await client.emails.send({
    from: getResendFromAddress(),
    to: params.to,
    subject: params.subject,
    html: params.html,
    headers: params.headers,
    tags: params.tags,
  })

  if (result.error) {
    throw new Error(result.error.message)
  }

  return { id: result.data?.id ?? null, skipped: false }
}
