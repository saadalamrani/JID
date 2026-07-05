-- Company catalog reconciliation (Section 5.1 — reconciled with Auth/RBAC + Profile System)
-- Rules: entity_state is approval SSOT on companies; no claim_status/is_claimed on companies.

-- ---------------------------------------------------------------------------
-- Step 4 — New enums (if not exist)
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  CREATE TYPE public.ownership_enum AS ENUM ('government', 'semi_government', 'private');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE TYPE public.link_status_enum AS ENUM ('healthy', 'broken', 'pending');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

-- ---------------------------------------------------------------------------
-- Step 3 — New catalog tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.sectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name_en text NOT NULL,
  name_ar text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name_en text NOT NULL,
  name_ar text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.link_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  url text NOT NULL,
  link_type text,
  status public.link_status_enum NOT NULL DEFAULT 'pending',
  http_status integer,
  error_message text,
  checked_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_link_audit_log_company_id
  ON public.link_audit_log (company_id, checked_at DESC);

CREATE INDEX IF NOT EXISTS idx_sectors_slug ON public.sectors (slug);
CREATE INDEX IF NOT EXISTS idx_regions_slug ON public.regions (slug);

-- ---------------------------------------------------------------------------
-- Step 2 — Extend existing companies (skip columns that already exist)
-- ---------------------------------------------------------------------------

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS claimed_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ownership_type public.ownership_enum,
  ADD COLUMN IF NOT EXISTS sector_id uuid REFERENCES public.sectors (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS region_id uuid REFERENCES public.regions (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS description_ar text,
  ADD COLUMN IF NOT EXISTS description_en text,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS cover_url text,
  ADD COLUMN IF NOT EXISTS career_portal_url text,
  ADD COLUMN IF NOT EXISTS website_url text,
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS twitter_url text,
  ADD COLUMN IF NOT EXISTS link_status public.link_status_enum NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS last_audit_at timestamptz,
  ADD COLUMN IF NOT EXISTS broken_since timestamptz,
  ADD COLUMN IF NOT EXISTS manual_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- entity_state: rename lifecycle value claimed → approved (Auth/RBAC reconciliation)
UPDATE public.companies
SET entity_state = 'approved'
WHERE entity_state = 'claimed';

ALTER TABLE public.companies
  DROP CONSTRAINT IF EXISTS companies_entity_state_chk;

ALTER TABLE public.companies
  ADD CONSTRAINT companies_entity_state_chk
  CHECK (entity_state IN ('unclaimed', 'pending', 'approved', 'suspended'));

-- ---------------------------------------------------------------------------
-- Step 5 — Indexes (Section 5.1 catalog)
-- ---------------------------------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_slug ON public.companies (slug)
  WHERE slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_companies_sector_id ON public.companies (sector_id);
CREATE INDEX IF NOT EXISTS idx_companies_region_id ON public.companies (region_id);
CREATE INDEX IF NOT EXISTS idx_companies_city ON public.companies (city);
CREATE INDEX IF NOT EXISTS idx_companies_ownership_type ON public.companies (ownership_type);
CREATE INDEX IF NOT EXISTS idx_companies_link_status ON public.companies (link_status);
CREATE INDEX IF NOT EXISTS idx_companies_is_active ON public.companies (is_active)
  WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_companies_manual_order ON public.companies (manual_order);
CREATE INDEX IF NOT EXISTS idx_companies_claimed_by ON public.companies (claimed_by);

-- ---------------------------------------------------------------------------
-- Step 6 — Full-text search (Arabic + English)
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_companies_fts_ar ON public.companies
  USING gin (
    to_tsvector(
      'arabic',
      coalesce(name_ar, '') || ' ' || coalesce(description_ar, '') || ' ' || coalesce(tagline_ar, '')
    )
  );

CREATE INDEX IF NOT EXISTS idx_companies_fts_en ON public.companies
  USING gin (
    to_tsvector(
      'english',
      coalesce(name, '') || ' ' || coalesce(description_en, '') || ' ' || coalesce(tagline_en, '')
    )
  );

-- ---------------------------------------------------------------------------
-- Step 8 — claim_requests reconciliation
-- ---------------------------------------------------------------------------

ALTER TABLE public.claim_requests
  ADD COLUMN IF NOT EXISTS domain_verified boolean NOT NULL DEFAULT false;

-- ---------------------------------------------------------------------------
-- Step 7 — RLS: companies update policy (entity_state + claimed_by)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS companies_update_staff ON public.companies;

CREATE POLICY companies_update_permissions
  ON public.companies
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'staff', 'admin')
    OR (claimed_by = auth.uid() AND entity_state = 'approved')
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin', 'staff', 'admin')
    OR (claimed_by = auth.uid() AND entity_state = 'approved')
  );

ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY sectors_select_public
  ON public.sectors FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY regions_select_public
  ON public.regions FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY link_audit_log_select_staff
  ON public.link_audit_log FOR SELECT TO authenticated
  USING (public.is_privileged_staff());

CREATE POLICY link_audit_log_insert_staff
  ON public.link_audit_log FOR INSERT TO authenticated
  WITH CHECK (public.is_privileged_staff());

-- ---------------------------------------------------------------------------
-- Reconcile review_claim_request — entity_state = 'approved', set claimed_by
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
    SET entity_state = 'unclaimed', claimed_by = NULL, updated_at = now()
    WHERE id = v_claim.company_id AND entity_state = 'pending';

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

-- Badge refresh: verified_entity when entity_state = 'approved' (not 'claimed')
CREATE OR REPLACE FUNCTION public.refresh_company_badges()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company record;
BEGIN
  FOR v_company IN
    SELECT id, commitment_score, avg_response_days, response_rate_pct, entity_state, is_on_honor_roll
    FROM public.companies
    WHERE entity_type = 'company'
  LOOP
    IF coalesce(v_company.commitment_score, 0) >= 80 THEN
      PERFORM public.award_entity_badge(
        'company',
        v_company.id,
        'jid_partner',
        jsonb_build_object('commitment_score', v_company.commitment_score)
      );
    ELSE
      PERFORM public.remove_entity_badge('company', v_company.id, 'jid_partner');
    END IF;

    IF coalesce(v_company.avg_response_days, 999) <= 3
       AND coalesce(v_company.response_rate_pct, 0) >= 90 THEN
      PERFORM public.award_entity_badge(
        'company',
        v_company.id,
        'quick_responder',
        jsonb_build_object(
          'avg_response_days', v_company.avg_response_days,
          'response_rate_pct', v_company.response_rate_pct
        )
      );
    ELSE
      PERFORM public.remove_entity_badge('company', v_company.id, 'quick_responder');
    END IF;

    IF v_company.entity_state = 'approved' THEN
      PERFORM public.award_entity_badge(
        'company',
        v_company.id,
        'verified_entity',
        jsonb_build_object('entity_state', v_company.entity_state)
      );
    ELSE
      PERFORM public.remove_entity_badge('company', v_company.id, 'verified_entity');
    END IF;

    IF v_company.is_on_honor_roll THEN
      PERFORM public.award_entity_badge('company', v_company.id, 'honor_roll', '{}'::jsonb);
    ELSE
      PERFORM public.remove_entity_badge('company', v_company.id, 'honor_roll');
    END IF;
  END LOOP;
END;
$$;
