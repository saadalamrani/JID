import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getNetwork, mutateNetwork } from '@/lib/professional-network/service'
const input = z.discriminatedUnion('action', [
  z.object({ action: z.literal('request'), profileId: z.string().uuid() }),
  z.object({ action: z.literal('respond'), connectionId: z.string().uuid(), accept: z.boolean() }),
  z.object({ action: z.literal('disconnect'), connectionId: z.string().uuid() }),
  z.object({ action: z.literal('block'), profileId: z.string().uuid() }),
  z.object({
    action: z.literal('create'),
    kind: z.enum(['project', 'achievement', 'learning', 'credential', 'career']),
    body: z.string().trim().min(1).max(2000),
    audience: z.enum(['connections', 'private']),
  }),
  z.object({ action: z.literal('delete'), updateId: z.string().uuid() }),
  z.object({
    action: z.literal('preferences'),
    acceptsConnections: z.boolean(),
    updatesEnabled: z.boolean(),
    defaultAudience: z.enum(['connections', 'private']),
  }),
])
export async function GET() {
  try {
    return NextResponse.json(await getNetwork())
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 403 })
  }
}
export async function POST(request: Request) {
  try {
    const value = input.parse(await request.json())
    let id: string
    switch (value.action) {
      case 'request':
        id = await mutateNetwork('request_professional_connection', {
          p_recipient_id: value.profileId,
        })
        break
      case 'respond':
        id = await mutateNetwork('respond_professional_connection', {
          p_connection_id: value.connectionId,
          p_accept: value.accept,
        })
        break
      case 'disconnect':
        id = await mutateNetwork('disconnect_professional_connection', {
          p_connection_id: value.connectionId,
        })
        break
      case 'block':
        id = await mutateNetwork('block_professional_profile', { p_profile_id: value.profileId })
        break
      case 'create':
        id = await mutateNetwork('create_professional_update', {
          p_kind: value.kind,
          p_body: value.body,
          p_audience: value.audience,
        })
        break
      case 'delete':
        id = await mutateNetwork('delete_professional_update', { p_update_id: value.updateId })
        break
      case 'preferences':
        id = await mutateNetwork('set_professional_network_preferences', {
          p_accepts: value.acceptsConnections,
          p_updates: value.updatesEnabled,
          p_audience: value.defaultAudience,
        })
        break
    }
    return NextResponse.json({ id })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof z.ZodError ? 'invalid_request' : 'not_permitted' },
      { status: error instanceof z.ZodError ? 400 : 403 },
    )
  }
}
