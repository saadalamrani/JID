/** Shared React Query keys for Radar — safe for client and server imports. */
export function radarApplicationsQueryKey(userId: string) {
  return ['radar', 'applications', userId] as const
}
