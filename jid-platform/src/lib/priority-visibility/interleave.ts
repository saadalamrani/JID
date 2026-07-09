/**
 * Priority visibility — feed interleave (Prompt 6).
 * Max 1 boosted card per 5 slots; overflow queues without flooding.
 */

import type { JobCardData } from '@/types/job'

export const BOOST_INTERLEAVE_WINDOW = 5
export const BOOST_INTERLEAVE_MAX_PER_WINDOW = 1

export function isJobBoostActive(job: Pick<JobCardData, 'isBoosted' | 'boostEndsAt'>): boolean {
  if (!job.isBoosted || !job.boostEndsAt) return false
  return new Date(job.boostEndsAt).getTime() > Date.now()
}

/** Sort boosted-active jobs ahead, then by published_at desc (stable within groups). */
export function sortJobsWithBoostPriority(jobs: JobCardData[]): JobCardData[] {
  return [...jobs].sort((a, b) => {
    const aBoost = isJobBoostActive(a) ? 1 : 0
    const bBoost = isJobBoostActive(b) ? 1 : 0
    if (aBoost !== bBoost) return bBoost - aBoost
    const aPub = a.published_at ? new Date(a.published_at).getTime() : 0
    const bPub = b.published_at ? new Date(b.published_at).getTime() : 0
    return bPub - aPub
  })
}

export function interleaveBoostedJobs(
  jobs: JobCardData[],
  windowSize = BOOST_INTERLEAVE_WINDOW,
  maxPerWindow = BOOST_INTERLEAVE_MAX_PER_WINDOW,
): JobCardData[] {
  const prioritized = sortJobsWithBoostPriority(jobs)
  const boosted = prioritized.filter((job) => isJobBoostActive(job))
  const regular = prioritized.filter((job) => !isJobBoostActive(job))

  const result: JobCardData[] = []
  let boostedIndex = 0
  let regularIndex = 0
  let boostedInWindow = 0

  while (boostedIndex < boosted.length || regularIndex < regular.length) {
    const canPlaceBoost =
      boostedInWindow < maxPerWindow && boostedIndex < boosted.length

    if (canPlaceBoost) {
      const next = boosted[boostedIndex]
      if (next) {
        result.push(next)
        boostedIndex += 1
        boostedInWindow += 1
      }
    } else if (regularIndex < regular.length) {
      const next = regular[regularIndex]
      if (next) {
        result.push(next)
        regularIndex += 1
      }
    } else if (boostedIndex < boosted.length) {
      const next = boosted[boostedIndex]
      if (next) {
        result.push(next)
        boostedIndex += 1
      }
    }

    if (result.length > 0 && result.length % windowSize === 0) {
      boostedInWindow = 0
    }
  }

  return result
}
