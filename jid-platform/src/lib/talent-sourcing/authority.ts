import type { VerifiedEmployerContext } from '@/lib/talent-sourcing/eligibility'

export class TalentSourcingAuthorityError extends Error {
  readonly status: number
  constructor(message: string, status = 403) {
    super(message)
    this.name = 'TalentSourcingAuthorityError'
    this.status = status
  }
}

export function requireSearchAuthority(ctx: VerifiedEmployerContext): void {
  if (!ctx.isAuthenticated) {
    throw new TalentSourcingAuthorityError('authentication required', 401)
  }
  if (!ctx.isVerifiedApprovedBusiness && !ctx.isStaff) {
    throw new TalentSourcingAuthorityError('verified employer required', 403)
  }
  if (!ctx.canReadHiringWorkspace) {
    throw new TalentSourcingAuthorityError('hiring workspace access required', 403)
  }
}

export function requireInviteAuthority(ctx: VerifiedEmployerContext): void {
  requireSearchAuthority(ctx)
  if (!ctx.canWriteHiringWorkspace) {
    throw new TalentSourcingAuthorityError('hiring write authority required', 403)
  }
}
