import { notFound, redirect } from 'next/navigation'
import { MentorProfileEditForm } from '@/components/profile/forms/mentor-profile-edit-form'
import { fetchMentorRawById, getCurrentViewer } from '@/lib/profile/queries'

export default async function MentorProfileEditPage() {
  const viewer = await getCurrentViewer()
  if (!viewer.userId) {
    redirect('/login')
  }

  const mentor = await fetchMentorRawById(viewer.userId)
  if (!mentor) {
    notFound()
  }

  return <MentorProfileEditForm mentor={mentor} />
}
