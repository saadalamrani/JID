import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  buildMoyasarCallbackUrls,
  getBillingProvider,
  isMoyasarConfigured,
} from '@/lib/billing'
import { priceForCycle } from '@/lib/monetization/format'
import { createClient } from '@/lib/supabase/server'

const checkoutSchema = z.object({
  planKey: z.literal('jid_plus'),
  billingCycle: z.enum(['monthly', 'yearly']),
  featureKey: z.string().optional(),
  locale: z.enum(['ar', 'en']).optional(),
})

export async function POST(request: Request) {
  try {
    if (!isMoyasarConfigured()) {
      return NextResponse.json(
        { error: 'Checkout is not available yet. Billing integration is coming next.' },
        { status: 503 },
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = checkoutSchema.parse(await request.json())

    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('id, key, name_ar, name_en, price_monthly_sar, price_yearly_sar')
      .eq('key', body.planKey)
      .eq('is_active', true)
      .maybeSingle()

    if (planError) {
      return NextResponse.json({ error: planError.message }, { status: 500 })
    }
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    const amountSar = priceForCycle(
      {
        priceMonthlySar: Number(plan.price_monthly_sar),
        priceYearlySar: Number(plan.price_yearly_sar),
      },
      body.billingCycle,
    )

    const locale = body.locale ?? 'ar'
    const urls = buildMoyasarCallbackUrls(locale)
    const provider = getBillingProvider()

    const checkout = await provider.createCheckout({
      planKey: 'jid_plus',
      billingCycle: body.billingCycle,
      amountSar,
      description: locale === 'ar' ? plan.name_ar : plan.name_en,
      successUrl: urls.successUrl,
      callbackUrl: urls.callbackUrl,
      metadata: {
        feature_key: body.featureKey ?? '',
      },
      subject: {
        type: 'user',
        userId: user.id,
        email: user.email ?? null,
      },
    })

    return NextResponse.json({ checkoutUrl: checkout.checkoutUrl, providerRef: checkout.providerRef })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid checkout payload' }, { status: 400 })
    }
    const message = error instanceof Error ? error.message : 'Checkout failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
