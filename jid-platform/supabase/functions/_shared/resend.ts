const RESEND_API = 'https://api.resend.com/emails'

export async function sendResendEmail(params: {
  to: string
  subject: string
  html: string
}): Promise<void> {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  const from = Deno.env.get('RESEND_FROM_EMAIL') ?? 'JID <onboarding@resend.dev>'

  if (!apiKey) {
    console.log('Resend email (not configured)', params)
    return
  }

  const response = await fetch(RESEND_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Resend error: ${response.status} ${body}`)
  }
}
