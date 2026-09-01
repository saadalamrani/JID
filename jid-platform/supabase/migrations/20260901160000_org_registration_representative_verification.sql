-- Post-wave correction: organization registration + representative verification
-- Public signup must not require a Directory/Catalog row.
-- Applicant-submitted fields are evidence until Staff reconciliation.
-- Approval remains fail-closed: no institutional authority without a linked organization.

ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.verification_requests
  ALTER COLUMN directory_id DROP NOT NULL;

ALTER TABLE public.verification_requests
  ADD COLUMN IF NOT EXISTS submitted_name_ar text,
  ADD COLUMN IF NOT EXISTS submitted_name_en text,
  ADD COLUMN IF NOT EXISTS submitted_website text,
  ADD COLUMN IF NOT EXISTS submitted_domain text,
  ADD COLUMN IF NOT EXISTS reconciliation_state text NOT NULL DEFAULT 'unresolved';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'verification_requests_reconciliation_state_chk'
  ) THEN
    ALTER TABLE public.verification_requests
      ADD CONSTRAINT verification_requests_reconciliation_state_chk
      CHECK (reconciliation_state IN (
        'unresolved',
        'link_existing',
        'create_after_approval',
        'needs_reconciliation',
        'existing_workspace_review_required',
        'request_correction',
        'rejected',
        'resolved'
      ));
  END IF;
END;
$$;

UPDATE public.verification_requests
SET reconciliation_state = CASE
  WHEN status = 'approved' AND directory_id IS NOT NULL THEN 'resolved'
  WHEN status = 'rejected' THEN 'rejected'
  WHEN directory_id IS NOT NULL THEN 'link_existing'
  ELSE 'unresolved'
END
WHERE reconciliation_state = 'unresolved'
   OR reconciliation_state IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'verification_requests_approved_requires_directory'
  ) THEN
    ALTER TABLE public.verification_requests
      ADD CONSTRAINT verification_requests_approved_requires_directory
      CHECK (
        status <> 'approved'
        OR (directory_id IS NOT NULL AND reconciliation_state = 'resolved')
      );
  END IF;
END;
$$;

COMMENT ON COLUMN public.verification_requests.directory_id IS
  'Canonical Directory linkage after internal reconciliation. NULL means the request is an unresolved organization registration. Never set by public signup.';

COMMENT ON COLUMN public.verification_requests.company_name IS
  'Applicant-submitted organization name (evidence). Not automatically canonical Directory truth.';

COMMENT ON COLUMN public.verification_requests.submitted_name_ar IS
  'Applicant-submitted Arabic organization name (evidence).';

COMMENT ON COLUMN public.verification_requests.submitted_name_en IS
  'Applicant-submitted English organization name (evidence).';

COMMENT ON COLUMN public.verification_requests.submitted_website IS
  'Applicant-submitted official website (evidence).';

COMMENT ON COLUMN public.verification_requests.submitted_domain IS
  'Applicant-submitted official domain (evidence). Domain match is not authorization.';

COMMENT ON COLUMN public.verification_requests.reconciliation_state IS
  'Internal organization-reconciliation state. Unresolved requests cannot be approved.';

DROP POLICY IF EXISTS verification_applicant_insert_initial_own
  ON public.verification_requests;

CREATE POLICY verification_applicant_insert_initial_own
  ON public.verification_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    applicant_user_id = (SELECT auth.uid())
    AND status = 'pending_review'
    AND directory_id IS NULL
    AND reconciliation_state = 'unresolved'
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
    AND verification_type IN ('business', 'university')
    AND length(btrim(company_name)) >= 2
    AND length(btrim(business_email)) >= 3
    AND length(btrim(claimant_name)) >= 2
  );

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
  verification_type,
  submitted_name_ar,
  submitted_name_en,
  submitted_website,
  submitted_domain
) ON TABLE public.verification_requests TO authenticated;

COMMENT ON POLICY verification_applicant_insert_initial_own
  ON public.verification_requests IS
  'Applicants may submit their own pending representative-verification request with applicant-submitted organization evidence only. Directory linkage, reconciliation, Staff, audit, and resulting Profile fields are excluded. Domain match is not required.';

