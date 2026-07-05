-- Mentor public profile fields + reviews (Section 6.10 / Section 12 Step 11)

ALTER TABLE public.mentor_profiles
  ADD COLUMN IF NOT EXISTS rating_avg numeric(3, 2),
  ADD COLUMN IF NOT EXISTS sessions_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS expertise_sectors text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS years_experience smallint,
  ADD COLUMN IF NOT EXISTS active_workshop jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'mentor_profiles_rating_avg_chk'
  ) THEN
    ALTER TABLE public.mentor_profiles
      ADD CONSTRAINT mentor_profiles_rating_avg_chk
      CHECK (rating_avg IS NULL OR (rating_avg >= 0 AND rating_avg <= 5));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'mentor_profiles_years_experience_chk'
  ) THEN
    ALTER TABLE public.mentor_profiles
      ADD CONSTRAINT mentor_profiles_years_experience_chk
      CHECK (years_experience IS NULL OR (years_experience >= 0 AND years_experience <= 60));
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.mentor_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  reviewer_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
  body text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mentor_reviews_mentor_created
  ON public.mentor_reviews (mentor_id, created_at DESC);

ALTER TABLE public.mentor_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY mentor_reviews_select_approved_mentors
  ON public.mentor_reviews
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.mentor_profiles mp
      WHERE mp.user_id = mentor_reviews.mentor_id
        AND mp.status = 'approved'
    )
  );

CREATE POLICY mentor_reviews_select_staff
  ON public.mentor_reviews
  FOR SELECT
  TO authenticated
  USING (public.is_privileged_staff());
