-- P-103 Task 4 — Directory correction suggestions + staff approval functions

CREATE TABLE IF NOT EXISTS public.directory_correction_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  directory_id uuid NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  suggested_by uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  field_name text NOT NULL,
  current_value text,
  suggested_value text NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT directory_correction_suggestions_field_name_chk
    CHECK (
      field_name IN (
        'city',
        'career_portal_url',
        'website_url',
        'linkedin_url',
        'twitter_url',
        'sector_id',
        'region_id'
      )
    )
);

CREATE INDEX IF NOT EXISTS idx_corrections_pending
  ON public.directory_correction_suggestions (status)
  WHERE status = 'pending';

ALTER TABLE public.directory_correction_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS suggester_reads_own ON public.directory_correction_suggestions;
DROP POLICY IF EXISTS staff_reads_all_suggestions ON public.directory_correction_suggestions;
DROP POLICY IF EXISTS verified_owner_suggests ON public.directory_correction_suggestions;

CREATE POLICY suggester_reads_own
  ON public.directory_correction_suggestions
  FOR SELECT
  TO authenticated
  USING (suggested_by = auth.uid());

CREATE POLICY staff_reads_all_suggestions
  ON public.directory_correction_suggestions
  FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('staff', 'super_admin')
  );

CREATE POLICY verified_owner_suggests
  ON public.directory_correction_suggestions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    suggested_by = auth.uid()
    AND (
      directory_id IN (
        SELECT bp.directory_id
        FROM public.business_profiles bp
        WHERE bp.owner_user_id = auth.uid()
      )
      OR directory_id IN (
        SELECT up.directory_id
        FROM public.university_profiles up
        WHERE up.owner_user_id = auth.uid()
      )
    )
  );

-- ---------------------------------------------------------------------------
-- approve_correction_suggestion — sole path for suggestion → Directory write
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.approve_correction_suggestion(
  p_suggestion_id uuid,
  p_review_notes text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id uuid := auth.uid();
  v_caller_role public.user_role_enum;
  v_sug public.directory_correction_suggestions%ROWTYPE;
  v_allowed_fields text[] := ARRAY[
    'city',
    'career_portal_url',
    'website_url',
    'linkedin_url',
    'twitter_url',
    'sector_id',
    'region_id'
  ];
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT role INTO v_caller_role FROM public.profiles WHERE id = v_actor_id;

  IF v_caller_role NOT IN ('staff', 'super_admin') THEN
    RAISE EXCEPTION 'insufficient_privileges';
  END IF;

  IF p_review_notes IS NULL OR length(trim(p_review_notes)) = 0 THEN
    RAISE EXCEPTION 'review_notes_required';
  END IF;

  SELECT * INTO v_sug
  FROM public.directory_correction_suggestions
  WHERE id = p_suggestion_id
  FOR UPDATE;

  IF v_sug.id IS NULL OR v_sug.status <> 'pending' THEN
    RAISE EXCEPTION 'invalid_or_reviewed';
  END IF;

  IF NOT (v_sug.field_name = ANY (v_allowed_fields)) THEN
    RAISE EXCEPTION 'field_not_allowed';
  END IF;

  EXECUTE format(
    'UPDATE public.companies SET %I = $1, updated_at = now() WHERE id = $2',
    v_sug.field_name
  )
  USING v_sug.suggested_value, v_sug.directory_id;

  UPDATE public.directory_correction_suggestions
  SET
    status = 'approved',
    reviewed_by = v_actor_id,
    reviewed_at = now(),
    review_notes = trim(p_review_notes)
  WHERE id = p_suggestion_id;

  PERFORM public._write_audit_log(
    v_actor_id,
    'directory.corrected',
    'company',
    v_sug.directory_id,
    jsonb_build_object('field', v_sug.field_name, 'old', v_sug.current_value),
    jsonb_build_object('field', v_sug.field_name, 'new', v_sug.suggested_value, 'reason', trim(p_review_notes))
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- reject_correction_suggestion
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.reject_correction_suggestion(
  p_suggestion_id uuid,
  p_review_notes text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id uuid := auth.uid();
  v_caller_role public.user_role_enum;
  v_sug public.directory_correction_suggestions%ROWTYPE;
  v_notes text;
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT role INTO v_caller_role FROM public.profiles WHERE id = v_actor_id;

  IF v_caller_role NOT IN ('staff', 'super_admin') THEN
    RAISE EXCEPTION 'insufficient_privileges';
  END IF;

  v_notes := NULLIF(trim(p_review_notes), '');
  IF v_notes IS NULL THEN
    RAISE EXCEPTION 'review_notes_required';
  END IF;

  SELECT * INTO v_sug
  FROM public.directory_correction_suggestions
  WHERE id = p_suggestion_id
  FOR UPDATE;

  IF v_sug.id IS NULL OR v_sug.status <> 'pending' THEN
    RAISE EXCEPTION 'invalid_or_reviewed';
  END IF;

  UPDATE public.directory_correction_suggestions
  SET
    status = 'rejected',
    reviewed_by = v_actor_id,
    reviewed_at = now(),
    review_notes = v_notes
  WHERE id = p_suggestion_id;

  PERFORM public._write_audit_log(
    v_actor_id,
    'directory.correction_rejected',
    'directory_correction_suggestion',
    p_suggestion_id,
    jsonb_build_object('status', v_sug.status, 'field', v_sug.field_name),
    jsonb_build_object('status', 'rejected', 'reason', v_notes)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.approve_correction_suggestion(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_correction_suggestion(uuid, text) TO authenticated;

REVOKE ALL ON FUNCTION public.reject_correction_suggestion(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reject_correction_suggestion(uuid, text) TO authenticated;

NOTIFY pgrst, 'reload schema';