CREATE OR REPLACE FUNCTION public.enforce_verification_approval_reconciliation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    IF NEW.directory_id IS NULL THEN
      RAISE EXCEPTION 'organization_reconciliation_required';
    END IF;

    IF NEW.verification_type = 'business' AND EXISTS (
      SELECT 1 FROM public.business_profiles bp WHERE bp.directory_id = NEW.directory_id
    ) THEN
      RAISE EXCEPTION 'existing_workspace_review_required';
    END IF;

    IF NEW.verification_type = 'university' AND EXISTS (
      SELECT 1 FROM public.university_profiles up WHERE up.directory_id = NEW.directory_id
    ) THEN
      RAISE EXCEPTION 'existing_workspace_review_required';
    END IF;

    NEW.reconciliation_state := 'resolved';
  END IF;

  IF NEW.status = 'rejected' AND (OLD.status IS DISTINCT FROM 'rejected') THEN
    NEW.reconciliation_state := 'rejected';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_verification_approval_reconciliation()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_verification_approval_reconciliation
  ON public.verification_requests;

CREATE TRIGGER trg_verification_approval_reconciliation
  BEFORE UPDATE ON public.verification_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_verification_approval_reconciliation();

CREATE OR REPLACE FUNCTION public.create_business_profile(
  p_verification_id uuid,
  p_display_name_ar text,
  p_display_name_en text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id uuid := auth.uid();
  v_actor_role public.user_role_enum;
  v_req public.verification_requests%ROWTYPE;
  v_profile_id uuid;
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_req
  FROM public.verification_requests
  WHERE id = p_verification_id
    AND applicant_user_id = v_actor_id
  FOR UPDATE;

  IF v_req.id IS NULL THEN
    RAISE EXCEPTION 'verification_not_found';
  END IF;

  IF v_req.status <> 'approved' THEN
    RAISE EXCEPTION 'verification_not_approved';
  END IF;

  IF v_req.verification_type <> 'business' THEN
    RAISE EXCEPTION 'wrong_verification_type';
  END IF;

  IF v_req.directory_id IS NULL THEN
    RAISE EXCEPTION 'organization_reconciliation_required';
  END IF;

  IF v_req.resulting_profile_id IS NOT NULL THEN
    RAISE EXCEPTION 'profile_already_created';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.business_profiles bp WHERE bp.directory_id = v_req.directory_id
  ) THEN
    RAISE EXCEPTION 'existing_workspace_review_required';
  END IF;

  IF p_display_name_ar IS NULL OR length(trim(p_display_name_ar)) = 0 THEN
    RAISE EXCEPTION 'display_name_required';
  END IF;

  INSERT INTO public.business_profiles (
    directory_id,
    owner_user_id,
    display_name_ar,
    display_name_en,
    verified_domains,
    status
  )
  VALUES (
    v_req.directory_id,
    v_actor_id,
    trim(p_display_name_ar),
    NULLIF(trim(p_display_name_en), ''),
    COALESCE(v_req.verified_domains, '{}'::text[]),
    'draft'
  )
  RETURNING id INTO v_profile_id;

  UPDATE public.verification_requests
  SET
    resulting_profile_id = v_profile_id,
    resulting_profile_type = 'business',
    updated_at = now()
  WHERE id = p_verification_id;

  SELECT role INTO v_actor_role FROM public.profiles WHERE id = v_actor_id;

  PERFORM public._write_audit_log(
    v_actor_id,
    'profile.created',
    'business_profile',
    v_profile_id,
    NULL,
    jsonb_build_object(
      'directory_id', v_req.directory_id,
      'verification_id', p_verification_id,
      'actor_role', v_actor_role
    )
  );

  RETURN v_profile_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_university_profile(
  p_verification_id uuid,
  p_display_name_ar text,
  p_display_name_en text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id uuid := auth.uid();
  v_actor_role public.user_role_enum;
  v_req public.verification_requests%ROWTYPE;
  v_profile_id uuid;
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_req
  FROM public.verification_requests
  WHERE id = p_verification_id
    AND applicant_user_id = v_actor_id
  FOR UPDATE;

  IF v_req.id IS NULL THEN
    RAISE EXCEPTION 'verification_not_found';
  END IF;

  IF v_req.status <> 'approved' THEN
    RAISE EXCEPTION 'verification_not_approved';
  END IF;

  IF v_req.verification_type <> 'university' THEN
    RAISE EXCEPTION 'wrong_verification_type';
  END IF;

  IF v_req.directory_id IS NULL THEN
    RAISE EXCEPTION 'organization_reconciliation_required';
  END IF;

  IF v_req.resulting_profile_id IS NOT NULL THEN
    RAISE EXCEPTION 'profile_already_created';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.university_profiles up WHERE up.directory_id = v_req.directory_id
  ) THEN
    RAISE EXCEPTION 'existing_workspace_review_required';
  END IF;

  IF p_display_name_ar IS NULL OR length(trim(p_display_name_ar)) = 0 THEN
    RAISE EXCEPTION 'display_name_required';
  END IF;

  INSERT INTO public.university_profiles (
    directory_id,
    owner_user_id,
    display_name_ar,
    display_name_en,
    verified_domains,
    status
  )
  VALUES (
    v_req.directory_id,
    v_actor_id,
    trim(p_display_name_ar),
    NULLIF(trim(p_display_name_en), ''),
    COALESCE(v_req.verified_domains, '{}'::text[]),
    'draft'
  )
  RETURNING id INTO v_profile_id;

  UPDATE public.verification_requests
  SET
    resulting_profile_id = v_profile_id,
    resulting_profile_type = 'university',
    updated_at = now()
  WHERE id = p_verification_id;

  SELECT role INTO v_actor_role FROM public.profiles WHERE id = v_actor_id;

  PERFORM public._write_audit_log(
    v_actor_id,
    'profile.created',
    'university_profile',
    v_profile_id,
    NULL,
    jsonb_build_object(
      'directory_id', v_req.directory_id,
      'verification_id', p_verification_id,
      'actor_role', v_actor_role
    )
  );

  RETURN v_profile_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.link_verification_directory(
  p_verification_id uuid,
  p_directory_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id uuid := auth.uid();
  v_caller_role public.user_role_enum;
  v_req public.verification_requests%ROWTYPE;
  v_directory public.companies%ROWTYPE;
  v_state text;
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT role INTO v_caller_role FROM public.profiles WHERE id = v_actor_id;
  IF v_caller_role NOT IN ('staff', 'super_admin') THEN
    RAISE EXCEPTION 'insufficient_privileges';
  END IF;

  SELECT * INTO v_req
  FROM public.verification_requests
  WHERE id = p_verification_id
  FOR UPDATE;

  IF v_req.id IS NULL THEN
    RAISE EXCEPTION 'invalid_or_already_reviewed';
  END IF;

  IF v_req.status NOT IN ('pending', 'submitted', 'pending_review', 'under_review', 'needs_more_info') THEN
    RAISE EXCEPTION 'invalid_or_already_reviewed';
  END IF;

  SELECT * INTO v_directory
  FROM public.companies
  WHERE id = p_directory_id;

  IF v_directory.id IS NULL THEN
    RAISE EXCEPTION 'directory_not_found';
  END IF;

  IF v_directory.entity_type::text IS DISTINCT FROM v_req.verification_type::text THEN
    RAISE EXCEPTION 'directory_type_mismatch';
  END IF;

  v_state := 'link_existing';
  IF v_req.verification_type = 'business' AND EXISTS (
    SELECT 1 FROM public.business_profiles bp WHERE bp.directory_id = p_directory_id
  ) THEN
    v_state := 'existing_workspace_review_required';
  ELSIF v_req.verification_type = 'university' AND EXISTS (
    SELECT 1 FROM public.university_profiles up WHERE up.directory_id = p_directory_id
  ) THEN
    v_state := 'existing_workspace_review_required';
  END IF;

  UPDATE public.verification_requests
  SET
    directory_id = p_directory_id,
    reconciliation_state = v_state,
    updated_at = now()
  WHERE id = p_verification_id;

  PERFORM public._write_audit_log(
    v_actor_id,
    'verification.directory_linked',
    'verification_request',
    p_verification_id,
    jsonb_build_object(
      'directory_id', v_req.directory_id,
      'reconciliation_state', v_req.reconciliation_state
    ),
    jsonb_build_object(
      'directory_id', p_directory_id,
      'reconciliation_state', v_state
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.create_directory_for_verification(
  p_verification_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id uuid := auth.uid();
  v_caller_role public.user_role_enum;
  v_req public.verification_requests%ROWTYPE;
  v_directory_id uuid;
  v_name text;
  v_name_ar text;
  v_domains text[];
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT role INTO v_caller_role FROM public.profiles WHERE id = v_actor_id;
  IF v_caller_role NOT IN ('staff', 'super_admin') THEN
    RAISE EXCEPTION 'insufficient_privileges';
  END IF;

  SELECT * INTO v_req
  FROM public.verification_requests
  WHERE id = p_verification_id
  FOR UPDATE;

  IF v_req.id IS NULL THEN
    RAISE EXCEPTION 'invalid_or_already_reviewed';
  END IF;

  IF v_req.status NOT IN ('pending', 'submitted', 'pending_review', 'under_review', 'needs_more_info') THEN
    RAISE EXCEPTION 'invalid_or_already_reviewed';
  END IF;

  IF v_req.directory_id IS NOT NULL THEN
    RAISE EXCEPTION 'directory_already_linked';
  END IF;

  v_name := NULLIF(trim(COALESCE(v_req.submitted_name_en, v_req.company_name, '')), '');
  v_name_ar := NULLIF(trim(COALESCE(v_req.submitted_name_ar, '')), '');
  IF v_name IS NULL THEN
    RAISE EXCEPTION 'submitted_organization_name_required';
  END IF;

  v_domains := CASE
    WHEN NULLIF(trim(COALESCE(v_req.submitted_domain, '')), '') IS NOT NULL
      THEN ARRAY[lower(trim(v_req.submitted_domain))]
    ELSE '{}'::text[]
  END;

  INSERT INTO public.companies (
    name,
    name_ar,
    domains,
    entity_type,
    is_verified,
    entity_state,
    website_url
  )
  VALUES (
    v_name,
    v_name_ar,
    v_domains,
    CASE v_req.verification_type
      WHEN 'university' THEN 'university'::public.entity_type_enum
      ELSE 'business'::public.entity_type_enum
    END,
    false,
    'unclaimed',
    NULLIF(trim(COALESCE(v_req.submitted_website, '')), '')
  )
  RETURNING id INTO v_directory_id;

  UPDATE public.verification_requests
  SET
    directory_id = v_directory_id,
    reconciliation_state = 'create_after_approval',
    updated_at = now()
  WHERE id = p_verification_id;

  PERFORM public._write_audit_log(
    v_actor_id,
    'verification.directory_created',
    'verification_request',
    p_verification_id,
    jsonb_build_object('directory_id', NULL, 'reconciliation_state', v_req.reconciliation_state),
    jsonb_build_object(
      'directory_id', v_directory_id,
      'reconciliation_state', 'create_after_approval',
      'is_verified', false
    )
  );

  RETURN v_directory_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_verification_needs_reconciliation(
  p_verification_id uuid,
  p_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id uuid := auth.uid();
  v_caller_role public.user_role_enum;
  v_req public.verification_requests%ROWTYPE;
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT role INTO v_caller_role FROM public.profiles WHERE id = v_actor_id;
  IF v_caller_role NOT IN ('staff', 'super_admin') THEN
    RAISE EXCEPTION 'insufficient_privileges';
  END IF;

  SELECT * INTO v_req
  FROM public.verification_requests
  WHERE id = p_verification_id
  FOR UPDATE;

  IF v_req.id IS NULL THEN
    RAISE EXCEPTION 'invalid_or_already_reviewed';
  END IF;

  IF v_req.status NOT IN ('pending', 'submitted', 'pending_review', 'under_review', 'needs_more_info') THEN
    RAISE EXCEPTION 'invalid_or_already_reviewed';
  END IF;

  UPDATE public.verification_requests
  SET
    reconciliation_state = 'needs_reconciliation',
    updated_at = now()
  WHERE id = p_verification_id;

  PERFORM public._write_audit_log(
    v_actor_id,
    'verification.needs_reconciliation',
    'verification_request',
    p_verification_id,
    jsonb_build_object('reconciliation_state', v_req.reconciliation_state),
    jsonb_build_object(
      'reconciliation_state', 'needs_reconciliation',
      'notes', NULLIF(trim(COALESCE(p_notes, '')), '')
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.link_verification_directory(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.link_verification_directory(uuid, uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.create_directory_for_verification(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_directory_for_verification(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.mark_verification_needs_reconciliation(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_verification_needs_reconciliation(uuid, text) TO authenticated;

NOTIFY pgrst, 'reload schema';
