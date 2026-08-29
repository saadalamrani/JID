import { mayLinkApplication } from '@/lib/career-operations/application-bridge'
import { AbhathliBoundaryError, type AbhathliApproval, type AbhathliRecommendation } from './types'
import { isSafeHttpUrl } from './untrusted-posting'

export function assertSingleConsequentialAction(opportunityIds: readonly string[]): void {
  if (opportunityIds.length !== 1) {
    throw new AbhathliBoundaryError(
      'MASS_APPLY_FORBIDDEN',
      'Abhathli cannot apply or redirect more than one opportunity in a single approval.',
    )
  }
}

export function assertApprovalAllowsAction(approval: AbhathliApproval | null): void {
  if (!approval || !approval.approved) {
    throw new AbhathliBoundaryError(
      'APPROVAL_REQUIRED',
      'User approval is required before apply or redirect.',
    )
  }
}

export function resolveApprovedAction(input: {
  recommendation: AbhathliRecommendation
  approval: AbhathliApproval | null
}): {
  action: 'apply_native' | 'redirect_external' | 'track_only'
  href: string | null
  creates_internal_application: boolean
} {
  assertApprovalAllowsAction(input.approval)
  assertSingleConsequentialAction([input.recommendation.opportunity_id])

  if (input.recommendation.source_class === 'GOVERNED_EXTERNAL') {
    if (!mayLinkApplication('GOVERNED_EXTERNAL')) {
      // always true; kept as an explicit boundary
    }
    const href = input.recommendation.apply_url
    if (href && !isSafeHttpUrl(href)) {
      throw new AbhathliBoundaryError('UNTRUSTED_POSTING', 'Apply URL is not a safe http(s) destination.')
    }
    return {
      action: href ? 'redirect_external' : 'track_only',
      href,
      creates_internal_application: false,
    }
  }

  const nativePath = `/opportunities/${input.recommendation.opportunity_id.replace(/^native:/, '')}`
  return {
    action: 'apply_native',
    href: nativePath,
    creates_internal_application: false,
  }
}

export function assertNoCareerRecordMutation(intent: 'read' | 'write'): void {
  if (intent === 'write') {
    throw new AbhathliBoundaryError(
      'CAREER_RECORD_WRITE_FORBIDDEN',
      'Abhathli and Radar must not silently alter the Career Record.',
    )
  }
}
