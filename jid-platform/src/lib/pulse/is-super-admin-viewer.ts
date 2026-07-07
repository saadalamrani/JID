import 'server-only'

import { unstable_noStore as noStore } from 'next/cache'
import { getCurrentViewer } from '@/lib/profile/queries'
import { getDevTestSuperAdminProfile } from '@/lib/sys/dev-test-access'

/** Section 6.11 — only super_admin may see the disabled placeholder (everyone else gets 404). */
export async function isPulseSuperAdminViewer(): Promise<boolean> {
  noStore()
  if (getDevTestSuperAdminProfile()) return true
  const viewer = await getCurrentViewer()
  return viewer.role === 'super_admin'
}
