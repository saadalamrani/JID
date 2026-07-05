-- Row Level Security policies for auth/RBAC tables
-- Section 3.7

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role_enum
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.profiles
  WHERE id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.current_user_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;

CREATE OR REPLACE FUNCTION public.is_privileged_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(
    (
      SELECT role IN ('staff', 'admin', 'super_admin')
      FROM public.profiles
      WHERE id = auth.uid()
    ),
    false
  );
$$;

REVOKE ALL ON FUNCTION public.is_privileged_staff() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_privileged_staff() TO authenticated;

CREATE OR REPLACE FUNCTION public.is_admin_or_above()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(
    (
      SELECT role IN ('admin', 'super_admin')
      FROM public.profiles
      WHERE id = auth.uid()
    ),
    false
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin_or_above() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin_or_above() TO authenticated;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_own
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY profiles_select_staff
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_privileged_staff());

CREATE POLICY profiles_insert_own
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY profiles_update_own
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY profiles_update_admin
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_above())
  WITH CHECK (public.is_admin_or_above());

-- ---------------------------------------------------------------------------
-- claim_requests
-- ---------------------------------------------------------------------------

ALTER TABLE public.claim_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY claim_requests_select_own
  ON public.claim_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY claim_requests_select_staff
  ON public.claim_requests
  FOR SELECT
  TO authenticated
  USING (public.is_privileged_staff());

CREATE POLICY claim_requests_insert_own
  ON public.claim_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'
  );

CREATE POLICY claim_requests_update_staff
  ON public.claim_requests
  FOR UPDATE
  TO authenticated
  USING (public.is_privileged_staff())
  WITH CHECK (public.is_privileged_staff());

-- ---------------------------------------------------------------------------
-- audit_logs (SELECT only — no direct INSERT/UPDATE/DELETE policies)
-- ---------------------------------------------------------------------------

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_logs_select_staff
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (public.is_privileged_staff());

-- ---------------------------------------------------------------------------
-- phone_verification_attempts
-- ---------------------------------------------------------------------------

ALTER TABLE public.phone_verification_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY phone_verification_select_own
  ON public.phone_verification_attempts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY phone_verification_insert_own
  ON public.phone_verification_attempts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- staff_invitations
-- ---------------------------------------------------------------------------

ALTER TABLE public.staff_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY staff_invitations_select_admin
  ON public.staff_invitations
  FOR SELECT
  TO authenticated
  USING (public.is_admin_or_above());

CREATE POLICY staff_invitations_insert_admin
  ON public.staff_invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin_or_above()
    AND invited_by = auth.uid()
  );

CREATE POLICY staff_invitations_update_admin
  ON public.staff_invitations
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_above())
  WITH CHECK (public.is_admin_or_above());

-- active_sessions: RLS enabled, no client policies yet (managed server-side)
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;
