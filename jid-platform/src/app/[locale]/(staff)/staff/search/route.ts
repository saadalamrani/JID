import { NextResponse } from 'next/server'
import { requireStaffApiSearchAccess } from '@/lib/staff/require-staff-api-access'
import { searchStaffDirectory } from '@/lib/staff/search'

/**
 * Section 12 — bounded staff search (users, entities, claims).
 * In-route staff/super_admin check; others receive 404 (not 403).
 */
export async function GET(request: Request) {
  const profile = await requireStaffApiSearchAccess()
  if (!profile) {
    return new NextResponse(null, { status: 404 })
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') ?? ''

  const results = await searchStaffDirectory(query)
  return NextResponse.json(results)
}
