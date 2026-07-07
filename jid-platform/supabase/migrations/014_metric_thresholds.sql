-- Section 12 Step 1 / Master Prompt 4.2 — Platform Pulse metric thresholds.

CREATE TABLE IF NOT EXISTS public.metric_thresholds (
  metric_key text PRIMARY KEY,
  label_en text NOT NULL,
  label_ar text NOT NULL,
  min_value numeric NOT NULL,
  current_value numeric NOT NULL DEFAULT 0,
  is_met boolean GENERATED ALWAYS AS (current_value >= min_value) STORED,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_metric_thresholds_is_met
  ON public.metric_thresholds (is_met);

ALTER TABLE public.metric_thresholds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS metric_thresholds_select_public ON public.metric_thresholds;
CREATE POLICY metric_thresholds_select_public
  ON public.metric_thresholds
  FOR SELECT
  TO public
  USING (true);

DO $$
BEGIN
  IF to_regprocedure('public.current_user_role()') IS NOT NULL THEN
    DROP POLICY IF EXISTS metric_thresholds_update_super_admin ON public.metric_thresholds;
    EXECUTE $policy$
      CREATE POLICY metric_thresholds_update_super_admin
        ON public.metric_thresholds
        FOR UPDATE
        TO authenticated
        USING (public.current_user_role() = 'super_admin')
        WITH CHECK (public.current_user_role() = 'super_admin')
    $policy$;
  END IF;
END;
$$;

INSERT INTO public.metric_thresholds (metric_key, label_en, label_ar, min_value, current_value)
VALUES
  ('total_candidates', 'Total candidates', 'إجمالي المرشحين', 500, 0),
  ('total_companies', 'Total companies', 'إجمالي الشركات', 50, 0),
  ('total_jobs', 'Total jobs', 'إجمالي الوظائف', 100, 0),
  ('total_mentors', 'Total mentors', 'إجمالي المرشدين', 20, 0),
  ('total_sessions', 'Total sessions', 'إجمالي الجلسات', 50, 0),
  ('response_rate', 'Response rate', 'معدل الاستجابة', 0, 0)
ON CONFLICT (metric_key) DO UPDATE SET
  label_en = EXCLUDED.label_en,
  label_ar = EXCLUDED.label_ar,
  min_value = EXCLUDED.min_value,
  updated_at = now();
