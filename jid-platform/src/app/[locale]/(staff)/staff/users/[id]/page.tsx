import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'
import { UserActionsMenu } from '@/app/[locale]/(staff)/staff/users/_components/user-actions-menu'
import { requireStaffShellAccess } from '@/lib/staff/require-staff-access'
import {
  fetchStaffUserAuditTimeline,
  fetchStaffUserDetail,
  fetchStaffUserSessions,
} from '@/lib/staff/users-queries'

type StaffUserDetailPageProps = {
  params: Promise<{ id: string }>
}

/** Section 8 — user detail (bounded scope; privileged roles return 404). */
export default async function StaffUserDetailPage({ params }: StaffUserDetailPageProps) {
  const { id } = await params
  const t = await getTranslations('staff.users.detail')
  const staff = await requireStaffShellAccess()
  const user = await fetchStaffUserDetail(id)
  if (!user) notFound()

  const [sessions, auditEvents] = await Promise.all([
    fetchStaffUserSessions(id, false),
    fetchStaffUserAuditTimeline(id, false),
  ])

  const infoFields: Array<{ label: string; value: string | null }> = [
    { label: t('fields.id'), value: user.id },
    { label: t('fields.email'), value: user.email },
    { label: t('fields.fullName'), value: user.full_name },
    { label: t('fields.role'), value: t(`roleLabels.${user.display_role}`) },
    { label: t('fields.phone'), value: user.phone },
    { label: t('fields.locale'), value: user.locale },
    {
      label: t('fields.emailVerified'),
      value: user.email_verified_at ? new Date(user.email_verified_at).toLocaleString() : t('no'),
    },
    {
      label: t('fields.phoneVerified'),
      value: user.phone_verified_at ? new Date(user.phone_verified_at).toLocaleString() : t('no'),
    },
    {
      label: t('fields.suspendedAt'),
      value: user.suspended_at ? new Date(user.suspended_at).toLocaleString() : '—',
    },
    { label: t('fields.suspendedReason'), value: user.suspended_reason },
    {
      label: t('fields.lastLogin'),
      value: user.last_login_at ? new Date(user.last_login_at).toLocaleString() : '—',
    },
    { label: t('fields.lastLoginIp'), value: user.last_login_ip },
    { label: t('fields.mentorStatus'), value: user.mentor_status ?? '—' },
    { label: t('fields.createdAt'), value: new Date(user.created_at).toLocaleString() },
    { label: t('fields.updatedAt'), value: new Date(user.updated_at).toLocaleString() },
  ]

  return (
    <div className="space-y-6">
      <Link href="/staff/users" className="text-sm text-jid-olive hover:underline">
        {t('back')}
      </Link>

      <header>
        <h1 className="text-2xl font-semibold text-jid-ink">{user.full_name ?? t('unnamed')}</h1>
        <p className="mt-1 text-sm text-jid-ink/60">{user.email ?? user.id}</p>
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

        <UserActionsMenu user={user} actorUserId={staff.id} />
      </div>

      <section className="rounded-lg border border-jid-line bg-white p-5">
        <h2 className="text-sm font-semibold text-jid-ink">{t('sessionsTitle')}</h2>
        <p className="mt-1 text-sm text-jid-ink/55">{t('sessionsSubtitle')}</p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-jid-beige/50 text-start">
              <tr>
                <th className="px-3 py-2 font-medium">{t('sessions.device')}</th>
                <th className="px-3 py-2 font-medium">{t('sessions.lastActive')}</th>
                <th className="px-3 py-2 font-medium">{t('sessions.expires')}</th>
                <th className="px-3 py-2 font-medium">{t('sessions.status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-jid-line">
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-jid-ink/50">
                    {t('sessions.empty')}
                  </td>
                </tr>
              ) : (
                sessions.map((session) => (
                  <tr key={session.id}>
                    <td className="px-3 py-2">
                      <p>{session.device_label ?? t('sessions.unknownDevice')}</p>
                      <p className="text-xs text-jid-ink/45">
                        {session.user_agent ?? session.ip_address ?? '—'}
                      </p>
                    </td>
                    <td className="px-3 py-2">
                      {new Date(session.last_active_at).toLocaleString()}
                    </td>
                    <td className="px-3 py-2">{new Date(session.expires_at).toLocaleString()}</td>
                    <td className="px-3 py-2">
                      {session.revoked_at ? t('sessions.revoked') : t('sessions.active')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-jid-line bg-white p-5">
        <h2 className="text-sm font-semibold text-jid-ink">{t('auditTitle')}</h2>
        <p className="mt-1 text-sm text-jid-ink/55">{t('auditSubtitle')}</p>
        <ul className="mt-4 divide-y divide-jid-line">
          {auditEvents.length === 0 ? (
            <li className="py-6 text-center text-sm text-jid-ink/50">{t('auditEmpty')}</li>
          ) : (
            auditEvents.map((event) => (
              <li key={event.id} className="py-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-jid-ink">{event.action}</p>
                    <p className="text-xs text-jid-ink/55">
                      {event.actor_name ?? t('systemActor')} · {event.entity_type}
                    </p>
                  </div>
                  <time dateTime={event.created_at} className="text-xs text-jid-ink/45">
                    {new Date(event.created_at).toLocaleString()}
                  </time>
                </div>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  )
}
