-- Section 7.3 — staff claims queue realtime (INSERT + status UPDATE payloads)

ALTER TABLE public.claim_requests REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'claim_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.claim_requests;
  END IF;
END $$;
