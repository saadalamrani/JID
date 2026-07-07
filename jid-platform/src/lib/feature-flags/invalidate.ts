import 'server-only'

import { revalidateTag } from 'next/cache'

/** Bust the Next.js unstable_cache layer for a single flag (`flag:${key}` tag). */
export function invalidateFlagCache(key: string): void {
  revalidateTag(`flag:${key}`)
}
