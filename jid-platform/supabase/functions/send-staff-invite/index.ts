import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { createServiceClient, getUserFromRequest } from '../_shared/supabase.ts'

type InviteEmailBody = {
  email?: string
  inviteUrl?: string
  reason?: string
}

async function sendViaResend(params: {
  to: string
  subject: string
  html: string
}): Promise<void> {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  const from = Deno.env.get('RESEND_FROM_EMAIL') ?? 'JID <onboarding@resend.dev>'

  if (!apiKey) {
    console.log('Staff invite email (Resend not configured)', {
      to: params.to,
      subject: params.subject,
      inviteUrl: params.html.match(/href="([^"]+)"/)?.[1],
    })
    return
  }

  const response = await fetch('https://api.resend.com/emails', {
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const supabase = createServiceClient()
    const { data: actor } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (actor?.role !== 'super_admin') {
      return jsonResponse({ error: 'Forbidden' }, 403)
    }

    const body = (await req.json()) as InviteEmailBody
    const email = body.email?.trim().toLowerCase()
    const inviteUrl = body.inviteUrl?.trim()
    const reason = body.reason?.trim()

    if (!email || !inviteUrl) {
      return jsonResponse({ error: 'Invalid payload' }, 400)
    }

    const subject = 'دعوة للانضمام إلى فريق عمليات جِد'
    const html = `
      <div dir="rtl" style="font-family: sans-serif; line-height: 1.6;">
        <h2>مرحباً</h2>
        <p>تمت دعوتك للانضمام إلى فريق عمليات منصة جِد كعضو staff.</p>
        ${reason ? `<p><strong>سبب الدعوة:</strong> ${reason}</p>` : ''}
        <p><a href="${inviteUrl}">اضغط هنا لقبول الدعوة وإعداد حسابك</a></p>
        <p style="color:#666;font-size:12px;">تنتهي صلاحية الرابط خلال 7 أيام. ستحتاج لإعداد المصادقة الثنائية قبل الدخول.</p>
      </div>
    `

    await sendViaResend({ to: email, subject, html })

    return jsonResponse({ sent: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error'
    return jsonResponse({ error: message }, 500)
  }
})
