-- Wave 4 — Career Operations + Abhathli (Individual-private)
-- Non-production only. Never apply to production (znfhladafpajyjwcfzvv).
--
-- Does NOT alter public.applications, application snapshots, or employer
-- hiring-stage semantics (Wave 5 shared contract).
-- GOVERNED_EXTERNAL rows cannot receive application_id.

CREATE OR REPLACE FUNCTION public.wave4_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := timezone('utc', now());
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.career_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id text NOT NULL,
  source_class text NOT NULL CHECK (source_class IN ('JID_NATIVE', 'GOVERNED_EXTERNAL')),
  application_id uuid REFERENCES public.applications(id) ON DELETE SET NULL,
  operational_state text NOT NULL DEFAULT 'considering'
    CHECK (operational_state IN (
      'considering',
      'preparing',
      'applied',
      'interviewing',
      'following_up',
      'waiting',
      'outcome'
    )),
  outcome_kind text
    CHECK (
      outcome_kind IS NULL
      OR outcome_kind IN (
        'open',
        'offer',
        'accepted',
        'declined',
        'rejected',
        'withdrawn',
        'expired',
        'no_response'
      )
    ),
  title_ar text,
  title_en text,
  organization_name text,
  deadline_at timestamptz,
  apply_authority text,
  apply_url text,
  last_user_action_at timestamptz,
  last_employer_action_at timestamptz,
  last_system_event_at timestamptz,
  last_seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT career_items_external_no_application
    CHECK (source_class <> 'GOVERNED_EXTERNAL' OR application_id IS NULL),
  CONSTRAINT career_items_user_opportunity_unique UNIQUE (user_id, opportunity_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS career_items_user_application_uidx
  ON public.career_items (user_id, application_id)
  WHERE application_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS career_items_user_updated_idx
  ON public.career_items (user_id, updated_at DESC);

DROP TRIGGER IF EXISTS trg_career_items_updated_at ON public.career_items;
CREATE TRIGGER trg_career_items_updated_at
  BEFORE UPDATE ON public.career_items
  FOR EACH ROW
  EXECUTE FUNCTION public.wave4_touch_updated_at();

CREATE TABLE IF NOT EXISTS public.career_item_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  career_item_id uuid NOT NULL REFERENCES public.career_items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN (
    'review_posting',
    'prepare_materials',
    'apply',
    'follow_up',
    'attend_interview',
    'send_thanks',
    'record_outcome',
    'custom'
  )),
  label text NOT NULL,
  due_at timestamptz,
  completed_at timestamptz,
  is_follow_up boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS career_item_actions_user_due_idx
  ON public.career_item_actions (user_id, due_at)
  WHERE completed_at IS NULL;

DROP TRIGGER IF EXISTS trg_career_item_actions_updated_at ON public.career_item_actions;
CREATE TRIGGER trg_career_item_actions_updated_at
  BEFORE UPDATE ON public.career_item_actions
  FOR EACH ROW
  EXECUTE FUNCTION public.wave4_touch_updated_at();

CREATE TABLE IF NOT EXISTS public.career_item_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  career_item_id uuid NOT NULL REFERENCES public.career_items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

DROP TRIGGER IF EXISTS trg_career_item_notes_updated_at ON public.career_item_notes;
CREATE TRIGGER trg_career_item_notes_updated_at
  BEFORE UPDATE ON public.career_item_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.wave4_touch_updated_at();

CREATE TABLE IF NOT EXISTS public.career_item_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  career_item_id uuid NOT NULL REFERENCES public.career_items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_kind text NOT NULL CHECK (actor_kind IN ('user', 'employer', 'system')),
  event_type text NOT NULL,
  summary text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS career_item_events_item_idx
  ON public.career_item_events (career_item_id, occurred_at DESC);

CREATE TABLE IF NOT EXISTS public.career_item_interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  career_item_id uuid NOT NULL REFERENCES public.career_items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_at timestamptz NOT NULL,
  location_or_mode text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

