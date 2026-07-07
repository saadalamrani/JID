import { redirect } from 'next/navigation'
import { STAFF_HOME_PATH } from '@/lib/staff/constants'
import { sanitizeStaffNextPath } from '@/lib/staff/routes'

type StaffLoginPageProps = {
  searchParams: Promise<{
    next?: string
    reason?: string
  }>
}

/**
 * Section 5 — staff login delegates to the unified `/login` page.
 * Auth/RBAC already routes staff roles to `/staff/dashboard` after sign-in.
 */
export default async function StaffLoginPage({ searchParams }: StaffLoginPageProps) {
  const params = await searchParams
  const query = new URLSearchParams()
  const safeNext = sanitizeStaffNextPath(params.next) ?? STAFF_HOME_PATH
  query.set('next', safeNext)
  if (params.reason) {
    query.set('reason', params.reason)
  }
  redirect(`/login?${query.toString()}`)
}
