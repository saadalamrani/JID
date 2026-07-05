import { NextResponse } from 'next/server'
import { fetchCompanyBySlug } from '@/lib/queries/catalog'

type CatalogDetailRouteProps = {
  params: { slug: string }
}

export async function GET(_request: Request, { params }: CatalogDetailRouteProps) {
  try {
    const company = await fetchCompanyBySlug(params.slug)
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }
    return NextResponse.json({ company })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Catalog detail fetch failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
