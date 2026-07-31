-- Spec 07-B — Owner publish/unpublish RPCs for business + university Profiles.
-- Preserves staff suspend/reinstate (113) and owner content UPDATE policies.
-- Narrow GUC escape lets only these RPCs transition draft↔published + published_at
-- for the authenticated owner; raw owner UPDATE of status remains denied.

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

  -- Owner publication RPCs only: allow draft↔published and published_at changes.
  -- Never allow verified_badge or suspended transitions through this escape.
  IF current_setting('jid.profile_publication_rpc', true) = 'on'
     AND v_actor_id = OLD.owner_user_id THEN
    IF NEW.verified_badge IS DISTINCT FROM OLD.verified_badge THEN
      RAISE EXCEPTION 'profile_moderation_fields_require_staff';
    END IF;

    IF NEW.status IS DISTINCT FROM OLD.status THEN
      IF NOT (
        (OLD.status = 'draft' AND NEW.status = 'published')
        OR (OLD.status = 'published' AND NEW.status = 'draft')
      ) THEN
        RAISE EXCEPTION 'profile_moderation_fields_require_staff';
      END IF;
    END IF;

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

CREATE OR REPLACE FUNCTION public.publish_business_profile(p_profile_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor_id uuid := auth.uid();
  v_row public.business_profiles%ROWTYPE;
  v_missing text[] := ARRAY[]::text[];
  v_published_at timestamptz;
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_row
  FROM public.business_profiles
  WHERE id = p_profile_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile_not_found';
  END IF;

  IF v_row.owner_user_id IS DISTINCT FROM v_actor_id THEN
    RAISE EXCEPTION 'not_profile_owner';
  END IF;

  IF v_row.status = 'suspended' THEN
    RAISE EXCEPTION 'profile_suspended';
  END IF;

  IF v_row.status = 'published' THEN
    RAISE EXCEPTION 'profile_already_published';
  END IF;

  IF v_row.status IS DISTINCT FROM 'draft' THEN
    RAISE EXCEPTION 'profile_not_draft';
  END IF;

  IF NULLIF(trim(v_row.display_name_ar), '') IS NULL THEN
    v_missing := array_append(v_missing, 'display_name_ar');
  END IF;
  IF NULLIF(trim(COALESCE(v_row.about_ar, '')), '') IS NULL THEN
    v_missing := array_append(v_missing, 'about_ar');
  END IF;
  IF array_length(v_missing, 1) IS NOT NULL THEN
    RAISE EXCEPTION 'missing_required_fields:%', array_to_string(v_missing, ',');
  END IF;

  v_published_at := now();
  PERFORM set_config('jid.profile_publication_rpc', 'on', true);

  UPDATE public.business_profiles
  SET
    status = 'published',
    published_at = v_published_at,
    updated_at = now()
  WHERE id = p_profile_id
    AND owner_user_id = v_actor_id
    AND status = 'draft';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile_not_draft';
  END IF;

  PERFORM public._write_audit_log(
    v_actor_id,
    'profile.published',
    'business_profile',
    p_profile_id,
    jsonb_build_object('status', 'draft', 'published_at', NULL),
    jsonb_build_object('status', 'published', 'published_at', v_published_at),
    jsonb_build_object('profile_type', 'business')
  );

  RETURN jsonb_build_object(
    'id', p_profile_id,
    'status', 'published',
    'published_at', v_published_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.unpublish_business_profile(p_profile_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor_id uuid := auth.uid();
  v_row public.business_profiles%ROWTYPE;
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_row
  FROM public.business_profiles
  WHERE id = p_profile_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile_not_found';
  END IF;

  IF v_row.owner_user_id IS DISTINCT FROM v_actor_id THEN
    RAISE EXCEPTION 'not_profile_owner';
  END IF;

  IF v_row.status = 'suspended' THEN
    RAISE EXCEPTION 'profile_suspended';
  END IF;

  IF v_row.status IS DISTINCT FROM 'published' THEN
    RAISE EXCEPTION 'profile_not_published';
  END IF;

  PERFORM set_config('jid.profile_publication_rpc', 'on', true);

  UPDATE public.business_profiles
  SET
    status = 'draft',
    published_at = NULL,
    updated_at = now()
  WHERE id = p_profile_id
    AND owner_user_id = v_actor_id
    AND status = 'published';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile_not_published';
  END IF;

  PERFORM public._write_audit_log(
    v_actor_id,
    'profile.unpublished',
    'business_profile',
    p_profile_id,
    jsonb_build_object('status', 'published', 'published_at', v_row.published_at),
    jsonb_build_object('status', 'draft', 'published_at', NULL),
    jsonb_build_object('profile_type', 'business')
  );

  RETURN jsonb_build_object(
    'id', p_profile_id,
    'status', 'draft',
    'published_at', NULL
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.publish_university_profile(p_profile_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor_id uuid := auth.uid();
  v_row public.university_profiles%ROWTYPE;
  v_missing text[] := ARRAY[]::text[];
  v_published_at timestamptz;
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_row
  FROM public.university_profiles
  WHERE id = p_profile_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile_not_found';
  END IF;

  IF v_row.owner_user_id IS DISTINCT FROM v_actor_id THEN
    RAISE EXCEPTION 'not_profile_owner';
  END IF;

  IF v_row.status = 'suspended' THEN
    RAISE EXCEPTION 'profile_suspended';
  END IF;

  IF v_row.status = 'published' THEN
    RAISE EXCEPTION 'profile_already_published';
  END IF;

  IF v_row.status IS DISTINCT FROM 'draft' THEN
    RAISE EXCEPTION 'profile_not_draft';
  END IF;

  IF NULLIF(trim(v_row.display_name_ar), '') IS NULL THEN
    v_missing := array_append(v_missing, 'display_name_ar');
  END IF;
  IF NULLIF(trim(COALESCE(v_row.about_ar, '')), '') IS NULL THEN
    v_missing := array_append(v_missing, 'about_ar');
  END IF;
  IF array_length(v_missing, 1) IS NOT NULL THEN
    RAISE EXCEPTION 'missing_required_fields:%', array_to_string(v_missing, ',');
  END IF;

  v_published_at := now();
  PERFORM set_config('jid.profile_publication_rpc', 'on', true);

  UPDATE public.university_profiles
  SET
    status = 'published',
    published_at = v_published_at,
    updated_at = now()
  WHERE id = p_profile_id
    AND owner_user_id = v_actor_id
    AND status = 'draft';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile_not_draft';
  END IF;

  PERFORM public._write_audit_log(
    v_actor_id,
    'profile.published',
    'university_profile',
    p_profile_id,
    jsonb_build_object('status', 'draft', 'published_at', NULL),
    jsonb_build_object('status', 'published', 'published_at', v_published_at),
    jsonb_build_object('profile_type', 'university')
  );

  RETURN jsonb_build_object(
    'id', p_profile_id,
    'status', 'published',
    'published_at', v_published_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.unpublish_university_profile(p_profile_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor_id uuid := auth.uid();
  v_row public.university_profiles%ROWTYPE;
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_row
  FROM public.university_profiles
  WHERE id = p_profile_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile_not_found';
  END IF;

  IF v_row.owner_user_id IS DISTINCT FROM v_actor_id THEN
    RAISE EXCEPTION 'not_profile_owner';
  END IF;

  IF v_row.status = 'suspended' THEN
    RAISE EXCEPTION 'profile_suspended';
  END IF;

  IF v_row.status IS DISTINCT FROM 'published' THEN
    RAISE EXCEPTION 'profile_not_published';
  END IF;

  PERFORM set_config('jid.profile_publication_rpc', 'on', true);

  UPDATE public.university_profiles
  SET
    status = 'draft',
    published_at = NULL,
    updated_at = now()
  WHERE id = p_profile_id
    AND owner_user_id = v_actor_id
    AND status = 'published';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile_not_published';
  END IF;

  PERFORM public._write_audit_log(
    v_actor_id,
    'profile.unpublished',
    'university_profile',
    p_profile_id,
    jsonb_build_object('status', 'published', 'published_at', v_row.published_at),
    jsonb_build_object('status', 'draft', 'published_at', NULL),
    jsonb_build_object('profile_type', 'university')
  );

  RETURN jsonb_build_object(
    'id', p_profile_id,
    'status', 'draft',
    'published_at', NULL
  );
END;
$$;

REVOKE ALL ON FUNCTION public.publish_business_profile(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.publish_business_profile(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.unpublish_business_profile(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.unpublish_business_profile(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.publish_university_profile(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.publish_university_profile(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.unpublish_university_profile(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.unpublish_university_profile(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
