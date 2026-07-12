-- Staff Portal — Master Prompt Section 3 (claim assignment, metrics view, content flags, RPCs, RLS).
-- Reconciled with Auth/RBAC sprint: claim_requests.user_id (not claimant_user_id),
-- audit_logs.created_at (alias performed_at in views), review_claim_request preserved as wrapper.

-- ---------------------------------------------------------------------------
-- Section 3.1 — claim_requests assignment + first-view tracking
-- (submitted, needs_more_info are created in 027/031 claim_status_enum)

ALTER TABLE public.claim_requests
  ADD COLUMN IF NOT EXISTS assigned_staff_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS first_viewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS first_viewed_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sla_due_at timestamptz;

UPDATE public.claim_requests
SET sla_due_at = created_at + interval '72 hours'
WHERE sla_due_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_claims_assigned
  ON public.claim_requests (assigned_staff_id, status)
  WHERE status = 'pending_review';

-- ---------------------------------------------------------------------------
-- Section 3.1 — assign_claim_to_self()
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.assign_claim_to_self(p_claim_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id uuid := auth.uid();
  v_actor_role public.user_role_enum;
  v_claim public.claim_requests%ROWTYPE;
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT role INTO v_actor_role FROM public.profiles WHERE id = v_actor_id;

  IF v_actor_role NOT IN ('staff', 'super_admin') THEN
    RAISE EXCEPTION 'Only staff or super administrators can assign claims';
  END IF;

  SELECT * INTO v_claim FROM public.claim_requests WHERE id = p_claim_id FOR UPDATE;

  IF v_claim.id IS NULL THEN
    RAISE EXCEPTION 'Claim not found';
  END IF;

  IF v_claim.status NOT IN ('pending', 'submitted', 'pending_review', 'under_review') THEN
    RAISE EXCEPTION 'Claim is not open for assignment';
  END IF;

  UPDATE public.claim_requests
  SET
    assigned_staff_id = v_actor_id,
    first_viewed_at = COALESCE(first_viewed_at, now()),
    first_viewed_by = COALESCE(first_viewed_by, v_actor_id),
    updated_at = now()
  WHERE id = p_claim_id;
END;
$$;

REVOKE ALL ON FUNCTION public.assign_claim_to_self(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assign_claim_to_self(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- Section 3.3 — content_flags + enums (before metrics view)
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  CREATE TYPE public.flag_reason_enum AS ENUM (
    'spam',
    'harassment',
    'hate_speech',
    'inappropriate_content',
    'misinformation',
    'impersonation',
    'copyright_violation',
    'privacy_violation',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE TYPE public.flag_status_enum AS ENUM (
    'pending',
    'under_review',
    'resolved',
    'dismissed'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE TYPE public.content_flag_target_type_enum AS ENUM (
    'profile',
    'job',
    'company',
    'mentor_profile',
    'announcement',
    'message'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

CREATE TABLE IF NOT EXISTS public.content_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  target_type public.content_flag_target_type_enum NOT NULL,
  target_id uuid NOT NULL,
  reason public.flag_reason_enum NOT NULL,
  details text,
  status public.flag_status_enum NOT NULL DEFAULT 'pending',
  assigned_staff_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  reviewed_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  resolution_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT content_flags_details_len_chk
    CHECK (details IS NULL OR char_length(details) <= 1000),
  CONSTRAINT content_flags_resolution_notes_len_chk
    CHECK (resolution_notes IS NULL OR char_length(resolution_notes) <= 1000)
);

CREATE INDEX IF NOT EXISTS idx_content_flags_status_created
  ON public.content_flags (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_content_flags_target
  ON public.content_flags (target_type, target_id);

CREATE INDEX IF NOT EXISTS idx_content_flags_reporter
  ON public.content_flags (reporter_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Section 3.2 — v_staff_personal_metrics (performed_at = audit_logs.created_at)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.v_staff_personal_metrics AS
SELECT
  staff.id AS staff_user_id,
  COALESCE(audit_stats.total_actions, 0)::bigint AS total_actions,
  COALESCE(audit_stats.actions_today, 0)::bigint AS actions_today,
  COALESCE(claim_stats.claims_reviewed, 0)::bigint AS claims_reviewed,
  COALESCE(claim_stats.claims_reviewed_today, 0)::bigint AS claims_reviewed_today,
  COALESCE(claim_stats.claims_assigned_open, 0)::bigint AS claims_assigned_open,
  COALESCE(flag_stats.flags_resolved, 0)::bigint AS flags_resolved,
  COALESCE(flag_stats.flags_resolved_today, 0)::bigint AS flags_resolved_today
FROM public.profiles staff
LEFT JOIN LATERAL (
  SELECT
    count(*)::bigint AS total_actions,
    count(*) FILTER (
      WHERE al.created_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Riyadh')
    )::bigint AS actions_today
  FROM public.audit_logs al
  WHERE al.actor_id = staff.id
) audit_stats ON true
LEFT JOIN LATERAL (
  SELECT
    count(*) FILTER (WHERE cr.reviewed_by = staff.id)::bigint AS claims_reviewed,
    count(*) FILTER (
      WHERE cr.reviewed_by = staff.id
        AND cr.reviewed_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Riyadh')
    )::bigint AS claims_reviewed_today,
    count(*) FILTER (
      WHERE cr.assigned_staff_id = staff.id
        AND cr.status IN ('pending', 'submitted', 'pending_review', 'under_review')
    )::bigint AS claims_assigned_open
  FROM public.claim_requests cr
) claim_stats ON true
LEFT JOIN LATERAL (
  SELECT
    count(*) FILTER (
      WHERE cf.reviewed_by = staff.id
        AND cf.status IN ('resolved', 'dismissed')
    )::bigint AS flags_resolved,
    count(*) FILTER (
      WHERE cf.reviewed_by = staff.id
        AND cf.reviewed_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Riyadh')
    )::bigint AS flags_resolved_today
  FROM public.content_flags cf
) flag_stats ON true
WHERE staff.role IN ('staff', 'admin', 'super_admin');

GRANT SELECT ON public.v_staff_personal_metrics TO authenticated;

-- ---------------------------------------------------------------------------
-- Section 3.5 — staff_suspend_user() (defense-in-depth; raises on privilege violation)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.staff_suspend_user(
  p_user_id uuid,
  p_reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id uuid := auth.uid();
  v_actor_role public.user_role_enum;
  v_target_role public.user_role_enum;
  v_old_suspended_at timestamptz;
  v_reason text;
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_reason := NULLIF(trim(p_reason), '');
  IF v_reason IS NULL THEN
    RAISE EXCEPTION 'Suspension reason is required';
  END IF;

  SELECT role INTO v_actor_role FROM public.profiles WHERE id = v_actor_id;

  IF v_actor_role NOT IN ('staff', 'admin', 'super_admin') THEN
    RAISE EXCEPTION 'Insufficient privileges to suspend users';
  END IF;

  SELECT role, suspended_at
  INTO v_target_role, v_old_suspended_at
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_target_role IS NULL THEN
    RAISE EXCEPTION 'Target user not found';
  END IF;

  IF v_actor_role = 'staff' AND v_target_role IN ('staff', 'admin', 'super_admin') THEN
    RAISE EXCEPTION 'Staff cannot suspend privileged accounts';
  END IF;

  IF v_actor_role = 'admin' AND v_target_role = 'super_admin' THEN
    RAISE EXCEPTION 'Admin cannot suspend super_admin accounts';
  END IF;

  IF p_user_id = v_actor_id THEN
    RAISE EXCEPTION 'Cannot suspend your own account';
  END IF;

  UPDATE public.profiles
  SET
    suspended_at = now(),
    suspended_reason = v_reason,
    profile_state = 'suspended',
    updated_at = now()
  WHERE id = p_user_id;

  PERFORM public._write_audit_log(
    v_actor_id,
    'user.suspended',
    'profile',
    p_user_id,
    jsonb_build_object('suspended_at', v_old_suspended_at),
    jsonb_build_object('suspended_at', now(), 'suspended_reason', v_reason),
    jsonb_build_object('reason', v_reason, 'via', 'staff_suspend_user')
  );
END;
$$;

REVOKE ALL ON FUNCTION public.staff_suspend_user(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.staff_suspend_user(uuid, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- Section 3.5 — review_claim() corrected (company/university only; no mentor branch)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.review_claim(
  p_claim_id uuid,
  p_decision text,
  p_reason text,
  p_required_documents text[] DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id uuid := auth.uid();
  v_actor_role public.user_role_enum;
  v_claim public.claim_requests%ROWTYPE;
  v_new_role public.user_role_enum;
  v_old_role public.user_role_enum;
  v_reason text;
  v_required_docs text[] := COALESCE(
    p_required_documents,
    ARRAY['commercial_registry', 'domain_ownership_proof', 'authorization_letter']::text[]
  );
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_reason := NULLIF(trim(p_reason), '');
  IF v_reason IS NULL THEN
    RAISE EXCEPTION 'Review reason is required';
  END IF;

  SELECT role INTO v_actor_role FROM public.profiles WHERE id = v_actor_id;

  IF v_actor_role NOT IN ('staff', 'admin', 'super_admin') THEN
    RAISE EXCEPTION 'Insufficient privileges to review claims';
  END IF;

  IF p_decision NOT IN ('approve', 'reject', 'needs_more_info') THEN
    RAISE EXCEPTION 'Invalid decision';
  END IF;

  SELECT * INTO v_claim FROM public.claim_requests WHERE id = p_claim_id FOR UPDATE;

  IF v_claim.id IS NULL THEN
    RAISE EXCEPTION 'Claim not found';
  END IF;

  IF v_claim.user_id = v_actor_id THEN
    RAISE EXCEPTION 'Cannot review your own claim';
  END IF;

  IF v_claim.status NOT IN ('pending', 'submitted', 'pending_review', 'under_review', 'needs_more_info') THEN
    RAISE EXCEPTION 'Claim is not pending review';
  END IF;

  IF v_claim.claim_type NOT IN ('company', 'university') THEN
    RAISE EXCEPTION 'Unsupported claim type — mentor applications use mentor_profiles';
  END IF;

  IF p_decision = 'approve' THEN
    v_new_role := CASE v_claim.claim_type
      WHEN 'university' THEN 'university_admin'::public.user_role_enum
      WHEN 'company' THEN 'company_admin'::public.user_role_enum
    END;

    SELECT role INTO v_old_role FROM public.profiles WHERE id = v_claim.user_id;

    UPDATE public.claim_requests
    SET
      status = 'approved',
      review_notes = v_reason,
      reviewed_by = v_actor_id,
      reviewed_at = now(),
      rejection_reason = NULL,
      can_reapply_after = NULL,
      required_documents = '{}',
      updated_at = now()
    WHERE id = p_claim_id;

    UPDATE public.companies
    SET
      entity_state = 'approved',
      claimed_by = v_claim.user_id,
      claim_requested_at = NULL,
      is_verified = true,
      updated_at = now()
    WHERE id = v_claim.company_id;

    PERFORM set_config('jid.allow_role_change', 'on', true);
    UPDATE public.profiles
    SET role = v_new_role, updated_at = now()
    WHERE id = v_claim.user_id;

    PERFORM public._write_audit_log(
      v_actor_id,
      'claim.approved',
      'claim_request',
      p_claim_id,
      jsonb_build_object('status', v_claim.status, 'role', v_old_role, 'claim_type', v_claim.claim_type),
      jsonb_build_object(
        'status', 'approved',
        'role', v_new_role,
        'reason', v_reason,
        'company_id', v_claim.company_id,
        'entity_state', 'approved',
        'claim_type', v_claim.claim_type
      )
    );
  ELSIF p_decision = 'needs_more_info' THEN
    UPDATE public.claim_requests
    SET
      status = 'needs_more_info',
      review_notes = v_reason,
      required_documents = v_required_docs,
      reviewed_by = v_actor_id,
      reviewed_at = now(),
      updated_at = now()
    WHERE id = p_claim_id;

    PERFORM public._write_audit_log(
      v_actor_id,
      'claim.needs_more_info',
      'claim_request',
      p_claim_id,
      jsonb_build_object('status', v_claim.status, 'claim_type', v_claim.claim_type),
      jsonb_build_object(
        'status', 'needs_more_info',
        'reason', v_reason,
        'required_documents', v_required_docs,
        'claim_type', v_claim.claim_type
      )
    );
  ELSE
    UPDATE public.claim_requests
    SET
      status = 'rejected',
      review_notes = v_reason,
      rejection_reason = v_reason,
      required_documents = v_required_docs,
      can_reapply_after = now() + interval '7 days',
      reviewed_by = v_actor_id,
      reviewed_at = now(),
      updated_at = now()
    WHERE id = p_claim_id;

    UPDATE public.companies
    SET
      entity_state = 'unclaimed',
      claimed_by = NULL,
      claim_requested_at = NULL,
      updated_at = now()
    WHERE id = v_claim.company_id
      AND entity_state IN ('pending', 'pending_review');

    PERFORM public._write_audit_log(
      v_actor_id,
      'claim.rejected',
      'claim_request',
      p_claim_id,
      jsonb_build_object('status', v_claim.status, 'claim_type', v_claim.claim_type),
      jsonb_build_object(
        'status', 'rejected',
        'reason', v_reason,
        'required_documents', v_required_docs,
        'can_reapply_after', now() + interval '7 days',
        'claim_type', v_claim.claim_type
      )
    );
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.review_claim(uuid, text, text, text[])
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_claim(uuid, text, text, text[]) TO authenticated;

-- Backward-compatible wrapper used by existing staff UI (review-claim.ts).
CREATE OR REPLACE FUNCTION public.review_claim_request(
  p_claim_id uuid,
  p_decision text,
  p_review_notes text,
  p_rejection_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reason text;
  v_required_docs text[] := ARRAY[
    'commercial_registry',
    'domain_ownership_proof',
    'authorization_letter'
  ];
BEGIN
  v_reason := NULLIF(trim(p_review_notes), '');
  IF v_reason IS NULL AND p_decision = 'reject' THEN
    v_reason := NULLIF(trim(COALESCE(p_rejection_reason, '')), '');
  END IF;

  PERFORM public.review_claim(
    p_claim_id,
    p_decision,
    COALESCE(v_reason, trim(p_review_notes)),
    CASE WHEN p_decision = 'reject' THEN v_required_docs ELSE NULL END
  );
END;
$$;

REVOKE ALL ON FUNCTION public.review_claim_request(uuid, text, text, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_claim_request(uuid, text, text, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- Section 3.4 — RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.content_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS content_flags_select_own_or_staff ON public.content_flags;
CREATE POLICY content_flags_select_own_or_staff
  ON public.content_flags
  FOR SELECT
  TO authenticated
  USING (
    reporter_id = auth.uid()
    OR public.is_privileged_staff()
  );

DROP POLICY IF EXISTS content_flags_insert_reporter ON public.content_flags;
CREATE POLICY content_flags_insert_reporter
  ON public.content_flags
  FOR INSERT
  TO authenticated
  WITH CHECK (
    reporter_id = auth.uid()
    AND status = 'pending'
  );

DROP POLICY IF EXISTS content_flags_update_staff ON public.content_flags;
CREATE POLICY content_flags_update_staff
  ON public.content_flags
  FOR UPDATE
  TO authenticated
  USING (public.is_privileged_staff())
  WITH CHECK (public.is_privileged_staff());

DROP POLICY IF EXISTS claim_requests_select_assigned ON public.claim_requests;
CREATE POLICY claim_requests_select_assigned
  ON public.claim_requests
  FOR SELECT
  TO authenticated
  USING (
    assigned_staff_id = auth.uid()
    OR public.is_privileged_staff()
    OR auth.uid() = user_id
  );

-- Staff personal metrics: enforce self-only reads via SECURITY DEFINER RPC (views have no RLS).

CREATE OR REPLACE FUNCTION public.get_staff_personal_metrics()
RETURNS SETOF public.v_staff_personal_metrics
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.*
  FROM public.v_staff_personal_metrics m
  WHERE m.staff_user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('staff', 'admin', 'super_admin')
    );
$$;

REVOKE ALL ON FUNCTION public.get_staff_personal_metrics() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_staff_personal_metrics() TO authenticated;
