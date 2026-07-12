import { redirect } from 'next/navigation'

/** Legacy path — canonical queue is /staff/verification. */
export default function LegacyVerificationQueueRedirect() {
  redirect('/staff/verification')
}
