import {
  isProfessionallyDiscoverable,
  type ProfessionalDiscoverability,
  type TalentInvitationState,
} from '@/types/contracts/talent-sourcing'

export { isProfessionallyDiscoverable }

export type VerifiedEmployerContext = {
  isAuthenticated: boolean
  isStaff: boolean
  isVerifiedApprovedBusiness: boolean
  canReadHiringWorkspace: boolean
  canWriteHiringWorkspace: boolean
}

export function canSearchDiscoverableTalent(ctx: VerifiedEmployerContext): boolean {
  if (!ctx.isAuthenticated) return false
  if (ctx.isStaff && ctx.canReadHiringWorkspace) return true
  return ctx.isVerifiedApprovedBusiness && ctx.canReadHiringWorkspace
}

export function canInviteDiscoverableTalent(ctx: VerifiedEmployerContext): boolean {
  if (!ctx.isAuthenticated) return false
  if (ctx.isStaff && ctx.canWriteHiringWorkspace) return true
  return ctx.isVerifiedApprovedBusiness && ctx.canWriteHiringWorkspace
}

export function discoverabilityFromProfile(profile: {
  visibility: 'private' | 'discoverable' | 'public' | string
  show_profile_to_companies: boolean
  role?: string | null
  profile_state?: string | null
  deleted_at?: string | null
  suspended_at?: string | null
}): boolean {
  const visibility: ProfessionalDiscoverability['visibility'] =
    profile.visibility === 'discoverable' ? 'discoverable' : 'private'
  return isProfessionallyDiscoverable({
    visibility,
    showProfileToCompanies: profile.show_profile_to_companies,
    role: profile.role,
    profileState: profile.profile_state,
    deletedAt: profile.deleted_at,
    suspendedAt: profile.suspended_at,
  })
}

/** Invitation is never an Application. */
export function invitationCreatesApplication(_state: TalentInvitationState): false {
  return false
}
