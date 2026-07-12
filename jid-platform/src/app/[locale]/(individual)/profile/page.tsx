import { redirect } from 'next/navigation'
import { getCurrentViewer } from '@/lib/profile/queries'

export default async function IndividualOwnerProfileRedirectPage() {
  const viewer = await getCurrentViewer()
  if (!viewer.userId) {
    redirect('/login')
  }

  redirect(`/profile/${viewer.userId}`)
}
