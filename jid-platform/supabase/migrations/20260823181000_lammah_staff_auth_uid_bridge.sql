-- Postgres-owned staff wrappers for Lammah claim/review/publish.
-- lammah_staff_actor() reads request.jwt.claim.sub, which PostgREST on this
-- project does not set. Wrappers resolve auth.uid() into that GUC first.
-- Does not bypass gates, auto-publish, or Directory/Profile ownership.

BEGIN;

CREATE OR REPLACE FUNCTION public.staff_claim_lammah_candidate(p_candidate_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_actor uuid := auth.uid();
BEGIN
  IF v_actor IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'catalog_authentication_required');
  END IF;
  PERFORM set_config('request.jwt.claim.sub', v_actor::text, true);
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_actor::text, 'role', 'authenticated')::text,
    true
  );
  RETURN public.claim_lammah_candidate(p_candidate_id);
END
$function$;

CREATE OR REPLACE FUNCTION public.staff_review_lammah_candidate(
  p_candidate_id uuid,
  p_action text,
  p_notes text,
  p_corrected_type public.lammah_opportunity_type_enum DEFAULT NULL,
  p_resolved_company_id uuid DEFAULT NULL
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
    RETURN jsonb_build_object('ok', false, 'code', 'catalog_authentication_required');
  END IF;
  PERFORM set_config('request.jwt.claim.sub', v_actor::text, true);
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_actor::text, 'role', 'authenticated')::text,
    true
  );
  RETURN public.review_lammah_candidate(
    p_candidate_id,
    p_action,
    p_notes,
    p_corrected_type,
    p_resolved_company_id
  );
END
$function$;

CREATE OR REPLACE FUNCTION public.staff_publish_lammah_candidate(p_candidate_id uuid, p_notes text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_actor uuid := auth.uid();
BEGIN
  IF v_actor IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'catalog_authentication_required');
  END IF;
  PERFORM set_config('request.jwt.claim.sub', v_actor::text, true);
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_actor::text, 'role', 'authenticated')::text,
    true
  );
  RETURN public.publish_lammah_candidate(p_candidate_id, p_notes);
END
$function$;

REVOKE ALL ON FUNCTION public.staff_claim_lammah_candidate(uuid) FROM PUBLIC, anon, service_role;
REVOKE ALL ON FUNCTION public.staff_review_lammah_candidate(uuid, text, text, public.lammah_opportunity_type_enum, uuid)
  FROM PUBLIC, anon, service_role;
REVOKE ALL ON FUNCTION public.staff_publish_lammah_candidate(uuid, text) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.staff_claim_lammah_candidate(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_review_lammah_candidate(uuid, text, text, public.lammah_opportunity_type_enum, uuid)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_publish_lammah_candidate(uuid, text) TO authenticated;

COMMIT;
