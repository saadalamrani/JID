import {
  handleGetDisclosurePolicy,
  handleUpdateDisclosurePolicy,
} from '@/lib/career-record/http-handlers'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params
  return handleGetDisclosurePolicy(id)
}

export async function PATCH(_request: Request, context: RouteContext) {
  const { id } = await context.params
  return handleUpdateDisclosurePolicy(id)
}
