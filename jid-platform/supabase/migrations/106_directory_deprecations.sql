-- P-101 Task 4 — Directory (companies) deprecations + entity_type standardization
-- Marks ownership columns deprecated; does NOT drop data (P-110 backfill, then drop).

COMMENT ON TABLE public.companies IS
  'Layer 1 — Directory record. Platform-owned reference data ONLY (names, taxonomy, domains, link-audit state). No ownership or narrative content belongs on this table — see business_profiles / university_profiles for owned identity. JID Profile Architecture v2 §3, §7.';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'claimed_by'
  ) THEN
    COMMENT ON COLUMN public.companies.claimed_by IS
      'DEPRECATED (P-101, Profile Architecture v2): ownership no longer lives on the Directory row. Superseded by business_profiles.owner_user_id / university_profiles.owner_user_id. Retained read-only for P-110 backfill; scheduled for drop after backfill verification.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'claim_requested_at'
  ) THEN
    COMMENT ON COLUMN public.companies.claim_requested_at IS
      'DEPRECATED (P-101): claim-request timestamp on Directory row. Approval truth moves to verification_requests.status; retained for P-110 backfill only.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'claim_status'
  ) THEN
    COMMENT ON COLUMN public.companies.claim_status IS
      'DEPRECATED (P-101): legacy claim flag on Directory row. Superseded by verification_requests + Layer-3 profiles. Retained for P-110 backfill only.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'is_claimed'
  ) THEN
    COMMENT ON COLUMN public.companies.is_claimed IS
      'DEPRECATED (P-101): legacy boolean claim flag. Superseded by verification_requests + Layer-3 profiles. Retained for P-110 backfill only.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'claim_approved_at'
  ) THEN
    COMMENT ON COLUMN public.companies.claim_approved_at IS
      'DEPRECATED (P-101): legacy approval timestamp on Directory row. Retained for P-110 backfill only.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'claim_approved_by'
  ) THEN
    COMMENT ON COLUMN public.companies.claim_approved_by IS
      'DEPRECATED (P-101): legacy approver reference on Directory row. Retained for P-110 backfill only.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'entity_state'
  ) THEN
    COMMENT ON COLUMN public.companies.entity_state IS
      'DEPRECATED for ownership/approval purposes (P-101): Directory rows carry data-quality/catalog state only going forward. Approval truth lives in verification_requests.status; operational access will move to Layer-3 profiles (P-102–104). Retained for P-110 backfill and transitional RLS.';
  END IF;
END;
$$;

-- Standardize entity_type value set to ('business','university') per Profile Architecture v2.
DO $$
DECLARE
  v_data_type text;
BEGIN
  -- Ensure enum labels use business (not company) before any column coercion.
  IF EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'entity_type_enum' AND e.enumlabel = 'company'
  ) THEN
    ALTER TYPE public.entity_type_enum RENAME VALUE 'company' TO 'business';
    RAISE NOTICE 'P-101: entity_type_enum value company renamed to business.';
  END IF;

  SELECT c.data_type
  INTO v_data_type
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = 'companies'
    AND c.column_name = 'entity_type';

  IF v_data_type IS NULL THEN
    RAISE NOTICE 'P-101: companies.entity_type missing — adding entity_type_enum column with default business.';
    ALTER TABLE public.companies
      ADD COLUMN IF NOT EXISTS entity_type public.entity_type_enum NOT NULL DEFAULT 'business';
    RETURN;
  END IF;

  IF v_data_type = 'USER-DEFINED' THEN
    RAISE NOTICE 'P-101: companies.entity_type already entity_type_enum — no column coercion needed.';
    RETURN;
  END IF;

  IF v_data_type IN ('text', 'character varying') THEN
    RAISE NOTICE 'P-101: companies.entity_type is text — normalizing values then converting to entity_type_enum.';

    ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS companies_entity_type_check;

    UPDATE public.companies
    SET entity_type = 'business'
    WHERE entity_type IS NULL
       OR entity_type::text IN ('company', 'business');

    UPDATE public.companies
    SET entity_type = 'university'
    WHERE entity_type::text = 'university';

    UPDATE public.companies
    SET entity_type = 'business'
    WHERE entity_type::text NOT IN ('business', 'university');

    ALTER TABLE public.companies
      ALTER COLUMN entity_type DROP DEFAULT;

    ALTER TABLE public.companies
      ALTER COLUMN entity_type TYPE public.entity_type_enum
      USING (
        CASE entity_type::text
          WHEN 'university' THEN 'university'::public.entity_type_enum
          ELSE 'business'::public.entity_type_enum
        END
      );

    ALTER TABLE public.companies
      ALTER COLUMN entity_type SET DEFAULT 'business'::public.entity_type_enum;
  END IF;
END;
$$;

NOTIFY pgrst, 'reload schema';
