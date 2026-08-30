import { NextResponse } from 'next/server'
import { listMySourcingInvitations } from '@/lib/talent-sourcing/service'

export async function GET() {
  try {
    const invitations = await listMySourcingInvitations()
    return NextResponse.json({ invitations })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request'
    const status = message.includes('authenticated') || message.includes('Not authenticated') ? 401 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
