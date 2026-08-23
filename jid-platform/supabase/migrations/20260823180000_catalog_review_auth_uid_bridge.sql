-- Postgres-owned staff wrappers for catalog review/publish.
-- The catalog_function_owner implementations read request.jwt.claim.sub,
-- which PostgREST on this project does not set. These wrappers resolve
-- auth.uid() and set the legacy GUC before delegating.
-- Does not bypass review/publication gates or Directory/Profile separation.

BEGIN;

CREATE OR REPLACE FUNCTION public.staff_review_directory_candidate(
  p_review_queue_id uuid,
  p_action text,
  p_notes text,
  p_domain text DEFAULT NULL,
  p_evidence_url text DEFAULT NULL,
  p_name_ar text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_actor uuid := auth.uid();
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'catalog_authentication_required';
  END IF;
  PERFORM set_config('request.jwt.claim.sub', v_actor::text, true);
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_actor::text, 'role', 'authenticated')::text,
    true
  );
  RETURN public.review_directory_candidate(
    p_review_queue_id,
    p_action,
    p_notes,
    p_domain,
    p_evidence_url,
    p_name_ar
  );
END
$function$;

CREATE OR REPLACE FUNCTION public.staff_publish_directory_candidate(p_review_queue_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_actor uuid := auth.uid();
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'catalog_authentication_required';
  END IF;
  PERFORM set_config('request.jwt.claim.sub', v_actor::text, true);
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_actor::text, 'role', 'authenticated')::text,
    true
  );
  RETURN public.publish_directory_candidate(p_review_queue_id);
END
$function$;

REVOKE ALL ON FUNCTION public.staff_review_directory_candidate(uuid, text, text, text, text, text)
  FROM PUBLIC, anon, service_role;
REVOKE ALL ON FUNCTION public.staff_publish_directory_candidate(uuid)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.staff_review_directory_candidate(uuid, text, text, text, text, text)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_publish_directory_candidate(uuid)
  TO authenticated;

COMMENT ON FUNCTION public.staff_review_directory_candidate(uuid, text, text, text, text, text) IS
  'Staff review wrapper. Sets auth.uid() into the legacy JWT GUC, then delegates to review_directory_candidate.';

COMMENT ON FUNCTION public.staff_publish_directory_candidate(uuid) IS
  'Staff publication wrapper. Sets auth.uid() into the legacy JWT GUC, then delegates to publish_directory_candidate.';

COMMIT;
