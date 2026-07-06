-- Section 4.3 — Mentor discovery filters + cold-start notification requests

ALTER TABLE public.mentor_profiles
  ADD COLUMN IF NOT EXISTS nationality text,
  ADD COLUMN IF NOT EXISTS specializations text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.mentor_notification_requests
  ADD COLUMN IF NOT EXISTS desired_filters jsonb;

ALTER TABLE public.mentor_notification_requests
  ALTER COLUMN mentor_id DROP NOT NULL;
