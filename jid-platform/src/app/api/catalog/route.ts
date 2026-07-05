import { NextResponse } from 'next/server'
import { fetchCompanies } from '@/lib/queries/catalog'
import { parseCatalogFiltersFromSearchParams } from '@/types/catalog'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const filters = parseCatalogFiltersFromSearchParams(searchParams)
    const result = await fetchCompanies(filters)
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Catalog fetch failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
