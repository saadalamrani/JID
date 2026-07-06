/**
 * Section 5.3 — applicant name click with recruiter privacy gate.
 * Spec references user_privacy_settings.show_profile_to_recruiters;
 * reconciled schema uses profiles.show_profile_to_companies (migration 048).
 */

export const RECRUITER_PROFILE_HIDDEN_TOAST_AR =
  'هذا المرشّح أخفى ملفه الشخصي عن جهات التوظيف'

export type ApplicantNameClickInput = {
  id: string
  show_profile_to_recruiters: boolean
}

export type ApplicantNameClickHandlers = {
  openProfile: (profilePath: string) => void
  showToast: (message: string) => void
}

export function handleApplicantNameClick(
  applicant: ApplicantNameClickInput,
  handlers: ApplicantNameClickHandlers,
): void {
  if (!applicant.show_profile_to_recruiters) {
    handlers.showToast(RECRUITER_PROFILE_HIDDEN_TOAST_AR)
    return
  }

  handlers.openProfile(`/u/${applicant.id}`)
}
