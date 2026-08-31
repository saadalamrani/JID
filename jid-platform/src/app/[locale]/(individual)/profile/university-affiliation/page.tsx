import { redirect } from 'next/navigation'
import { IndividualAffiliationPanel } from './_components/individual-affiliation-panel'
import { getCurrentViewer } from '@/lib/profile/queries'
import { fetchCatalogUniversityNames, fetchMyUniversityAffiliations } from '@/lib/university/wave10-queries'

export default async function IndividualUniversityAffiliationPage() {
  const viewer = await getCurrentViewer()
  if (!viewer.userId) {
    redirect('/login')
  }

  const [affiliations, catalogNames] = await Promise.all([
    fetchMyUniversityAffiliations(),
    fetchCatalogUniversityNames(),
  ])

  return (
    <div className="container-jid max-w-3xl py-8">
      <IndividualAffiliationPanel affiliations={affiliations} catalogNames={catalogNames} />
    </div>
  )
}
