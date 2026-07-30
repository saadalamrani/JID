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

-- Disposable-only: insert a correction suggestion that may violate the field CHECK
-- so Session 06-C can prove field_not_allowed / Profile-field denial at the RPC.
CREATE OR REPLACE FUNCTION public.rls_test_insert_correction_suggestion(
  p_id uuid,
  p_directory_id uuid,
  p_suggested_by uuid,
  p_field_name text,
  p_current_value text,
  p_suggested_value text,
  p_reason text DEFAULT 'fixture'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  ALTER TABLE public.directory_correction_suggestions
    DROP CONSTRAINT IF EXISTS directory_correction_suggestions_field_name_chk;

  INSERT INTO public.directory_correction_suggestions (
    id,
    directory_id,
    suggested_by,
    field_name,
    current_value,
    suggested_value,
    reason,
    status
  ) VALUES (
    p_id,
    p_directory_id,
    p_suggested_by,
    p_field_name,
    p_current_value,
    p_suggested_value,
    p_reason,
    'pending'
  );

  -- NOT VALID: keep fixture rows that intentionally violate the product CHECK
  -- while still blocking ordinary new inserts of disallowed fields.
  ALTER TABLE public.directory_correction_suggestions
    ADD CONSTRAINT directory_correction_suggestions_field_name_chk
    CHECK (
      field_name = ANY (
        ARRAY[
          'city',
          'career_portal_url',
          'website_url',
          'linkedin_url',
          'twitter_url',
          'sector_id',
          'region_id'
        ]
      )
    ) NOT VALID;
EXCEPTION WHEN OTHERS THEN
  BEGIN
    ALTER TABLE public.directory_correction_suggestions
      ADD CONSTRAINT directory_correction_suggestions_field_name_chk
      CHECK (
        field_name = ANY (
          ARRAY[
            'city',
            'career_portal_url',
            'website_url',
            'linkedin_url',
            'twitter_url',
            'sector_id',
            'region_id'
          ]
        )
      ) NOT VALID;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
  RAISE;
END;
$$;

REVOKE ALL ON FUNCTION public.rls_test_insert_correction_suggestion(
  uuid, uuid, uuid, text, text, text, text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rls_test_insert_correction_suggestion(
  uuid, uuid, uuid, text, text, text, text
) TO service_role;

NOTIFY pgrst, 'reload schema';

-- Disposable-only: suggestion row whose directory_id no longer exists (FK temporarily
-- dropped), so approve can prove directory_missing + atomic rollback.
CREATE OR REPLACE FUNCTION public.rls_test_insert_orphan_correction_suggestion(
  p_id uuid,
  p_directory_id uuid,
  p_suggested_by uuid,
  p_field_name text DEFAULT 'city',
  p_current_value text DEFAULT 'Riyadh',
  p_suggested_value text DEFAULT 'OrphanCity',
  p_reason text DEFAULT 'fixture'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  ALTER TABLE public.directory_correction_suggestions
    DROP CONSTRAINT IF EXISTS directory_correction_suggestions_directory_id_fkey;

  INSERT INTO public.directory_correction_suggestions (
    id,
    directory_id,
    suggested_by,
    field_name,
    current_value,
    suggested_value,
    reason,
    status
  ) VALUES (
    p_id,
    p_directory_id,
    p_suggested_by,
    p_field_name,
    p_current_value,
    p_suggested_value,
    p_reason,
    'pending'
  );

  ALTER TABLE public.directory_correction_suggestions
    ADD CONSTRAINT directory_correction_suggestions_directory_id_fkey
    FOREIGN KEY (directory_id) REFERENCES public.companies (id) ON DELETE CASCADE
    NOT VALID;
EXCEPTION WHEN OTHERS THEN
  BEGIN
    ALTER TABLE public.directory_correction_suggestions
      ADD CONSTRAINT directory_correction_suggestions_directory_id_fkey
      FOREIGN KEY (directory_id) REFERENCES public.companies (id) ON DELETE CASCADE
      NOT VALID;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
  RAISE;
END;
$$;

REVOKE ALL ON FUNCTION public.rls_test_insert_orphan_correction_suggestion(
  uuid, uuid, uuid, text, text, text, text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rls_test_insert_orphan_correction_suggestion(
  uuid, uuid, uuid, text, text, text, text
) TO service_role;

NOTIFY pgrst, 'reload schema';
