-- Task 1 — Session-anchored mentee testimonials (reconciles decorative mentor_reviews from 042)
-- HARD RULE: every review traces to a completed mentorship_meetings row.

-- ---------------------------------------------------------------------------
-- Enum — reviewer consent for public display (Article 5)
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  CREATE TYPE public.review_visibility_enum AS ENUM (
    'private',
    'public_named',
    'public_anonymous'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

-- ---------------------------------------------------------------------------
-- Reconcile mentor_reviews (042) → session-anchored shape
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS mentor_reviews_select_approved_mentors ON public.mentor_reviews;
DROP POLICY IF EXISTS mentor_reviews_select_staff ON public.mentor_reviews;

-- Decorative seed rows have no meeting anchor — drop per Data-Truth (Article 4)
DELETE FROM public.mentor_reviews;

ALTER TABLE public.mentor_reviews
  ADD COLUMN IF NOT EXISTS meeting_id uuid,
  ADD COLUMN IF NOT EXISTS visibility public.review_visibility_enum;

UPDATE public.mentor_reviews
SET visibility = 'private'::public.review_visibility_enum
WHERE visibility IS NULL;

ALTER TABLE public.mentor_reviews
  RENAME COLUMN body TO review_text;

ALTER TABLE public.mentor_reviews
  ALTER COLUMN visibility SET NOT NULL,
  ALTER COLUMN visibility SET DEFAULT 'private'::public.review_visibility_enum,
  ALTER COLUMN created_at SET DEFAULT now();

-- Re-anchor user FKs to auth.users (profiles.id is 1:1; spec requires auth.users)
ALTER TABLE public.mentor_reviews
  DROP CONSTRAINT IF EXISTS mentor_reviews_mentor_id_fkey;

ALTER TABLE public.mentor_reviews
  ADD CONSTRAINT mentor_reviews_mentor_id_fkey
  FOREIGN KEY (mentor_id) REFERENCES auth.users (id) ON DELETE CASCADE;

ALTER TABLE public.mentor_reviews
  DROP CONSTRAINT IF EXISTS mentor_reviews_reviewer_id_fkey;

ALTER TABLE public.mentor_reviews
  ALTER COLUMN reviewer_id SET NOT NULL;

ALTER TABLE public.mentor_reviews
  ADD CONSTRAINT mentor_reviews_reviewer_id_fkey
  FOREIGN KEY (reviewer_id) REFERENCES auth.users (id) ON DELETE CASCADE;

ALTER TABLE public.mentor_reviews
  DROP CONSTRAINT IF EXISTS mentor_reviews_meeting_id_fkey;

ALTER TABLE public.mentor_reviews
  ADD CONSTRAINT mentor_reviews_meeting_id_fkey
  FOREIGN KEY (meeting_id) REFERENCES public.mentorship_meetings (id) ON DELETE CASCADE;

ALTER TABLE public.mentor_reviews
  ALTER COLUMN meeting_id SET NOT NULL;

ALTER TABLE public.mentor_reviews
  DROP CONSTRAINT IF EXISTS mentor_reviews_meeting_reviewer_unique;

ALTER TABLE public.mentor_reviews
  ADD CONSTRAINT mentor_reviews_meeting_reviewer_unique
  UNIQUE (meeting_id, reviewer_id);

CREATE INDEX IF NOT EXISTS idx_mentor_reviews_mentor_created
  ON public.mentor_reviews (mentor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_mentor_reviews_meeting
  ON public.mentor_reviews (meeting_id);

CREATE INDEX IF NOT EXISTS idx_mentor_reviews_public_mentor_created
  ON public.mentor_reviews (mentor_id, created_at DESC)
  WHERE visibility IN ('public_named', 'public_anonymous');

-- ---------------------------------------------------------------------------
-- Integrity — completed meeting + party alignment
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.validate_mentor_review_session()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_meeting record;
BEGIN
  SELECT id, mentor_id, mentee_id, status
  INTO v_meeting
  FROM public.mentorship_meetings
  WHERE id = NEW.meeting_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'mentor_review_requires_completed_meeting'
      USING ERRCODE = '23503';
  END IF;

  IF v_meeting.status IS DISTINCT FROM 'completed' THEN
    RAISE EXCEPTION 'mentor_review_requires_completed_meeting'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.mentor_id IS DISTINCT FROM v_meeting.mentor_id THEN
    RAISE EXCEPTION 'mentor_review_mentor_mismatch'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.reviewer_id IS DISTINCT FROM v_meeting.mentee_id THEN
    RAISE EXCEPTION 'mentor_review_reviewer_must_be_mentee'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mentor_reviews_validate_session ON public.mentor_reviews;

CREATE TRIGGER trg_mentor_reviews_validate_session
  BEFORE INSERT OR UPDATE OF meeting_id, mentor_id, reviewer_id
  ON public.mentor_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_mentor_review_session();

-- ---------------------------------------------------------------------------
-- RLS — privacy-aware visibility (replaces 042 public-read-all)
-- ---------------------------------------------------------------------------

ALTER TABLE public.mentor_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY mentor_reviews_insert_mentee
  ON public.mentor_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    reviewer_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.mentorship_meetings mm
      WHERE mm.id = meeting_id
        AND mm.status = 'completed'
        AND mm.mentee_id = auth.uid()
        AND mm.mentor_id = mentor_id
    )
  );

CREATE POLICY mentor_reviews_select_parties
  ON public.mentor_reviews
  FOR SELECT
  TO authenticated
  USING (reviewer_id = auth.uid() OR mentor_id = auth.uid());

CREATE POLICY mentor_reviews_select_public
  ON public.mentor_reviews
  FOR SELECT
  TO anon, authenticated
  USING (
    visibility IN ('public_named', 'public_anonymous')
    AND EXISTS (
      SELECT 1
      FROM public.mentor_profiles mp
      WHERE mp.user_id = mentor_reviews.mentor_id
        AND mp.status = 'approved'
    )
  );

CREATE POLICY mentor_reviews_update_reviewer
  ON public.mentor_reviews
  FOR UPDATE
  TO authenticated
  USING (reviewer_id = auth.uid())
  WITH CHECK (reviewer_id = auth.uid());

CREATE POLICY mentor_reviews_select_staff
  ON public.mentor_reviews
  FOR SELECT
  TO authenticated
  USING (public.is_mentorship_staff() OR public.is_privileged_staff());
