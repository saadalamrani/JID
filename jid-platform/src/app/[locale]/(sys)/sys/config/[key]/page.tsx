import { notFound } from 'next/navigation'
import { ConfigEditor } from '@/app/[locale]/(sys)/sys/config/_components/config-editor'
import { fetchPlatformConfigByKey } from '@/lib/sys/platform-config-queries'

type SysConfigDetailPageProps = {
  params: { key: string }
}

export default async function SysConfigDetailPage({ params }: SysConfigDetailPageProps) {
  const config = await fetchPlatformConfigByKey(decodeURIComponent(params.key))
  if (!config) notFound()

  return (
    <div className="mx-auto max-w-2xl">
      <ConfigEditor config={config} showBackLink />
    </div>
  )
}
