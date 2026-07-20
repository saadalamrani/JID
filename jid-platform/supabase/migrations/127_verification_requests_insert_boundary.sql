-- JID-102A1 — verification_requests INSERT authorization boundary
-- Closes the applicant forge path: status/review/resulting_profile fields must not be
-- client-writable on INSERT. Staff transitions remain SECURITY DEFINER RPCs only.
-- Legitimate applicant submission status is pending_review (matches submitClaimRequest /
-- submitCatalogClaim). Business and University verification_type remain allowed.

ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

-- Table-level lockdown for API roles (TRUNCATE cannot be gated by RLS).
REVOKE ALL ON TABLE public.verification_requests FROM anon, authenticated;

-- Applicants and Staff read via existing SELECT policies (authenticated only).
GRANT SELECT ON TABLE public.verification_requests TO authenticated;

-- Applicants may INSERT only submission columns — not review/moderation/profile fields.
GRANT INSERT (
  id,
  applicant_user_id,
  directory_id,
  company_name,
  business_email,
  claimant_name,
  claimant_title,
  evidence_urls,
  status,
  verification_type,
  domain_verified,
  created_at,
  updated_at
) ON TABLE public.verification_requests TO authenticated;

DROP POLICY IF EXISTS verification_applicant_insert_own ON public.verification_requests;

CREATE POLICY verification_applicant_insert_own
  ON public.verification_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    applicant_user_id = auth.uid()
    AND status = 'pending_review'
    AND verification_type IN ('business', 'university')
    AND reviewed_by IS NULL
    AND reviewed_at IS NULL
    AND review_notes IS NULL
    AND rejection_reason IS NULL
    AND can_reapply_after IS NULL
    AND resulting_profile_id IS NULL
    AND resulting_profile_type IS NULL
    AND assigned_staff_id IS NULL
    AND first_viewed_at IS NULL
    AND first_viewed_by IS NULL
    AND sla_due_at IS NULL
    AND coalesce(verified_domains, '{}'::text[]) = '{}'::text[]
    AND coalesce(required_documents, '{}'::text[]) = '{}'::text[]
  );

COMMENT ON POLICY verification_applicant_insert_own ON public.verification_requests IS
  'JID-102A1: applicants may insert only their own pending_review verification row with staff-controlled fields null/empty. Approval/rejection and resulting_profile linkage remain RPC-only.';

NOTIFY pgrst, 'reload schema';
