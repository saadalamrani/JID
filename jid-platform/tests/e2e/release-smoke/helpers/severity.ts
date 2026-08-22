/**
 * Release-smoke failure severity.
 * Only P0/P1 are promotion blockers by default.
 */
export const RELEASE_SMOKE_SEVERITIES = ['P0', 'P1', 'P2', 'P3'] as const

export type ReleaseSmokeSeverity = (typeof RELEASE_SMOKE_SEVERITIES)[number]

export type SeverityRule = {
  severity: ReleaseSmokeSeverity
  /** Short durable reason used in reports and annotations. */
  reason: string
  /** True when this class blocks promotion by default. */
  promotionBlocker: boolean
}

/** Canonical classification contract for the durable release smoke harness. */
export const SEVERITY_CONTRACT: Record<ReleaseSmokeSeverity, SeverityRule> = {
  P0: {
    severity: 'P0',
    reason: 'security/privacy/data-loss/authorization/core app unavailable',
    promotionBlocker: true,
  },
  P1: {
    severity: 'P1',
    reason: 'core actor journey broken / route unavailable / severe runtime regression',
    promotionBlocker: true,
  },
  P2: {
    severity: 'P2',
    reason: 'localized or non-blocking UX defect',
    promotionBlocker: false,
  },
  P3: {
    severity: 'P3',
    reason: 'cosmetic',
    promotionBlocker: false,
  },
}

export function isPromotionBlocker(severity: ReleaseSmokeSeverity): boolean {
  return SEVERITY_CONTRACT[severity].promotionBlocker
}

export function parseSeverityTag(tag: string): ReleaseSmokeSeverity | null {
  const normalized = tag.trim().toUpperCase().replace(/^@/, '')
  if ((RELEASE_SMOKE_SEVERITIES as readonly string[]).includes(normalized)) {
    return normalized as ReleaseSmokeSeverity
  }
  return null
}

/**
 * Map a caught failure into actionable severity.
 * Prefer explicit test annotations; fall back to message heuristics.
 */
export function classifyFailure(input: {
  annotatedSeverity?: ReleaseSmokeSeverity | null
  message: string
}): ReleaseSmokeSeverity {
  if (input.annotatedSeverity) return input.annotatedSeverity

  const message = input.message.toLowerCase()

  if (
    /rls|unauthorized|forbidden|leak|pii|password=.|csrf|xss|sql injection|data.?loss/.test(
      message,
    )
  ) {
    return 'P0'
  }

  if (
    /timeout|net::err|target closed|crashed|hydration|uncaught|500|application error|blank landing|route unavailable|login redirect timeout/.test(
      message,
    )
  ) {
    return 'P1'
  }

  if (/locale|rtl|ltr|landmark|viewport|navigation|copy|i18n/.test(message)) {
    return 'P2'
  }

  return 'P3'
}
