import { redirect } from 'next/navigation'

export default function MentorConversationsAliasPage() {
  redirect('/mentor/dashboard?tab=chats')
}
