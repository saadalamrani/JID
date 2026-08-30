import { describe, expect, it } from 'vitest'
import { buildHiringIntelligenceReport } from '@/lib/talent-sourcing/intelligence'

describe('hiring intelligence provenance', () => {
  it('exposes only operational counts with source, population, window, and missingness', () => {
    const report = buildHiringIntelligenceReport({
      hiringRoleId: 'role-1',
      generatedAt: '2026-08-30T00:00:00.000Z',
      counts: {
        sourcedCandidates: 4,
        invitationsSent: 2,
        responses: 1,
        applicationsFromSourcing: 0,
        candidatesWithAnyEvidence: 3,
        criterionCount: 2,
      },
    })
    expect(report.metrics).toHaveLength(5)
    for (const metric of report.metrics) {
      expect(metric.source.length).toBeGreaterThan(3)
      expect(metric.population).toContain('role-1')
      expect(metric.timeWindow).toContain('30')
      expect(metric.coverage.length).toBeGreaterThan(3)
      expect(metric.missingness.length).toBeGreaterThan(3)
    }
    expect(report.metrics.some((metric) => metric.id === 'applications_from_sourcing' && metric.value === 0)).toBe(
      true,
    )
    expect(JSON.stringify(report)).not.toMatch(/quality.of.hire|probability of success|top 1%|match percent/i)
  })
})
