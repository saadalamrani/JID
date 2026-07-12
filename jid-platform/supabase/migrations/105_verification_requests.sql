-- P-101 Task 3 — Reshape claim_requests → verification_requests (Layer 2)
-- Mechanical rename + column renames; policy logic unchanged (P-103 rewrites logic).
-- P-102 refactors review_claim_request / review_claim to target this table.

DO $$
BEGIN
  IF to_regclass('public.claim_requests') IS NULL AND to_regclass('public.verification_requests') IS NOT NULL THEN
    RAISE NOTICE 'P-101: verification_requests already exists — skipping table rename.';
  ELSIF to_regclass('public.claim_requests') IS NOT NULL THEN
    ALTER TABLE public.claim_requests RENAME TO verification_requests;
  ELSE
    RAISE EXCEPTION 'P-101: expected public.claim_requests to exist before reshape';
  END IF;
END;
$$;

-- Column renames (repo uses user_id / company_id / claim_type — not Auth/RBAC doc names).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'verification_requests' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.verification_requests RENAME COLUMN user_id TO applicant_user_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'verification_requests' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE public.verification_requests RENAME COLUMN company_id TO directory_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'verification_requests' AND column_name = 'claim_type'
  ) THEN
    ALTER TABLE public.verification_requests RENAME COLUMN claim_type TO verification_type;
  END IF;
END;
$$;

-- verification_type enum: company → business (claim_type_enum retained; P-102 may rename type).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'claim_type_enum' AND e.enumlabel = 'company'
  ) THEN
    ALTER TYPE public.claim_type_enum RENAME VALUE 'company' TO 'business';
  END IF;
END;
$$;

ALTER TABLE public.verification_requests
  ADD COLUMN IF NOT EXISTS resulting_profile_id uuid,
  ADD COLUMN IF NOT EXISTS resulting_profile_type text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'verification_requests_resulting_profile_type_chk'
  ) THEN
    ALTER TABLE public.verification_requests
      ADD CONSTRAINT verification_requests_resulting_profile_type_chk
      CHECK (resulting_profile_type IN ('business', 'university') OR resulting_profile_type IS NULL);
  END IF;
END;
$$;

COMMENT ON TABLE public.verification_requests IS
  'Layer 2 — proves account legitimacy. Approval grants NO directory-row edit rights; it only licenses profile creation (Layer 3). See JID Profile Architecture v2 §5.2.';

COMMENT ON COLUMN public.verification_requests.directory_id IS
  'The Directory (companies) record this verification concerns — reference only, not an ownership grant.';

COMMENT ON COLUMN public.verification_requests.resulting_profile_id IS
  'Audit link populated when applicant creates Layer-3 profile after approval (P-102). Soft reference — not an FK across business/university profile tables.';

-- Realtime publication: table rename follows the relation; ensure new name is published.
DO $$
BEGIN
  IF to_regclass('public.verification_requests') IS NOT NULL THEN
    ALTER TABLE public.verification_requests REPLICA IDENTITY FULL;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'verification_requests'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.verification_requests;
    END IF;
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- Mechanical RLS carry-forward (same logic, renamed table/columns) — P-103 rewrites.
-- ---------------------------------------------------------------------------

ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS claim_requests_select_own ON public.verification_requests;
DROP POLICY IF EXISTS verification_requests_select_own ON public.verification_requests;
CREATE POLICY verification_requests_select_own
  ON public.verification_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = applicant_user_id);

DROP POLICY IF EXISTS claim_requests_select_staff ON public.verification_requests;
DROP POLICY IF EXISTS verification_requests_select_staff ON public.verification_requests;
CREATE POLICY verification_requests_select_staff
  ON public.verification_requests
  FOR SELECT
  TO authenticated
  USING (public.is_privileged_staff());

DROP POLICY IF EXISTS claim_requests_insert_own ON public.verification_requests;
DROP POLICY IF EXISTS verification_requests_insert_own ON public.verification_requests;
CREATE POLICY verification_requests_insert_own
  ON public.verification_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = applicant_user_id
    AND status IN ('pending', 'pending_review', 'under_review')
  );

DROP POLICY IF EXISTS claim_requests_update_staff ON public.verification_requests;
DROP POLICY IF EXISTS verification_requests_update_staff ON public.verification_requests;
CREATE POLICY verification_requests_update_staff
  ON public.verification_requests
  FOR UPDATE
  TO authenticated
  USING (public.is_privileged_staff())
  WITH CHECK (public.is_privileged_staff());

DROP POLICY IF EXISTS claim_requests_select_assigned ON public.verification_requests;
DROP POLICY IF EXISTS verification_requests_select_assigned ON public.verification_requests;
CREATE POLICY verification_requests_select_assigned
  ON public.verification_requests
  FOR SELECT
  TO authenticated
  USING (
    assigned_staff_id = auth.uid()
    OR public.is_privileged_staff()
    OR auth.uid() = applicant_user_id
  );

NOTIFY pgrst, 'reload schema';
