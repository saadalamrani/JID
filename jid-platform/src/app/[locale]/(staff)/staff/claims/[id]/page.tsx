import { redirect } from 'next/navigation'

type LegacyClaimsRedirectProps = {
  params: Promise<{ id?: string }>
}

/** P-108 — legacy /staff/claims routes redirect to /staff/verification. */
export default async function LegacyClaimsRedirect({ params }: LegacyClaimsRedirectProps) {
  const { id } = await params
  if (id) {
    redirect(`/staff/verification/${id}`)
  }
  redirect('/staff/verification')
}
