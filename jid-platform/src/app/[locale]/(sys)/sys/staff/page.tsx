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
          <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Link
          href="/sys/staff/new"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {t('inviteCta')}
        </Link>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">{t('currentStaff')}</h2>
        {staff.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('noStaff')}</p>
        ) : (
          <ul className="divide-y divide-border rounded-md border border-border bg-card">
            {staff.map((member) => (
              <li key={member.id} className="flex items-center justify-between p-4">
                <div>
                  <Link href={`/sys/staff/${member.id}`} className="font-medium text-primary hover:underline">
                    {member.full_name ?? t('unnamed')}
                  </Link>
                  <p className="text-xs text-muted-foreground">{member.role}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(member.created_at).toLocaleDateString('ar-SA')}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">{t('pendingInvitations')}</h2>
        {pendingInvitations.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('noPending')}</p>
        ) : (
          <ul className="divide-y divide-border rounded-md border border-border bg-card">
            {pendingInvitations.map((invite) => (
              <li key={invite.id} className="p-4">
                <p className="font-medium text-foreground" dir="ltr">
                  {invite.email}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{invite.reason}</p>
                <p className="mt-1 text-xs text-muted-foreground">
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
