import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'
import { MentorApplicationCard } from './_components/mentor-application-card'
import { listPendingMentorApplications } from '@/lib/staff/mentor-applications'

export const revalidate = 60

/**
 * Section 7 / Mentorship Day 4 — mentor application review queue.
 * Uses mentor_profiles (status = pending_review), NOT claim_requests.
 */
export default async function StaffMentorApplicationsPage() {
  const t = await getTranslations('staff.mentorApplications')
  const { applications, stats } = await listPendingMentorApplications()

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-jid-ink">{t('title')}</h1>
          <p className="mt-1 text-sm text-jid-ink/70">{t('subtitle')}</p>
        </div>
        <Link href="/staff" className="text-sm text-jid-olive hover:underline">
          {t('backToDashboard')}
        </Link>
      </header>

      <p className="text-sm text-jid-ink/55">{t('pendingCount', { count: stats.pending })}</p>

      {applications.length === 0 ? (
        <div className="rounded-md border border-dashed border-jid-line p-8 text-center text-sm text-jid-ink/60">
          {t('list.empty')}
        </div>
      ) : (
        <ul className="space-y-3">
          {applications.map((application) => (
            <li key={application.user_id}>
              <MentorApplicationCard application={application} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
