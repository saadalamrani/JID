'use client'

import { useState } from 'react'
import { MentorPostApprovalSetup } from '@/app/[locale]/(mentor)/dashboard/_components/mentor-post-approval-setup'
import { MentorHubDashboard } from '@/app/[locale]/(mentor)/dashboard/_components/mentor-hub-dashboard'
import type { MentorHubKpis, MentorHubSettings } from '@/lib/mentor-hub/queries'
import type { MentorshipRequestRecord } from '@/types/mentorship-request'
import type { MentorWorkshopRow } from '@/lib/mentor-workshops/crud'

type MentorHubWithSetupProps = {
  kpis: MentorHubKpis
  pendingRequests: MentorshipRequestRecord[]
  settings: MentorHubSettings
  workshops: MentorWorkshopRow[]
  showPostApprovalSetup: boolean
}

export function MentorHubWithSetup({
  showPostApprovalSetup,
  ...dashboardProps
}: MentorHubWithSetupProps) {
  const [setupOpen, setSetupOpen] = useState(showPostApprovalSetup)

  return (
    <>
      <MentorHubDashboard {...dashboardProps} />
      <MentorPostApprovalSetup
        settings={dashboardProps.settings}
        open={setupOpen}
        onOpenChange={setSetupOpen}
      />
    </>
  )
}
