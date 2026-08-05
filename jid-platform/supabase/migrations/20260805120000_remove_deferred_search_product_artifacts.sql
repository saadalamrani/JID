-- Forward-only cleanup: remove deferred Search-For-Me product active DB artifacts.
-- Does NOT edit prior migrations. Applies only to non-production (jid-nonprod).
--
-- Proven dependents (from 096_search_mandates + 20260726183230_lammah_native_dedup):
--   cron: sweep-mandate-matching
--   triggers: trg_mandate_match_job, trg_mandate_match_lammah,
--             trg_dismiss_superseded_lammah_matches
--   trigger fns: trg_mandate_match_on_job_publish, trg_mandate_match_on_lammah_insert,
--                dismiss_superseded_lammah_matches
--   engine fns: insert/run/sweep/create/update/dismiss/mark/abhathli_unseen + score helpers
--   tables: mandate_matches, search_mandates
--   policies: search_mandates_owner, mandate_matches_owner_read/update
--   entitlement rows: plan_entitlements.feature_key = 'search_for_me'
--   notifications/prefs: category 'search.mandate_match'
--
-- No unrestricted CASCADE. Objects dropped by explicit name in dependency order.
-- Lammah inventory, native Jobs, Directory, Verification, Profiles preserved.
-- lammah_native_match_events preserved (not Abhathli-exclusive).

-- ---------------------------------------------------------------------------
-- 1. Cron job
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) AND EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'sweep-mandate-matching'
  ) THEN
    PERFORM cron.unschedule('sweep-mandate-matching');
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    NULL; -- cron.job absent
  WHEN undefined_function THEN
    NULL;
END;
$$;

-- ---------------------------------------------------------------------------
-- 2. Triggers (jobs / lammah_opportunities)
-- ---------------------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_mandate_match_job ON public.jobs;
DROP TRIGGER IF EXISTS trg_mandate_match_lammah ON public.lammah_opportunities;
DROP TRIGGER IF EXISTS trg_dismiss_superseded_lammah_matches ON public.lammah_opportunities;

-- ---------------------------------------------------------------------------
-- 3. Functions (engine, CRUD, helpers, trigger bodies)
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.sweep_mandate_matching();
DROP FUNCTION IF EXISTS public.run_mandate_matching_for_job(UUID);
DROP FUNCTION IF EXISTS public.run_mandate_matching_for_lammah(UUID);
DROP FUNCTION IF EXISTS public.insert_mandate_match(UUID, UUID, UUID, NUMERIC, JSONB);
DROP FUNCTION IF EXISTS public.compute_mandate_item_score(
  public.search_mandates,
  TEXT,
  TEXT,
  public.ownership_enum,
  public.experience_level_enum,
  TEXT,
  TEXT,
  TEXT[]
);
DROP FUNCTION IF EXISTS public.mandate_dimension_weight(public.search_mandates, TEXT, NUMERIC);
DROP FUNCTION IF EXISTS public.create_search_mandate(JSONB);
DROP FUNCTION IF EXISTS public.update_search_mandate(UUID, JSONB);
DROP FUNCTION IF EXISTS public.dismiss_mandate_match(UUID, TEXT);
DROP FUNCTION IF EXISTS public.mark_mandate_matches_seen(UUID);
DROP FUNCTION IF EXISTS public.abhathli_unseen_match_count();
DROP FUNCTION IF EXISTS public.trg_mandate_match_on_job_publish();
DROP FUNCTION IF EXISTS public.trg_mandate_match_on_lammah_insert();
DROP FUNCTION IF EXISTS public.dismiss_superseded_lammah_matches();
-- Created only for this feature in 096; no other callers remain after function drops above.
DROP FUNCTION IF EXISTS public.user_has_feature_entitlement(UUID, TEXT);

-- ---------------------------------------------------------------------------
-- 4. Tables (policies/indexes/constraints drop with tables)
-- ---------------------------------------------------------------------------

DROP TABLE IF EXISTS public.mandate_matches;
DROP TABLE IF EXISTS public.search_mandates;

-- ---------------------------------------------------------------------------
-- 5. Entitlement catalogue rows + CHECK constraint (remove search_for_me)
-- ---------------------------------------------------------------------------

DELETE FROM public.plan_entitlements
WHERE feature_key = 'search_for_me';

ALTER TABLE public.plan_entitlements
  DROP CONSTRAINT IF EXISTS plan_entitlements_feature_key_chk;

ALTER TABLE public.plan_entitlements
  ADD CONSTRAINT plan_entitlements_feature_key_chk CHECK (
    feature_key IN (
      'cv_pro_formats',
      'lammah_feed',
      'smart_communication',
      'ssis',
      'priority_visibility'
    )
  );

-- ---------------------------------------------------------------------------
-- 6. Notification rows for retired category + rename enum label
--    PostgreSQL cannot DROP an enum value; after purging rows, rename the label
--    to an inert token that matches none of the deferred-product identifiers.
-- ---------------------------------------------------------------------------

DELETE FROM public.notifications
WHERE category::text = 'search.mandate_match';

DELETE FROM public.notification_preferences
WHERE category::text = 'search.mandate_match';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'notification_category_enum'
      AND e.enumlabel = 'search.mandate_match'
  ) THEN
    ALTER TYPE public.notification_category_enum
      RENAME VALUE 'search.mandate_match' TO '_retired_unused_category_a';
  END IF;
END;
$$;
