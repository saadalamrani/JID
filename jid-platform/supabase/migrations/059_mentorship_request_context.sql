-- Section 4.8 — context-rich mentorship requests (immutable mentee snapshot + intent)

ALTER TABLE public.mentorship_requests
  ADD COLUMN IF NOT EXISTS intent_statement text,
  ADD COLUMN IF NOT EXISTS mentee_snapshot jsonb;

ALTER TABLE public.mentorship_requests
  DROP CONSTRAINT IF EXISTS mentorship_requests_intent_min_len_chk;

ALTER TABLE public.mentorship_requests
  ADD CONSTRAINT mentorship_requests_intent_min_len_chk
  CHECK (
    intent_statement IS NULL
    OR char_length(trim(intent_statement)) >= 50
  );

CREATE INDEX IF NOT EXISTS idx_mentorship_requests_mentor_pending_created
  ON public.mentorship_requests (mentor_id, created_at DESC)
  WHERE status = 'pending';
