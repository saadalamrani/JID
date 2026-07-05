import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

/**
 * Temporary middleware probe — reads x-user-id / x-user-role injected by middleware.
 * Remove once real portal pages ship (Day 3+).
 */
export async function GET() {
  const headerStore = headers()
  const userId = headerStore.get('x-user-id')
  const userRole = headerStore.get('x-user-role')

  return NextResponse.json({
    ok: true,
    middleware: {
      userId,
      userRole,
      authenticated: Boolean(userId && userRole),
    },
  })
}
