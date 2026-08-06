import { redirect } from 'next/navigation'

export default function MentorRequestsAliasPage() {
  redirect('/mentor/dashboard?tab=requests')
}
