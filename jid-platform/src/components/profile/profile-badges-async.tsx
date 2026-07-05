import { Suspense } from 'react'
import { fetchUserBadges } from '@/lib/profile/badge-helpers'
import { BadgeDisplayList } from '@/components/profile/badge-display'
import { createClient } from '@/lib/supabase/server'

async function ProfileBadgesContent({ userId }: { userId: string }) {
  const supabase = await createClient()
  const badges = await fetchUserBadges(supabase, userId)
  return <BadgeDisplayList badges={badges} />
}

export function ProfileBadgesAsync({ userId }: { userId: string }) {
  return (
    <Suspense fallback={null}>
      <ProfileBadgesContent userId={userId} />
    </Suspense>
  )
}
