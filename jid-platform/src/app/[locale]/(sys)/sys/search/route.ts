import { NextResponse } from 'next/server'
import { requireSysApiSuperAdmin } from '@/lib/sys/require-sys-api-access'
import { searchSysDirectory } from '@/lib/sys/search'

/**
 * Section 12 — sys global search (users + entities).
 * In-route super_admin check; non-super_admin receives 404 (not 403).
 */
export async function GET(request: Request) {
  const profile = await requireSysApiSuperAdmin()
  if (!profile) {
    return new NextResponse(null, { status: 404 })
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') ?? ''

  const results = await searchSysDirectory(query)
  return NextResponse.json(results)
}
