import { redirect } from 'next/navigation'

/** Legacy path — redirects to /staff/verification. */
export default function StaffClaimsQueueRedirectPage() {
  redirect('/staff/verification')
}
