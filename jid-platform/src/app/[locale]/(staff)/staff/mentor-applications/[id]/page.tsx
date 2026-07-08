import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'
import { requireStaffShellAccess } from '@/lib/staff/require-staff-access'
import { getMentorApplicationByUserId } from '@/lib/staff/mentor-applications'
import { MentorApplicationWorkspace } from './_components/mentor-application-workspace'

type MentorApplicationDetailPageProps = {
  params: Promise<{ id: string }>
}

/** Mentor application detail + approve/reject (mentor_profiles; does not change profiles.role). */
export default async function MentorApplicationDetailPage({
  params,
}: MentorApplicationDetailPageProps) {
  const { id } = await params
  const t = await getTranslations('staff.mentorApplications.review')
  const [staff, application] = await Promise.all([
    requireStaffShellAccess(),
    getMentorApplicationByUserId(id),
  ])

  if (!application) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive">{t('notFound')}</p>
        <Link href="/staff/mentor-applications" className="text-sm text-primary hover:underline">
          {t('backToQueue')}
        </Link>
      </div>
    )
  }

  return (
    <MentorApplicationWorkspace application={application} currentUserId={staff.id} />
  )
}
