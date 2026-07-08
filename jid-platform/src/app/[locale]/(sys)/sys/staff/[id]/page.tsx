import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'
import { StaffRevokeMenu } from '@/app/[locale]/(sys)/sys/staff/_components/staff-revoke-menu'
import { getDevTestSuperAdminProfile } from '@/lib/sys/dev-test-access'
import { fetchSysStaffMember } from '@/lib/sys/staff-queries'
import { createClient } from '@/lib/supabase/server'

type SysStaffDetailPageProps = {
  params: { id: string }
}

export default async function SysStaffDetailPage({ params }: SysStaffDetailPageProps) {
  const t = await getTranslations('sys.staff.detail')
  const member = await fetchSysStaffMember(params.id)
  if (!member) notFound()

  const devActor = getDevTestSuperAdminProfile()
  let actorUserId = devActor?.id
  if (!actorUserId) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    actorUserId = user?.id
  }

  const fields = [
    { label: t('fields.id'), value: member.id },
    { label: t('fields.name'), value: member.full_name },
    { label: t('fields.role'), value: member.role },
    { label: t('fields.mfa'), value: member.mfa_enabled ? t('yes') : t('no') },
    { label: t('fields.suspended'), value: member.suspended_at ? t('yes') : t('no') },
    { label: t('fields.created'), value: new Date(member.created_at).toLocaleString() },
    {
      label: t('fields.lastLogin'),
      value: member.last_login_at ? new Date(member.last_login_at).toLocaleString() : '—',
    },
  ]

  return (
    <div className="space-y-6">
      <Link href="/sys/staff" className="text-sm text-primary hover:underline">
        {t('back')}
      </Link>

      <header>
        <h1 className="text-2xl font-semibold text-foreground">{member.full_name ?? t('unnamed')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{member.role}</p>
      </header>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-lg border border-border bg-card p-5 xl:col-span-2">
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

        <StaffRevokeMenu member={member} actorUserId={actorUserId} />
      </div>
    </div>
  )
}
