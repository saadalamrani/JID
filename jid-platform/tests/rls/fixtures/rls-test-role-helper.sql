-- Disposable-local RLS test helper. Never apply as a product migration.
CREATE OR REPLACE FUNCTION public.rls_test_set_user_role(
  p_target_user_id uuid,
  p_new_role public.user_role_enum
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM set_config('jid.allow_role_change', 'on', true);

  UPDATE public.profiles
  SET role = p_new_role, updated_at = now()
  WHERE id = p_target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'RLS fixture profile not found';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.rls_test_set_user_role(uuid, public.user_role_enum)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rls_test_set_user_role(uuid, public.user_role_enum)
  TO service_role;

NOTIFY pgrst, 'reload schema';

CREATE OR REPLACE FUNCTION public.rls_test_clear_user_audit(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  ALTER TABLE public.audit_logs DISABLE TRIGGER USER;
  DELETE FROM public.audit_logs WHERE actor_id = p_user_id;
  ALTER TABLE public.audit_logs ENABLE TRIGGER USER;
EXCEPTION WHEN OTHERS THEN
  ALTER TABLE public.audit_logs ENABLE TRIGGER USER;
  RAISE;
END;
$$;

REVOKE ALL ON FUNCTION public.rls_test_clear_user_audit(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rls_test_clear_user_audit(uuid) TO service_role;

NOTIFY pgrst, 'reload schema';
