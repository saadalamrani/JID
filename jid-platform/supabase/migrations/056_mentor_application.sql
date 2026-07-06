-- Section 4.2 — Mentor application flow (mentor_profiles only, not claim_requests)

ALTER TABLE public.mentor_profiles
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS expertise_areas text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS languages text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS preferred_mediums text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS linkedin_url text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mentor_profiles_slug
  ON public.mentor_profiles (slug)
  WHERE slug IS NOT NULL;

ALTER TABLE public.mentor_profiles
  DROP CONSTRAINT IF EXISTS mentor_profiles_status_check;

ALTER TABLE public.mentor_profiles
  ADD CONSTRAINT mentor_profiles_status_check
  CHECK (
    status IN (
      'pending',
      'pending_review',
      'under_review',
      'approved',
      'rejected',
      'suspended'
    )
  );

ALTER TABLE public.mentor_profiles
  DROP CONSTRAINT IF EXISTS mentor_profiles_expertise_areas_max;

ALTER TABLE public.mentor_profiles
  ADD CONSTRAINT mentor_profiles_expertise_areas_max
  CHECK (cardinality(expertise_areas) <= 5);

-- Section 4.2 Day 1 — users may only INSERT their own application as pending_review
DROP POLICY IF EXISTS mentor_profiles_insert_own ON public.mentor_profiles;

CREATE POLICY mentor_profiles_insert_own
  ON public.mentor_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'pending_review');

-- Owners cannot self-approve; rejected mentors may re-apply (status -> pending_review)
DROP POLICY IF EXISTS mentor_profiles_update_own ON public.mentor_profiles;

CREATE POLICY mentor_profiles_update_own
  ON public.mentor_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND (
      status = (
        SELECT mp.status
        FROM public.mentor_profiles mp
        WHERE mp.user_id = auth.uid()
      )
      OR (
        status = 'pending_review'
        AND (
          SELECT mp.status
          FROM public.mentor_profiles mp
          WHERE mp.user_id = auth.uid()
        ) = 'rejected'
      )
    )
  );
