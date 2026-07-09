-- 093_cv_builder_prefs.sql — CV builder preferences only (Prompt 1).
-- PDPL: never store rendered documents or export payloads.

CREATE TABLE IF NOT EXISTS public.cv_builder_prefs (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_format TEXT NOT NULL DEFAULT 'basic_free'
    CHECK (preferred_format IN ('harvard', 'global_ats', 'basic_free')),
  preferred_language TEXT NOT NULL DEFAULT 'en'
    CHECK (preferred_language IN ('en', 'ar')),
  section_order JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cv_builder_prefs_updated
  ON public.cv_builder_prefs (updated_at DESC);

ALTER TABLE public.cv_builder_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cv_builder_prefs_owner_select"
  ON public.cv_builder_prefs
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "cv_builder_prefs_owner_insert"
  ON public.cv_builder_prefs
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "cv_builder_prefs_owner_update"
  ON public.cv_builder_prefs
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "cv_builder_prefs_owner_delete"
  ON public.cv_builder_prefs
  FOR DELETE
  USING (user_id = auth.uid());

COMMENT ON TABLE public.cv_builder_prefs IS
  'Per-user CV builder UI preferences — format/language/section order only. No document content.';
