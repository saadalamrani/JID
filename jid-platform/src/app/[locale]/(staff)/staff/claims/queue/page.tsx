import { redirect } from 'next/navigation'

/** Legacy path — canonical queue is /staff/claims. */
export default function StaffClaimsQueueRedirectPage() {
  redirect('/staff/claims')
}
