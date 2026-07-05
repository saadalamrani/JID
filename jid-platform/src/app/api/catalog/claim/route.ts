import { NextResponse } from 'next/server'
import { z } from 'zod'
import { checkClaimableProfile, submitCatalogClaim } from '@/lib/catalog/claim'
import { createClient } from '@/lib/supabase/server'

const claimBodySchema = z.object({
  companyId: z.string().uuid(),
  claimantName: z.string().min(2).max(120).optional(),
  claimantTitle: z.string().max(120).optional(),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const email = user.email?.trim().toLowerCase()
    if (!email) {
      return NextResponse.json({ error: 'Verified email required' }, { status: 400 })
    }

    const body = claimBodySchema.parse(await request.json())
    const claimable = await checkClaimableProfile(supabase, email)

    if (!claimable) {
      return NextResponse.json(
        { error: 'No claimable company found for your email domain' },
        { status: 404 },
      )
    }

    if (claimable.id !== body.companyId) {
      return NextResponse.json(
        { error: 'Company does not match your email domain or is not claimable' },
        { status: 403 },
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle()

    const claimantName =
      body.claimantName?.trim() || profile?.full_name?.trim() || user.email || 'Claimant'

    const result = await submitCatalogClaim(supabase, {
      companyId: body.companyId,
      userId: user.id,
      userEmail: email,
      claimantName,
      claimantTitle: body.claimantTitle,
    })

    return NextResponse.json({
      claim: result,
      company: {
        id: claimable.id,
        name: claimable.name,
        slug: claimable.slug,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const message = error instanceof Error ? error.message : 'Catalog claim failed'
    const status = message.includes('already been claimed') || message.includes('مسبقاً') ? 409 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const email = user.email?.trim().toLowerCase()
    if (!email) {
      return NextResponse.json({ error: 'Verified email required' }, { status: 400 })
    }

    const company = await checkClaimableProfile(supabase, email)
    if (!company) {
      return NextResponse.json({ company: null })
    }

    return NextResponse.json({ company })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Claim lookup failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
