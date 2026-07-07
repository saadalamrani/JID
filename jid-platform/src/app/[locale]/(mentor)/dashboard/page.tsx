import { MentorHubWithSetup } from './_components/mentor-hub-with-setup'
import { MentorKpiStrip } from './_components/mentor-kpi-strip'
import { listMentorWorkshops } from '@/lib/mentor-workshops/crud'
import { fetchMentorHubKpis, fetchMentorHubSettings } from '@/lib/mentor-hub/queries'
import { needsMentorPostApprovalSetup } from '@/lib/mentor-hub/needs-post-approval-setup'
import { requireMentorHubAccess } from '@/lib/mentor-hub/require-mentor-hub-access'
import { fetchMentorPendingRequests } from '@/lib/mentorship/queries'
import { createClient } from '@/lib/supabase/server'
import { localeConfig, type Locale } from '@/lib/i18n/config'
import { notFound } from 'next/navigation'

type MentorDashboardPageProps = {
  params: { locale: string }
}

export default async function MentorDashboardPage({ params }: MentorDashboardPageProps) {
  const locale = params.locale as Locale
  const dir = localeConfig.direction[locale] ?? 'rtl'
  const mentorId = await requireMentorHubAccess()

  const [kpis, pendingRequests, settings, workshops] = await Promise.all([
    fetchMentorHubKpis(mentorId),
    fetchMentorPendingRequests(mentorId),
    fetchMentorHubSettings(mentorId),
    listMentorWorkshops(mentorId),
  ])

  if (!settings) {
    notFound()
  }

  const supabase = await createClient()
  const { data: profileRow } = await supabase
    .from('profiles')
    .select('smart_links')
    .eq('id', mentorId)
    .maybeSingle()

  const smartLinks =
    profileRow?.smart_links && typeof profileRow.smart_links === 'object'
      ? (profileRow.smart_links as Record<string, unknown>)
      : null

  const showPostApprovalSetup = needsMentorPostApprovalSetup(settings, smartLinks)

  return (
    <main dir={dir} className="container-jid py-8" lang={locale}>
      <div className="space-y-6">
        <MentorKpiStrip kpis={kpis} />
        <MentorHubWithSetup
          kpis={kpis}
          pendingRequests={pendingRequests}
          settings={settings}
          workshops={workshops}
          showPostApprovalSetup={showPostApprovalSetup}
        />
      </div>
    </main>
  )
}

export async function generateMetadata() {
  return { title: 'Mentor hub' }
}
