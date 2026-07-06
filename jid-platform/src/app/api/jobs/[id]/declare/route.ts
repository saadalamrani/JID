import { NextResponse } from 'next/server'

type JobDeclareRouteProps = {
  params: { id: string }
}

/** Day 5 — submit full application declaration. */
export async function POST(_request: Request, { params }: JobDeclareRouteProps) {
  return NextResponse.json(
    { error: 'Application declare not implemented yet', jobId: params.id },
    { status: 501 },
  )
}
