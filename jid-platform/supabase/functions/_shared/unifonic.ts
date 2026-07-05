export type UnifonicSendResult = {
  success: boolean
  messageId?: string
  error?: string
}

export async function sendUnifonicSms(recipient: string, body: string): Promise<UnifonicSendResult> {
  const appSid = Deno.env.get('UNIFONIC_APP_SID')
  const senderId = Deno.env.get('UNIFONIC_SENDER_ID') ?? 'JID'

  if (!appSid) {
    console.log('Unifonic skipped: UNIFONIC_APP_SID not configured')
    return { success: true, messageId: 'dev-skip' }
  }

  const params = new URLSearchParams({
    AppSid: appSid,
    SenderID: senderId,
    Body: body,
    Recipient: recipient.replace(/^\+/, ''),
  })

  const response = await fetch('https://el.cloud.unifonic.com/rest/SMS/messages', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  const text = await response.text()

  if (!response.ok) {
    console.error('Unifonic API error', { status: response.status, body: text })
    return { success: false, error: `Unifonic HTTP ${response.status}` }
  }

  console.log('Unifonic SMS dispatched', { recipient, status: response.status })
  return { success: true, messageId: text.slice(0, 120) }
}
