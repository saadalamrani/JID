import { redirect } from 'next/navigation'

/** Preserve the legacy onboarding URL used by the route guard. */
export default function IndividualOnboardingEntryPage() {
  redirect('/welcome')
}