DROP TRIGGER IF EXISTS trg_career_item_interviews_updated_at ON public.career_item_interviews;
CREATE TRIGGER trg_career_item_interviews_updated_at
  BEFORE UPDATE ON public.career_item_interviews
  FOR EACH ROW
  EXECUTE FUNCTION public.wave4_touch_updated_at();

CREATE TABLE IF NOT EXISTS public.career_item_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  career_item_id uuid NOT NULL REFERENCES public.career_items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  role_title text,
  channel text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.abhathli_mandates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  keywords text[] NOT NULL DEFAULT '{}',
  families text[] NOT NULL DEFAULT '{}',
  cities text[] NOT NULL DEFAULT '{}',
  remote_only boolean NOT NULL DEFAULT false,
  use_career_record boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

DROP TRIGGER IF EXISTS trg_abhathli_mandates_updated_at ON public.abhathli_mandates;
CREATE TRIGGER trg_abhathli_mandates_updated_at
  BEFORE UPDATE ON public.abhathli_mandates
  FOR EACH ROW
  EXECUTE FUNCTION public.wave4_touch_updated_at();

CREATE TABLE IF NOT EXISTS public.abhathli_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id uuid NOT NULL REFERENCES public.abhathli_mandates(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  inventory_size integer NOT NULL DEFAULT 0,
  result_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.abhathli_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.abhathli_runs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.abhathli_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id uuid NOT NULL REFERENCES public.abhathli_recommendations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.abhathli_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id uuid NOT NULL REFERENCES public.abhathli_recommendations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id text NOT NULL,
  action text NOT NULL CHECK (action IN ('apply_native', 'redirect_external', 'track_only')),
  approved boolean NOT NULL DEFAULT false,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT abhathli_approvals_one_per_recommendation UNIQUE (recommendation_id)
);

-- ---------------------------------------------------------------------------
-- RLS: owner-only. No employer, staff, or anon access.
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'career_items',
    'career_item_actions',
    'career_item_notes',
    'career_item_events',
    'career_item_interviews',
    'career_item_contacts',
    'abhathli_mandates',
    'abhathli_runs',
    'abhathli_recommendations',
    'abhathli_drafts',
    'abhathli_approvals'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC, anon, authenticated', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
  END LOOP;
END;
$$;

DROP POLICY IF EXISTS career_items_owner_all ON public.career_items;
CREATE POLICY career_items_owner_all ON public.career_items
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS career_item_actions_owner_all ON public.career_item_actions;
CREATE POLICY career_item_actions_owner_all ON public.career_item_actions
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS career_item_notes_owner_all ON public.career_item_notes;
CREATE POLICY career_item_notes_owner_all ON public.career_item_notes
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS career_item_events_owner_all ON public.career_item_events;
CREATE POLICY career_item_events_owner_all ON public.career_item_events
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS career_item_interviews_owner_all ON public.career_item_interviews;
CREATE POLICY career_item_interviews_owner_all ON public.career_item_interviews
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS career_item_contacts_owner_all ON public.career_item_contacts;
CREATE POLICY career_item_contacts_owner_all ON public.career_item_contacts
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS abhathli_mandates_owner_all ON public.abhathli_mandates;
CREATE POLICY abhathli_mandates_owner_all ON public.abhathli_mandates
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS abhathli_runs_owner_all ON public.abhathli_runs;
CREATE POLICY abhathli_runs_owner_all ON public.abhathli_runs
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS abhathli_recommendations_owner_all ON public.abhathli_recommendations;
CREATE POLICY abhathli_recommendations_owner_all ON public.abhathli_recommendations
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS abhathli_drafts_owner_all ON public.abhathli_drafts;
CREATE POLICY abhathli_drafts_owner_all ON public.abhathli_drafts
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS abhathli_approvals_owner_all ON public.abhathli_approvals;
CREATE POLICY abhathli_approvals_owner_all ON public.abhathli_approvals
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
