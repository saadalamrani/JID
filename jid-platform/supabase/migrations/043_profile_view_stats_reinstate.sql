-- Profile view stats enhancement + staff reinstate (Section 12 Steps 14–15)

DROP FUNCTION IF EXISTS public.get_profile_view_stats(uuid);

CREATE OR REPLACE FUNCTION public.get_profile_view_stats(p_profile_id uuid)
RETURNS TABLE (
  total_views bigint,
  views_last_30_days bigint,
  unique_companies bigint,
  distinct_companies_30d bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    count(*)::bigint AS total_views,
    count(*) FILTER (WHERE pv.viewed_at >= now() - interval '30 days')::bigint AS views_last_30_days,
    count(DISTINCT pv.viewer_company_id)::bigint AS unique_companies,
    count(DISTINCT pv.viewer_company_id) FILTER (
      WHERE pv.viewed_at >= now() - interval '30 days'
    )::bigint AS distinct_companies_30d
  FROM public.profile_views pv
  WHERE pv.profile_id = p_profile_id
    AND auth.uid() = p_profile_id;
$$;

REVOKE ALL ON FUNCTION public.get_profile_view_stats(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_profile_view_stats(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.reinstate_profile(p_target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id uuid := auth.uid();
  v_actor_role public.user_role_enum;
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT role INTO v_actor_role FROM public.profiles WHERE id = v_actor_id;

  IF v_actor_role NOT IN ('staff', 'admin', 'super_admin') THEN
    RAISE EXCEPTION 'Insufficient privileges to reinstate profiles';
  END IF;

  UPDATE public.profiles
  SET
    suspended_at = NULL,
    suspended_reason = NULL,
    locked_until = NULL,
    profile_state = CASE
      WHEN profile_completion_pct >= 100 THEN 'active'::public.profile_state_enum
      ELSE 'incomplete'::public.profile_state_enum
    END,
    updated_at = now()
  WHERE id = p_target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  PERFORM public._write_audit_log(
    v_actor_id,
    'profile.reinstated',
    'profile',
    p_target_user_id,
    NULL,
    jsonb_build_object('reinstated_at', now())
  );
END;
$$;

REVOKE ALL ON FUNCTION public.reinstate_profile(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reinstate_profile(uuid) TO authenticated;
