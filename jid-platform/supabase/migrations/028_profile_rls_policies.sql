-- Profile + profile_views RLS (Section 8)

-- ---------------------------------------------------------------------------
-- Viewer helpers (company-level only — never expose HR user identity in views)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.viewer_approved_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cr.company_id
  FROM public.claim_requests cr
  WHERE cr.user_id = auth.uid()
    AND cr.status = 'approved'
    AND cr.claim_type = 'company'
  ORDER BY cr.reviewed_at DESC NULLS LAST, cr.created_at DESC
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.viewer_has_approved_company_claim()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.viewer_approved_company_id() IS NOT NULL;
$$;

CREATE OR REPLACE FUNCTION public.viewer_approved_university_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cr.company_id
  FROM public.claim_requests cr
  WHERE cr.user_id = auth.uid()
    AND cr.status = 'approved'
    AND cr.claim_type = 'university'
  ORDER BY cr.reviewed_at DESC NULLS LAST, cr.created_at DESC
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.viewer_approved_company_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.viewer_has_approved_company_claim() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.viewer_approved_university_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.viewer_approved_company_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.viewer_has_approved_company_claim() TO authenticated;
GRANT EXECUTE ON FUNCTION public.viewer_approved_university_id() TO authenticated;

-- ---------------------------------------------------------------------------
-- profile_views privacy enforcement trigger
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.enforce_profile_view_company_only()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
BEGIN
  v_company_id := public.viewer_approved_company_id();

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Profile views require an approved company claim';
  END IF;

  NEW.viewer_company_id := v_company_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profile_views_company_only ON public.profile_views;

CREATE TRIGGER trg_profile_views_company_only
  BEFORE INSERT ON public.profile_views
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_profile_view_company_only();

-- ---------------------------------------------------------------------------
-- RLS: profiles (Section 8 — unified profile policies)
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_public
  ON public.profiles
  FOR SELECT
  TO anon, authenticated
  USING (
    deleted_at IS NULL
    AND profile_state = 'active'
    AND visibility = 'public'
  );

CREATE POLICY profiles_select_verified_hr_discoverable
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND profile_state = 'active'
    AND visibility = 'discoverable'
    AND show_profile_to_companies = true
    AND public.viewer_has_approved_company_claim()
  );

CREATE POLICY profiles_select_university_stats
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND profile_state = 'active'
    AND show_profile_in_university_stats = true
    AND visibility IN ('discoverable', 'public')
    AND public.viewer_approved_university_id() IS NOT NULL
  );

CREATE POLICY profiles_update_own_active
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id
    AND deleted_at IS NULL
    AND profile_state <> 'deleted'
  )
  WITH CHECK (
    auth.uid() = id
    AND deleted_at IS NULL
    AND profile_state <> 'deleted'
  );

-- ---------------------------------------------------------------------------
-- RLS: profile_views (Section 8 / Section 13)
-- ---------------------------------------------------------------------------

ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY profile_views_insert_verified_hr
  ON public.profile_views
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.viewer_has_approved_company_claim()
    AND viewer_company_id = public.viewer_approved_company_id()
  );

CREATE POLICY profile_views_select_own_company
  ON public.profile_views
  FOR SELECT
  TO authenticated
  USING (viewer_company_id = public.viewer_approved_company_id());

CREATE POLICY profile_views_select_as_profile_owner
  ON public.profile_views
  FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());
