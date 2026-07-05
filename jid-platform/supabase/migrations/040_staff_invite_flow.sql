-- Staff invitation extensions (Section 4.7 / Step 11)

ALTER TABLE public.staff_invitations
  ADD COLUMN IF NOT EXISTS reason text;

UPDATE public.staff_invitations
SET reason = 'legacy invitation'
WHERE reason IS NULL;

ALTER TABLE public.staff_invitations
  ALTER COLUMN reason SET NOT NULL;

CREATE OR REPLACE FUNCTION public.hash_staff_invite_token(p_token text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT encode(extensions.digest(p_token, 'sha256'), 'hex');
$$;

REVOKE ALL ON FUNCTION public.hash_staff_invite_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.hash_staff_invite_token(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.validate_staff_invite_token(p_token text)
RETURNS TABLE (
  invitation_id uuid,
  email text,
  invite_role public.user_role_enum
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NULLIF(trim(p_token), '') IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    si.id,
    si.email,
    si.role
  FROM public.staff_invitations si
  WHERE si.invite_token = public.hash_staff_invite_token(p_token)
    AND si.accepted_at IS NULL
    AND si.expires_at > now();
END;
$$;

REVOKE ALL ON FUNCTION public.validate_staff_invite_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_staff_invite_token(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.complete_staff_invite_acceptance(p_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_user_email text;
  v_invitation public.staff_invitations%ROWTYPE;
  v_old_role public.user_role_enum;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NULLIF(trim(p_token), '') IS NULL THEN
    RAISE EXCEPTION 'Invalid invitation token';
  END IF;

  SELECT *
  INTO v_invitation
  FROM public.staff_invitations
  WHERE invite_token = public.hash_staff_invite_token(p_token)
    AND accepted_at IS NULL
    AND expires_at > now()
  FOR UPDATE;

  IF v_invitation.id IS NULL THEN
    RAISE EXCEPTION 'Invitation is invalid or expired';
  END IF;

  SELECT au.email
  INTO v_user_email
  FROM auth.users au
  WHERE au.id = v_user_id;

  IF v_user_email IS NULL OR lower(v_user_email) <> lower(v_invitation.email) THEN
    RAISE EXCEPTION 'Signed-in email does not match invitation';
  END IF;

  SELECT role
  INTO v_old_role
  FROM public.profiles
  WHERE id = v_user_id;

  IF v_old_role IS NULL THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  PERFORM set_config('jid.staff_invite_acceptance', 'on', true);
  PERFORM public.set_user_role(v_user_id, v_invitation.role);

  UPDATE public.profiles
  SET
    mfa_enforced = true,
    updated_at = now()
  WHERE id = v_user_id;

  UPDATE public.staff_invitations
  SET
    accepted_at = now(),
    accepted_by = v_user_id
  WHERE id = v_invitation.id;

  PERFORM public._write_audit_log(
    v_user_id,
    'staff.invite_accepted',
    'staff_invitation',
    v_invitation.id,
    jsonb_build_object('role', v_old_role),
    jsonb_build_object('role', v_invitation.role, 'email', v_invitation.email)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.complete_staff_invite_acceptance(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_staff_invite_acceptance(text) TO authenticated;

-- Invite acceptance bypass: self-promotion to staff via validated token only.
CREATE OR REPLACE FUNCTION public.set_user_role(
  p_target_user_id uuid,
  p_new_role public.user_role_enum
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id uuid := auth.uid();
  v_actor_role public.user_role_enum;
  v_old_role public.user_role_enum;
  v_invite_acceptance boolean := current_setting('jid.staff_invite_acceptance', true) = 'on';
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT role
  INTO v_actor_role
  FROM public.profiles
  WHERE id = v_actor_id;

  IF v_actor_role IS NULL THEN
    RAISE EXCEPTION 'Actor profile not found';
  END IF;

  IF NOT (
    v_invite_acceptance
    AND v_actor_id = p_target_user_id
    AND p_new_role = 'staff'
  ) THEN
  -- CRITICAL: staff cannot assign super_admin
  IF v_actor_role = 'staff' AND p_new_role = 'super_admin' THEN
    RAISE EXCEPTION 'Staff members cannot assign the super_admin role';
  END IF;

  IF p_new_role = 'super_admin' AND v_actor_role <> 'super_admin' THEN
    RAISE EXCEPTION 'Only super_admin can assign the super_admin role';
  END IF;

  IF p_new_role = 'admin' AND v_actor_role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Only admin or super_admin can assign the admin role';
  END IF;

  IF p_new_role = 'staff' AND v_actor_role NOT IN ('staff', 'admin', 'super_admin') THEN
    RAISE EXCEPTION 'Insufficient privileges to assign staff role';
  END IF;
  END IF;

  SELECT role
  INTO v_old_role
  FROM public.profiles
  WHERE id = p_target_user_id;

  IF v_old_role IS NULL THEN
    RAISE EXCEPTION 'Target user not found';
  END IF;

  PERFORM set_config('jid.allow_role_change', 'on', true);

  UPDATE public.profiles
  SET
    role = p_new_role,
    updated_at = now()
  WHERE id = p_target_user_id;

  PERFORM public._write_audit_log(
    v_actor_id,
    'user.role_changed',
    'profile',
    p_target_user_id,
    jsonb_build_object('role', v_old_role),
    jsonb_build_object('role', p_new_role)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.set_user_role(uuid, public.user_role_enum)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_user_role(uuid, public.user_role_enum) TO authenticated;
