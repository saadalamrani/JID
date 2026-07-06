import { NextResponse } from 'next/server'

type JobIntentRouteProps = {
  params: { id: string }
}

/** Day 5 — express application intent before full declare flow. */
export async function POST(_request: Request, { params }: JobIntentRouteProps) {
  return NextResponse.json(
    { error: 'Application intent not implemented yet', jobId: params.id },
    { status: 501 },
  )
}
