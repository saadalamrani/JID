-- Wave 9 nonprod actor proof. All fixtures and audit writes roll back.
BEGIN;
DO $$
DECLARE
  a uuid; b uuid; outsider uuid; business_actor uuid; university_actor uuid; staff_actor uuid;
  connection_id uuid; update_id uuid; payload jsonb; discovery_before boolean; discovery_after boolean;
BEGIN
  SELECT id INTO a FROM public.profiles WHERE role='individual' AND deleted_at IS NULL AND suspended_at IS NULL LIMIT 1;
  SELECT id INTO b FROM public.profiles WHERE role='individual' AND deleted_at IS NULL AND suspended_at IS NULL AND id<>a LIMIT 1;
  SELECT id INTO outsider FROM public.profiles WHERE role='individual' AND deleted_at IS NULL AND suspended_at IS NULL AND id NOT IN(a,b) LIMIT 1;
  SELECT id INTO business_actor FROM public.profiles WHERE role='company_admin' LIMIT 1;
  SELECT id INTO university_actor FROM public.profiles WHERE role='university_admin' LIMIT 1;
  SELECT id INTO staff_actor FROM public.profiles WHERE role IN('staff','super_admin') LIMIT 1;
  IF a IS NULL OR b IS NULL OR outsider IS NULL OR business_actor IS NULL OR university_actor IS NULL THEN
    RAISE EXCEPTION 'required existing nonprod actor fixtures are missing';
  END IF;
  SELECT show_profile_to_companies INTO discovery_before FROM public.profiles WHERE id=a;
  PERFORM set_config('request.jwt.claim.role','authenticated',true);
  PERFORM set_config('request.jwt.claim.sub',a::text,true);
  connection_id:=public.request_professional_connection(b);
  PERFORM set_config('request.jwt.claim.sub',b::text,true);
  PERFORM public.respond_professional_connection(connection_id,true);
  PERFORM set_config('request.jwt.claim.sub',a::text,true);
  update_id:=public.create_professional_update('project','Wave 9 rollback-only proof','connections');
  PERFORM set_config('request.jwt.claim.sub',b::text,true);
  payload:=public.get_professional_network();
  IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(payload->'updates') x WHERE x->>'id'=update_id::text) THEN RAISE EXCEPTION 'connected Individual cannot see update'; END IF;
  PERFORM set_config('request.jwt.claim.sub',outsider::text,true);
  payload:=public.get_professional_network();
  IF EXISTS(SELECT 1 FROM jsonb_array_elements(payload->'updates') x WHERE x->>'id'=update_id::text) THEN RAISE EXCEPTION 'unrelated Individual can see update'; END IF;
  BEGIN PERFORM public.delete_professional_update(update_id); RAISE EXCEPTION 'unrelated owner mutation succeeded'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  PERFORM set_config('request.jwt.claim.sub',b::text,true);
  PERFORM public.block_professional_profile(outsider);
  PERFORM set_config('request.jwt.claim.sub',outsider::text,true);
  BEGIN PERFORM public.request_professional_connection(b); RAISE EXCEPTION 'blocked request succeeded'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  PERFORM set_config('request.jwt.claim.sub',business_actor::text,true);
  BEGIN PERFORM public.get_professional_network(); RAISE EXCEPTION 'Business obtained network data'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  PERFORM set_config('request.jwt.claim.sub',university_actor::text,true);
  BEGIN PERFORM public.get_professional_network(); RAISE EXCEPTION 'University obtained network data'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  IF staff_actor IS NOT NULL THEN PERFORM set_config('request.jwt.claim.sub',staff_actor::text,true); BEGIN PERFORM public.get_professional_network(); RAISE EXCEPTION 'Staff obtained unintended network data'; EXCEPTION WHEN insufficient_privilege THEN NULL; END; END IF;
  IF has_function_privilege('anon','public.get_professional_network()','EXECUTE') THEN RAISE EXCEPTION 'anon has network execute'; END IF;
  SELECT show_profile_to_companies INTO discovery_after FROM public.profiles WHERE id=a;
  IF discovery_before IS DISTINCT FROM discovery_after THEN RAISE EXCEPTION 'network changed employer discoverability'; END IF;
  RAISE NOTICE 'WAVE9_ACTOR_MATRIX PASS';
END $$;
ROLLBACK;
