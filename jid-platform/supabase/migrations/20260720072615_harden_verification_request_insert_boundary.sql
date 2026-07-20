-- JID-102A: applicant verification requests may contain applicant-owned
-- submission data only. Staff decision, moderation, audit, and resulting
-- Profile fields remain database/RPC controlled.

ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.enforce_verification_request_applicant_insert_boundary()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id uuid := auth.uid();
BEGIN
  -- Trusted database/service maintenance has no applicant JWT. Anonymous Data
  -- API requests remain denied by grants and RLS.
  IF v_actor_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.verification_requests AS existing
    WHERE existing.applicant_user_id = v_actor_id
      AND existing.status IN ('pending', 'submitted', 'pending_review', 'under_review', 'needs_more_info')
  ) THEN
    RAISE EXCEPTION 'active_verification_request_exists';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.verification_requests AS rejected
    WHERE rejected.applicant_user_id = v_actor_id
      AND rejected.status = 'rejected'
      AND rejected.can_reapply_after > now()
  ) THEN
    RAISE EXCEPTION 'verification_reapplication_cooldown_active';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_verification_request_applicant_insert_boundary()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_verification_request_applicant_insert_boundary
  ON public.verification_requests;

CREATE TRIGGER trg_verification_request_applicant_insert_boundary
  BEFORE INSERT ON public.verification_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_verification_request_applicant_insert_boundary();

DROP POLICY IF EXISTS verification_applicant_insert_own
  ON public.verification_requests;
DROP POLICY IF EXISTS verification_applicant_insert_initial_own
  ON public.verification_requests;

CREATE POLICY verification_applicant_insert_initial_own
  ON public.verification_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    applicant_user_id = (SELECT auth.uid())
    AND status = 'pending_review'
    AND review_notes IS NULL
    AND reviewed_by IS NULL
    AND reviewed_at IS NULL
    AND rejection_reason IS NULL
    AND can_reapply_after IS NULL
    AND required_documents = '{}'::text[]
    AND domain_verified = false
    AND assigned_staff_id IS NULL
    AND first_viewed_at IS NULL
    AND first_viewed_by IS NULL
    AND sla_due_at IS NULL
    AND resulting_profile_id IS NULL
    AND resulting_profile_type IS NULL
    AND verified_domains = '{}'::text[]
    AND evidence_urls = '{}'::text[]
    AND EXISTS (
      SELECT 1
      FROM public.companies AS directory
      WHERE directory.id = directory_id
        AND directory.is_active = true
        AND directory.entity_type::text = verification_type::text
        AND directory.name = company_name
        AND EXISTS (
          SELECT 1
          FROM unnest(COALESCE(directory.domains, '{}'::text[])) AS allowed(raw_domain)
          CROSS JOIN LATERAL (
            SELECT lower(trim(leading '@' FROM trim(allowed.raw_domain))) AS normalized_domain
          ) AS normalized
          WHERE normalized.normalized_domain <> ''
            AND (
              lower(split_part(business_email, '@', 2)) = normalized.normalized_domain
              OR lower(split_part(business_email, '@', 2)) LIKE '%.' || normalized.normalized_domain
            )
        )
    )
  );

-- The Data API previously inherited full-table INSERT privilege. Restrict the
-- applicant role to the fields used by EntitySignupWizard's submission path.
REVOKE INSERT ON TABLE public.verification_requests FROM anon, authenticated;

GRANT INSERT (
  applicant_user_id,
  directory_id,
  company_name,
  business_email,
  claimant_name,
  claimant_title,
  evidence_urls,
  status,
  verification_type
) ON TABLE public.verification_requests TO authenticated;

COMMENT ON POLICY verification_applicant_insert_initial_own
  ON public.verification_requests IS
  'JID-102A: applicants may submit only their own pending_review request for a matching active Business/University Directory record and institutional email domain. Staff, audit, and resulting Profile fields are excluded.';

NOTIFY pgrst, 'reload schema';
