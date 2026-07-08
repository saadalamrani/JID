import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'
import { EntityMetadataForm } from '@/app/[locale]/(staff)/staff/entities/metadata-edit/[id]/_components/entity-metadata-form'
import {
  fetchStaffEntityDetail,
  fetchStaffRegionOptions,
  fetchStaffSectorOptions,
} from '@/lib/staff/entities-queries'

type MetadataEditPageProps = {
  params: Promise<{ id: string }>
}

export default async function EntityMetadataEditPage({ params }: MetadataEditPageProps) {
  const { id } = await params
  const t = await getTranslations('staff.entities.metadataForm')

  const [entity, sectors, regions] = await Promise.all([
    fetchStaffEntityDetail(id),
    fetchStaffSectorOptions(),
    fetchStaffRegionOptions(),
  ])

  if (!entity) notFound()

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href={`/staff/entities/${entity.id}`} className="text-sm text-primary hover:underline">
        {t('back')}
      </Link>
      <header>
        <h1 className="text-2xl font-semibold text-foreground">{t('title', { name: entity.name })}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
      </header>
      <EntityMetadataForm entity={entity} sectors={sectors} regions={regions} />
    </div>
  )
}
