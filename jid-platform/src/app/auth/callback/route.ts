import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import { getPublicEnv } from '@/lib/env'
import type { Database } from '@/lib/supabase/types'

function resolveEntityCallbackPath(
  verificationType: string | null | undefined,
  verificationStatus: string | null | undefined,
): string {
  const pending =
    verificationStatus &&
    ['pending_review', 'pending', 'under_review'].includes(verificationStatus)
  if (pending) {
    return verificationType === 'university'
      ? '/university/pending-review'
      : '/company/pending-review'
  }
  return verificationType === 'university' ? '/signup/university' : '/signup/company'
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const nextParam = requestUrl.searchParams.get('next')
  const type = requestUrl.searchParams.get('type')

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', requestUrl.origin))
  }

  const cookieStore = cookies()
  const env = getPublicEnv()

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    },
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, requestUrl.origin),
    )
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user?.email_confirmed_at) {
    await supabase
      .from('profiles')
      .update({
        email_verified_at: user.email_confirmed_at,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
  }

  let destination = nextParam ?? '/settings/verify-phone'

  if (type === 'recovery' || nextParam === '/reset-password') {
    destination = '/reset-password'
  } else if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, onboarding_completed_at, onboarding_skipped_at')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.role === 'entity') {
      const { data: verification } = await supabase
        .from('verification_requests')
        .select('verification_type, status')
        .eq('applicant_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      destination = resolveEntityCallbackPath(
        verification?.verification_type,
        verification?.status,
      )
    } else if (
      profile?.role === 'individual' &&
      !profile.onboarding_completed_at &&
      !profile.onboarding_skipped_at &&
      !nextParam
    ) {
      destination = '/welcome'
    }
  }

  if (!destination.startsWith('/') || destination.startsWith('//')) {
    destination = '/settings/verify-phone'
  }

  return NextResponse.redirect(new URL(destination, requestUrl.origin))
}
