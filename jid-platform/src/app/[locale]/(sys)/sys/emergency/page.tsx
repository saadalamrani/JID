import { redirect } from 'next/navigation'

/** Legacy nav path → Section 11 canonical route. */
export default function LegacySysEmergencyRedirect() {
  redirect('/sys/system/emergency')
}
