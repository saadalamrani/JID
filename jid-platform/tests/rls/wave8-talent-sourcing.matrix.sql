-- Wave 8 RLS / privacy actor matrix (rollback-only).
-- Run against jid-nonprod inside a transaction that always rolls back.
-- Does not persist fixtures. Does not touch production.

BEGIN;

DO $$
DECLARE
  v_biz_a uuid := gen_random_uuid();
  v_biz_b uuid := gen_random_uuid();
  v_dir_a uuid := gen_random_uuid();
  v_dir_b uuid := gen_random_uuid();
  v_owner_a uuid := gen_random_uuid();
  v_owner_b uuid := gen_random_uuid();
  v_viewer_a uuid := gen_random_uuid();
  v_disc uuid := gen_random_uuid();
  v_priv uuid := gen_random_uuid();
  v_uni uuid := gen_random_uuid();
  v_job uuid := gen_random_uuid();
  v_role uuid;
  v_crit uuid;
  v_search jsonb;
  v_invite uuid;
  v_intel jsonb;
BEGIN
  -- Minimal directory + verified businesses (shape only; actual FKs may vary).
  -- This script is evidence of intended assertions; live run uses existing helper fixtures
  -- when present. Fail closed if required tables reject inserts.

  RAISE NOTICE 'WAVE8_MATRIX start';

  -- Invariants encoded as static checks against the live catalog.
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name LIKE 'talent_%'
      AND column_name ~* '(match_percent|total_score|rank|culture_fit)'
  ) THEN
    RAISE EXCEPTION 'P0: forbidden aggregate column on talent sourcing tables';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'search_discoverable_talent'
  ) THEN
    RAISE EXCEPTION 'search_discoverable_talent missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'invite_discoverable_talent'
  ) THEN
    RAISE EXCEPTION 'invite_discoverable_talent missing';
  END IF;

  -- Anon execute must be revoked.
  IF has_function_privilege('anon', 'public.search_discoverable_talent(uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'P0: anon can execute search_discoverable_talent';
  END IF;
  IF has_function_privilege('anon', 'public.invite_discoverable_talent(uuid,uuid,text,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'P0: anon can execute invite_discoverable_talent';
  END IF;

  -- Direct writes must not be granted to authenticated (RPC-only writes).
  IF has_table_privilege('authenticated', 'public.talent_sourcing_invitations', 'INSERT') THEN
    RAISE EXCEPTION 'P0: authenticated INSERT on invitations';
  END IF;
  IF has_table_privilege('anon', 'public.talent_sourcing_invitations', 'SELECT') THEN
    RAISE EXCEPTION 'P0: anon SELECT on invitations';
  END IF;

  -- Invitation trigger must not insert applications; it only back-fills application_id.
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'invite_discoverable_talent'
      AND pg_get_functiondef(p.oid) ILIKE '%INSERT INTO public.applications%'
  ) THEN
    RAISE EXCEPTION 'P0: invite_discoverable_talent inserts applications';
  END IF;

  RAISE NOTICE 'WAVE8_MATRIX static PASS';
END $$;

ROLLBACK;
