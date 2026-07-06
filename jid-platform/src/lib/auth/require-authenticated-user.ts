import 'server-only'

import { redirect } from 'next/navigation'
import { getCurrentViewer } from '@/lib/profile/queries'

/**
 * Minimal auth guard for shared authenticated-only routes (conversations, etc.).
 * New pattern: use (authenticated) route group for cross-role logged-in features.
 */
export async function requireAuthenticatedUser(): Promise<string> {
  const viewer = await getCurrentViewer()
  if (!viewer.userId) {
    redirect('/login')
  }
  return viewer.userId
}
