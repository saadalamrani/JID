-- Day 9 email outbox — application rejection queue (Section 5.3 bulk reject)

CREATE TABLE IF NOT EXISTS public.email_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed')),
  attempts smallint NOT NULL DEFAULT 0,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_email_outbox_status_created
  ON public.email_outbox (status, created_at)
  WHERE status = 'pending';

ALTER TABLE public.email_outbox ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff manages email outbox" ON public.email_outbox;
CREATE POLICY "Staff manages email outbox"
  ON public.email_outbox
  FOR ALL
  TO authenticated
  USING (public.is_privileged_staff())
  WITH CHECK (public.is_privileged_staff());

DROP POLICY IF EXISTS "Company queues rejection emails" ON public.email_outbox;
CREATE POLICY "Company queues rejection emails"
  ON public.email_outbox
  FOR INSERT
  TO authenticated
  WITH CHECK (
    template = 'application_rejection'
    AND (
      public.is_privileged_staff()
      OR EXISTS (
        SELECT 1
        FROM public.companies c
        WHERE c.claimed_by = auth.uid()
          AND c.entity_state = 'approved'
      )
    )
  );

COMMENT ON TABLE public.email_outbox IS
  'Queued transactional emails — processed by Day 9 worker (pg_cron / edge function).';
