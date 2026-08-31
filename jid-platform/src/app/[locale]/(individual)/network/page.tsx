import { redirect } from 'next/navigation'
import { NetworkClient } from '@/components/professional-network/network-client'
import { getNetwork } from '@/lib/professional-network/service'
export default async function NetworkPage({ params }: { params: { locale: string } }) {
  try {
    return (
      <NetworkClient initial={await getNetwork()} locale={params.locale === 'en' ? 'en' : 'ar'} />
    )
  } catch {
    redirect(`/${params.locale}/login`)
  }
}
