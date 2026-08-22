/**
 * Priority visibility — feed interleave (Prompt 6).
 *
 * Interview prototype lock: paid visibility is FUNCTIONALLY OFF.
 * These helpers remain for future re-enablement but must not reorder feeds.
 */

import type { JobCardData } from '@/types/job'

export const BOOST_INTERLEAVE_WINDOW = 5
export const BOOST_INTERLEAVE_MAX_PER_WINDOW = 1

export function isJobBoostActive(job: Pick<JobCardData, 'isBoosted' | 'boostEndsAt'>): boolean {
  if (!job.isBoosted || !job.boostEndsAt) return false
  return new Date(job.boostEndsAt).getTime() > Date.now()
}

/** Prototype: preserve input order — never sort by boost. */
export function sortJobsWithBoostPriority(jobs: JobCardData[]): JobCardData[] {
  return [...jobs]
}

/** Prototype: identity — never interleave boosted cards ahead of peers. */
export function interleaveBoostedJobs(
  jobs: JobCardData[],
  _windowSize = BOOST_INTERLEAVE_WINDOW,
  _maxPerWindow = BOOST_INTERLEAVE_MAX_PER_WINDOW,
): JobCardData[] {
  void _windowSize
  void _maxPerWindow
  return [...jobs]
}
