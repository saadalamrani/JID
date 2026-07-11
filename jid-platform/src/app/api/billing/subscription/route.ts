import { NextResponse } from 'next/server'
import { z } from 'zod'
import { setSubscriptionCancelAtPeriodEnd } from '@/lib/billing/subscription-service'
import { createClient } from '@/lib/supabase/server'

const patchSchema = z.object({
  subscriptionId: z.string().uuid(),
  cancelAtPeriodEnd: z.boolean(),
})

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = patchSchema.parse(await request.json())

    await setSubscriptionCancelAtPeriodEnd({
      subscriptionId: body.subscriptionId,
      userId: user.id,
      cancelAtPeriodEnd: body.cancelAtPeriodEnd,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid subscription payload' }, { status: 400 })
    }
    const message = error instanceof Error ? error.message : 'Subscription update failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
