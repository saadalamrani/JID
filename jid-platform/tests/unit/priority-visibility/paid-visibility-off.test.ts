import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  interleaveBoostedJobs,
  sortJobsWithBoostPriority,
} from '@/lib/priority-visibility/interleave'
import type { JobCardData } from '@/types/job'

function stubJob(partial: {
  id: string
  isBoosted?: boolean
  boostEndsAt?: string | null
  published_at?: string
}): JobCardData {
  return {
    id: partial.id,
    business_profile_id: null,
    slug: partial.id,
    title_ar: 'فرصة',
    title_en: 'Opportunity',
    experience_level: 'entry',
    status: 'active',
    city: null,
    is_remote: false,
    salary_min: null,
    salary_max: null,
    salary_currency: 'SAR',
    application_deadline: '2026-12-01T00:00:00.000Z',
    deadlineDaysLeft: 30,
    published_at: partial.published_at ?? '2026-08-01T00:00:00.000Z',
    applicant_count: 0,
    applyUrl: null,
    company: {
      id: 'c1',
      name_en: 'Demo Co',
      name_ar: 'جهة تجريبية',
      slug: 'demo',
      logo_url: null,
      ownership_type: null,
      career_portal_url: null,
    },
    sector: null,
    region: null,
    tier: 'normal',
    isBoosted: partial.isBoosted ?? false,
    boostStartsAt: null,
    boostEndsAt: partial.boostEndsAt ?? null,
  }
}

describe('Paid visibility functionally off for interview prototype', () => {
  it('does not reorder two comparable jobs solely because one is boosted', () => {
    const regular = stubJob({
      id: 'regular',
      isBoosted: false,
      published_at: '2026-08-10T00:00:00.000Z',
    })
    const boosted = stubJob({
      id: 'boosted',
      isBoosted: true,
      boostEndsAt: '2099-01-01T00:00:00.000Z',
      published_at: '2026-08-09T00:00:00.000Z',
    })

    const input = [regular, boosted]
    expect(sortJobsWithBoostPriority(input).map((j) => j.id)).toEqual(['regular', 'boosted'])
    expect(interleaveBoostedJobs(input).map((j) => j.id)).toEqual(['regular', 'boosted'])
  })

  it('fetchJobs source never orders by is_boosted or calls interleave', () => {
    const source = readFileSync(join(process.cwd(), 'src/lib/queries/jobs.ts'), 'utf8')
    expect(source).not.toContain("order('is_boosted'")
    expect(source).not.toContain('interleaveBoostedJobs')
  })
})
