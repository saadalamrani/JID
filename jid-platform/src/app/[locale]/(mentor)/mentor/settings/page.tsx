import { redirect } from 'next/navigation'

export default function MentorSettingsAliasPage() {
  redirect('/mentor/dashboard?tab=settings')
}
