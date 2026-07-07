import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'
import { EntityActionsMenu } from '@/app/[locale]/(sys)/sys/entities/_components/entity-actions-menu'
import {
  fetchSysEntityClaimHistory,
  fetchSysEntityDetail,
} from '@/lib/sys/entities-queries'

type SysEntityDetailPageProps = {
  params: { id: string }
}

export default async function SysEntityDetailPage({ params }: SysEntityDetailPageProps) {
  const t = await getTranslations('sys.entities.detail')
  const [entity, claims] = await Promise.all([
    fetchSysEntityDetail(params.id),
    fetchSysEntityClaimHistory(params.id),
  ])

  if (!entity) notFound()

  const infoFields = [
    { label: t('fields.id'), value: entity.id },
    { label: t('fields.name'), value: entity.name },
    { label: t('fields.nameAr'), value: entity.name_ar },
    { label: t('fields.type'), value: entity.entity_type },
    { label: t('fields.state'), value: entity.entity_state },
    { label: t('fields.verified'), value: entity.is_verified ? t('yes') : t('no') },
    { label: t('fields.claimant'), value: entity.claimant_name },
    { label: t('fields.website'), value: entity.website_url },
    { label: t('fields.city'), value: entity.city },
    { label: t('fields.domains'), value: entity.domains.join(', ') || '—' },
    { label: t('fields.created'), value: new Date(entity.created_at).toLocaleString() },
    { label: t('fields.updated'), value: new Date(entity.updated_at).toLocaleString() },
  ]

  return (
    <div className="space-y-6">
      <Link href="/sys/entities" className="text-sm text-jid-olive hover:underline">
        {t('back')}
      </Link>

      <header>
        <h1 className="text-2xl font-semibold text-jid-ink">{entity.name}</h1>
        <p className="mt-1 text-sm text-jid-ink/60">
          {t(`types.${entity.entity_type}`, { default: entity.entity_type })} · {entity.entity_state}
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-lg border border-jid-line bg-white p-5 xl:col-span-2">
          <h2 className="text-sm font-semibold text-jid-ink">{t('infoTitle')}</h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {infoFields.map((field) => (
              <div key={field.label}>
                <dt className="text-xs font-medium uppercase tracking-wide text-jid-ink/45">
                  {field.label}
                </dt>
                <dd className="mt-1 break-all text-sm text-jid-ink">{field.value ?? '—'}</dd>
              </div>
            ))}
          </dl>
        </section>

        <EntityActionsMenu entity={entity} />
      </div>

      <section className="rounded-lg border border-jid-line bg-white p-5">
        <h2 className="text-sm font-semibold text-jid-ink">{t('claimsTitle')}</h2>
        <p className="mt-1 text-sm text-jid-ink/55">{t('claimsSubtitle')}</p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-jid-beige/50 text-start">
              <tr>
                <th className="px-3 py-2 font-medium">{t('claims.claimant')}</th>
                <th className="px-3 py-2 font-medium">{t('claims.status')}</th>
                <th className="px-3 py-2 font-medium">{t('claims.type')}</th>
                <th className="px-3 py-2 font-medium">{t('claims.submitted')}</th>
                <th className="px-3 py-2 font-medium">{t('claims.reviewed')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-jid-line">
              {claims.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-jid-ink/50">
                    {t('claims.empty')}
                  </td>
                </tr>
              ) : (
                claims.map((claim) => (
                  <tr key={claim.id}>
                    <td className="px-3 py-2">
                      <p>{claim.claimant_name}</p>
                      <p className="text-xs text-jid-ink/45" dir="ltr">
                        {claim.business_email}
                      </p>
                    </td>
                    <td className="px-3 py-2">{claim.status}</td>
                    <td className="px-3 py-2">{claim.claim_type}</td>
                    <td className="px-3 py-2">{new Date(claim.created_at).toLocaleString()}</td>
                    <td className="px-3 py-2">
                      {claim.reviewed_at ? new Date(claim.reviewed_at).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
