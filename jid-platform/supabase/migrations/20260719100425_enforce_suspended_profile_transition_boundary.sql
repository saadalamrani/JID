-- JID-107: keep owned-profile content editable while reserving moderation transitions
-- for the audited staff SECURITY DEFINER functions from migration 113.

CREATE OR REPLACE FUNCTION public.enforce_owned_profile_moderation_boundary()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor_id uuid := auth.uid();
  v_actor_role public.user_role_enum;
BEGIN
  -- Service-role and internal maintenance have no end-user auth.uid(). Staff moderation
  -- RPCs retain the caller's auth.uid() and are explicitly allowed below.
  IF v_actor_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT role INTO v_actor_role
  FROM public.profiles
  WHERE id = v_actor_id;

  IF v_actor_role IN ('staff', 'super_admin') THEN
    RETURN NEW;
  END IF;

  IF v_actor_id = OLD.owner_user_id THEN
    IF OLD.status = 'suspended' THEN
      RAISE EXCEPTION 'suspended_profile_requires_staff_reinstatement';
    END IF;

    IF NEW.status IS DISTINCT FROM OLD.status
      OR NEW.verified_badge IS DISTINCT FROM OLD.verified_badge
      OR NEW.published_at IS DISTINCT FROM OLD.published_at THEN
      RAISE EXCEPTION 'profile_moderation_fields_require_staff';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_owned_profile_moderation_boundary() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_business_profile_moderation_boundary ON public.business_profiles;
CREATE TRIGGER trg_business_profile_moderation_boundary
  BEFORE UPDATE ON public.business_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_owned_profile_moderation_boundary();

DROP TRIGGER IF EXISTS trg_university_profile_moderation_boundary ON public.university_profiles;
CREATE TRIGGER trg_university_profile_moderation_boundary
  BEFORE UPDATE ON public.university_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_owned_profile_moderation_boundary();

DROP POLICY IF EXISTS profile_owner_update_content ON public.business_profiles;
CREATE POLICY profile_owner_update_content
  ON public.business_profiles
  FOR UPDATE
  TO authenticated
  USING (owner_user_id = (SELECT auth.uid()) AND status <> 'suspended')
  WITH CHECK (owner_user_id = (SELECT auth.uid()) AND status <> 'suspended');

DROP POLICY IF EXISTS university_profile_owner_update_content ON public.university_profiles;
CREATE POLICY university_profile_owner_update_content
  ON public.university_profiles
  FOR UPDATE
  TO authenticated
  USING (owner_user_id = (SELECT auth.uid()) AND status <> 'suspended')
  WITH CHECK (owner_user_id = (SELECT auth.uid()) AND status <> 'suspended');

NOTIFY pgrst, 'reload schema';
