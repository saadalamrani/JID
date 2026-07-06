-- Section 4.9 / 4.10 — Mentor hub: decline tracking + conversation uniqueness

ALTER TABLE public.mentor_profiles
  ADD COLUMN IF NOT EXISTS declined_requests_count integer NOT NULL DEFAULT 0;

ALTER TABLE public.mentorship_requests
  ADD COLUMN IF NOT EXISTS decline_reason text,
  ADD COLUMN IF NOT EXISTS preferred_medium text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_mentor_mentee_unique
  ON public.conversations (mentor_id, mentee_id);
