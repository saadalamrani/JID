import { redirect } from 'next/navigation'

export default function MentorWorkshopsAliasPage() {
  redirect('/mentor/dashboard?tab=workshops')
}
