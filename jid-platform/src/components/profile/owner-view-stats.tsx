'use client'

import { OwnerStatsGrid } from '@/components/profile/owner-stats-grid'
import { Skeleton } from '@/components/ui/skeleton'
import { useProfileViewStats } from '@/hooks/use-profile-view-stats'

type OwnerViewStatsProps = {
  profileId: string
  completionPct: number
}

/** Owner-only view stats — TanStack Query cached (Section 12 Step 14). */
export function OwnerViewStats({ profileId, completionPct }: OwnerViewStatsProps) {
  const { data, isLoading, isError } = useProfileViewStats(profileId, true)

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-3 rounded-xl border border-border bg-background/50 p-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    )
  }

  if (isError || !data) {
    return null
  }

  return (
    <OwnerStatsGrid
      stats={{
        totalViews: data.totalViews,
        distinctCompanies30d: data.distinctCompanies30d,
        completionPct,
      }}
    />
  )
}
