import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import { getPublicEnv } from '@/lib/env'
import type { Database } from '@/lib/supabase/types'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/settings/verify-phone'

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

  return NextResponse.redirect(new URL(next, requestUrl.origin))
}
