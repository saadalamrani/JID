import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'
import { EntitySlaHistory } from '@/app/[locale]/(staff)/staff/entities/[id]/_components/entity-sla-history'
import { EntityStats } from '@/app/[locale]/(staff)/staff/entities/[id]/_components/entity-stats'
import {
  fetchStaffEntityDetail,
  fetchStaffEntityResponseStats,
  fetchStaffEntitySlaHistory,
} from '@/lib/staff/entities-queries'

type EntityDetailPageProps = {
  params: Promise<{ id: string }>
}

export default async function StaffEntityDetailPage({ params }: EntityDetailPageProps) {
  const { id } = await params
  const t = await getTranslations('staff.entities.detail')

  const [entity, stats, slaEvents] = await Promise.all([
    fetchStaffEntityDetail(id),
    fetchStaffEntityResponseStats(id),
    fetchStaffEntitySlaHistory(id),
  ])

  if (!entity || !stats) notFound()

  const fields: Array<{ label: string; value: string | null }> = [
    { label: t('fields.id'), value: entity.id },
    { label: t('fields.name'), value: entity.name },
    { label: t('fields.nameAr'), value: entity.name_ar },
    { label: t('fields.type'), value: t(`types.${entity.entity_type}`, { default: entity.entity_type }) },
    { label: t('fields.state'), value: entity.entity_state },
    { label: t('fields.ownership'), value: entity.ownership_type },
    { label: t('fields.sector'), value: entity.sector_name },
    { label: t('fields.region'), value: entity.region_name },
    { label: t('fields.claimant'), value: entity.claimant_name },
    { label: t('fields.website'), value: entity.website_url },
    { label: t('fields.city'), value: entity.city },
    { label: t('fields.domains'), value: entity.domains.join(', ') || null },
    { label: t('fields.verified'), value: entity.is_verified ? t('yes') : t('no') },
    { label: t('fields.created'), value: new Date(entity.created_at).toLocaleString() },
    { label: t('fields.updated'), value: new Date(entity.updated_at).toLocaleString() },
  ]

  return (
    <div className="space-y-6">
      <Link href="/staff/entities" className="text-sm text-primary hover:underline">
        {t('back')}
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{entity.name}</h1>
          {entity.name_ar ? <p className="mt-1 text-sm text-muted-foreground">{entity.name_ar}</p> : null}
        </div>
        <Link
          href={`/staff/entities/metadata-edit/${entity.id}`}
          className="rounded-md border border-border bg-card px-3 py-2 text-sm text-primary hover:bg-background/50"
        >
          {t('editMetadata')}
        </Link>
      </header>

      <EntityStats stats={stats} />

      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">{t('infoTitle')}</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          {fields.map((field) => (
            <div key={field.label}>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {field.label}
              </dt>
              <dd className="mt-1 break-all text-sm text-foreground">{field.value ?? '—'}</dd>
            </div>
          ))}
        </dl>
      </section>

      <EntitySlaHistory events={slaEvents} />
    </div>
  )
}
