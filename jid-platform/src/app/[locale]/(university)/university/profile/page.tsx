import { redirect } from 'next/navigation'

/** Owned university profile management lives at /university/profile/edit. */
export default function UniversityProfileIndexPage() {
  redirect('/university/profile/edit')
}
