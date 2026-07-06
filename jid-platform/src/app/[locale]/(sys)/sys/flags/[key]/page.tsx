import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { FlagDetailEditor } from '@/app/[locale]/(sys)/sys/flags/_components/flag-detail-editor'
import { Link } from '@/lib/i18n/navigation'
import {
  fetchFeatureFlagByKey,
  fetchUserOverrideRows,
} from '@/lib/sys/feature-flags'

type FlagDetailPageProps = {
  params: { key: string; locale: string }
}

export default async function SysFeatureFlagDetailPage({ params }: FlagDetailPageProps) {
  const t = await getTranslations('sys.flags.detail')
  const key = decodeURIComponent(params.key)
  const flag = await fetchFeatureFlagByKey(key)

  if (!flag) notFound()

  const overrideRows = await fetchUserOverrideRows(flag.user_overrides)

  return (
    <div className="space-y-4">
      <Link href="/sys/flags" className="text-sm text-jid-olive hover:underline">
        {t('back')}
      </Link>
      <FlagDetailEditor flag={flag} overrideRows={overrideRows} />
    </div>
  )
}
