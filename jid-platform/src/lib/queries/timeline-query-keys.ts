/** Shared React Query keys for timeline meetings — safe for client and server imports. */
export function timelineMeetingsQueryKey(userId: string) {
  return ['radar', 'timeline', 'meetings', userId] as const
}
