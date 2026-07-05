-- Catalog claim lifecycle + link auditor cron (Sections 5.4 / 5.5 — reconciled schema)

-- ---------------------------------------------------------------------------
-- companies: pending_review entity_state + claim_requested_at
-- ---------------------------------------------------------------------------

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS claim_requested_at timestamptz;

ALTER TABLE public.companies
  DROP CONSTRAINT IF EXISTS companies_entity_state_chk;

ALTER TABLE public.companies
  ADD CONSTRAINT companies_entity_state_chk
  CHECK (entity_state IN ('unclaimed', 'pending', 'pending_review', 'approved', 'suspended'));

-- ---------------------------------------------------------------------------
-- review_claim_request: reconcile pending_review on reject
-- ---------------------------------------------------------------------------

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
  v_actor_id uuid := auth.uid();
  v_actor_role public.user_role_enum;
  v_claim public.claim_requests%ROWTYPE;
  v_new_role public.user_role_enum;
  v_old_role public.user_role_enum;
  v_notes text;
  v_required_docs text[] := ARRAY[
    'commercial_registry',
    'domain_ownership_proof',
    'authorization_letter'
  ];
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT role INTO v_actor_role FROM public.profiles WHERE id = v_actor_id;

  IF v_actor_role NOT IN ('staff', 'admin', 'super_admin') THEN
    RAISE EXCEPTION 'Insufficient privileges to review claims';
  END IF;

  v_notes := NULLIF(trim(p_review_notes), '');
  IF v_notes IS NULL THEN
    RAISE EXCEPTION 'Review notes are required';
  END IF;

  IF p_decision NOT IN ('approve', 'reject') THEN
    RAISE EXCEPTION 'Invalid decision';
  END IF;

  SELECT * INTO v_claim FROM public.claim_requests WHERE id = p_claim_id FOR UPDATE;

  IF v_claim.id IS NULL THEN
    RAISE EXCEPTION 'Claim not found';
  END IF;

  IF v_claim.status NOT IN ('pending', 'pending_review', 'under_review') THEN
    RAISE EXCEPTION 'Claim is not pending review';
  END IF;

  IF p_decision = 'approve' THEN
    v_new_role := CASE
      WHEN v_claim.claim_type = 'university' THEN 'university_admin'::public.user_role_enum
      ELSE 'company_admin'::public.user_role_enum
    END;

    SELECT role INTO v_old_role FROM public.profiles WHERE id = v_claim.user_id;

    UPDATE public.claim_requests
    SET
      status = 'approved',
      review_notes = v_notes,
      reviewed_by = v_actor_id,
      reviewed_at = now(),
      rejection_reason = NULL,
      can_reapply_after = NULL,
      required_documents = '{}',
      updated_at = now()
    WHERE id = p_claim_id;

    UPDATE public.companies
    SET
      is_verified = true,
      entity_state = 'approved',
      claimed_by = v_claim.user_id,
      claim_requested_at = NULL,
      updated_at = now()
    WHERE id = v_claim.company_id;

    PERFORM set_config('jid.allow_role_change', 'on', true);
    UPDATE public.profiles SET role = v_new_role, updated_at = now() WHERE id = v_claim.user_id;

    PERFORM public._write_audit_log(
      v_actor_id, 'claim.approved', 'claim_request', p_claim_id,
      jsonb_build_object('status', v_claim.status, 'role', v_old_role),
      jsonb_build_object(
        'status', 'approved',
        'role', v_new_role,
        'review_notes', v_notes,
        'company_id', v_claim.company_id,
        'entity_state', 'approved'
      )
    );
  ELSE
    IF NULLIF(trim(COALESCE(p_rejection_reason, '')), '') IS NULL THEN
      RAISE EXCEPTION 'Rejection reason is required';
    END IF;

    UPDATE public.claim_requests
    SET
      status = 'rejected',
      review_notes = v_notes,
      rejection_reason = trim(p_rejection_reason),
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
      v_actor_id, 'claim.rejected', 'claim_request', p_claim_id,
      jsonb_build_object('status', v_claim.status),
      jsonb_build_object(
        'status', 'rejected',
        'review_notes', v_notes,
        'rejection_reason', trim(p_rejection_reason),
        'required_documents', v_required_docs,
        'can_reapply_after', now() + interval '7 days'
      )
    );
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- link_audit_log: allow service_role inserts (edge function auditor)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS link_audit_log_insert_service ON public.link_audit_log;

CREATE POLICY link_audit_log_insert_service
  ON public.link_audit_log
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- pg_cron: link-auditor edge function daily at 03:00 Asia/Riyadh (00:00 UTC)
-- Requires pg_net + app.settings.supabase_functions_url + service_role_key
-- ---------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

DO $$
DECLARE
  v_job_id bigint;
BEGIN
  SELECT jobid INTO v_job_id FROM cron.job WHERE jobname = 'catalog-link-auditor-daily' LIMIT 1;
  IF v_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(v_job_id);
  END IF;
END;
$$;

SELECT cron.schedule(
  'catalog-link-auditor-daily',
  '0 0 * * *',
  $$
  SELECT net.http_post(
    url := coalesce(
      nullif(current_setting('app.settings.supabase_functions_url', true), ''),
      'http://kong:8000'
    ) || '/functions/v1/link-auditor',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || coalesce(current_setting('app.settings.service_role_key', true), '')
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
