import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'
import { fetchStaffDirectory } from '@/lib/sys/staff'
import { createClient } from '@/lib/supabase/server'

export default async function SysStaffPage() {
  const t = await getTranslations('sys.staff')
  const supabase = await createClient()
  const { staff, pendingInvitations } = await fetchStaffDirectory(supabase)

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-jid-ink">{t('title')}</h1>
          <p className="mt-2 text-sm text-jid-ink/70">{t('subtitle')}</p>
        </div>
        <Link
          href="/sys/staff/new"
          className="inline-flex items-center justify-center rounded-md bg-jid-olive px-4 py-2 text-sm font-medium text-white hover:bg-jid-olive/90"
        >
          {t('inviteCta')}
        </Link>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-jid-ink">{t('currentStaff')}</h2>
        {staff.length === 0 ? (
          <p className="text-sm text-jid-ink/60">{t('noStaff')}</p>
        ) : (
          <ul className="divide-y divide-jid-line rounded-md border border-jid-line bg-white">
            {staff.map((member) => (
              <li key={member.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-jid-ink">{member.full_name ?? t('unnamed')}</p>
                  <p className="text-xs text-jid-ink/50">{member.role}</p>
                </div>
                <p className="text-xs text-jid-ink/50">
                  {new Date(member.created_at).toLocaleDateString('ar-SA')}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-jid-ink">{t('pendingInvitations')}</h2>
        {pendingInvitations.length === 0 ? (
          <p className="text-sm text-jid-ink/60">{t('noPending')}</p>
        ) : (
          <ul className="divide-y divide-jid-line rounded-md border border-jid-line bg-white">
            {pendingInvitations.map((invite) => (
              <li key={invite.id} className="p-4">
                <p className="font-medium text-jid-ink" dir="ltr">
                  {invite.email}
                </p>
                <p className="mt-1 text-sm text-jid-ink/70">{invite.reason}</p>
                <p className="mt-1 text-xs text-jid-ink/50">
                  {t('expires')}: {new Date(invite.expires_at).toLocaleString('ar-SA')}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
