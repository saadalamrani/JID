-- Profile view analytics — company-level only (Section 13 privacy)
-- CRITICAL: viewer_company_id references companies; NEVER store an HR individual user id.

CREATE TABLE IF NOT EXISTS public.profile_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  viewer_company_id uuid NOT NULL,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profile_views IS
  'Company-level profile view events. viewer_company_id only — never an individual HR user id.';
COMMENT ON COLUMN public.profile_views.viewer_company_id IS
  'The viewing company entity id (companies.id). Must never be an auth.users id.';

CREATE INDEX IF NOT EXISTS idx_profile_views_profile_viewed_at
  ON public.profile_views (profile_id, viewed_at DESC);

CREATE OR REPLACE FUNCTION public.get_profile_view_stats(p_profile_id uuid)
RETURNS TABLE (
  total_views bigint,
  views_last_30_days bigint,
  unique_companies bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    count(*)::bigint AS total_views,
    count(*) FILTER (WHERE pv.viewed_at >= now() - interval '30 days')::bigint AS views_last_30_days,
    count(DISTINCT pv.viewer_company_id)::bigint AS unique_companies
  FROM public.profile_views pv
  WHERE pv.profile_id = p_profile_id
    AND auth.uid() = p_profile_id;
$$;

REVOKE ALL ON FUNCTION public.get_profile_view_stats(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_profile_view_stats(uuid) TO authenticated;
