-- Team membership administration is narrower than workflow write authority.
CREATE OR REPLACE FUNCTION public.can_manage_hiring_team(p_business_profile_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.business_profiles bp
    WHERE bp.id = p_business_profile_id AND bp.owner_user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.hiring_team_memberships m
    WHERE m.business_profile_id = p_business_profile_id
      AND m.user_id = auth.uid() AND m.active
      AND m.role IN ('owner', 'hiring_admin')
  ) OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('staff', 'super_admin')
  )
$$;

REVOKE ALL ON FUNCTION public.can_manage_hiring_team(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_manage_hiring_team(uuid) TO authenticated;

DROP POLICY hiring_memberships_manage ON public.hiring_team_memberships;
CREATE POLICY hiring_memberships_manage ON public.hiring_team_memberships FOR ALL TO authenticated
  USING (public.can_manage_hiring_team(business_profile_id))
  WITH CHECK (public.can_manage_hiring_team(business_profile_id));
