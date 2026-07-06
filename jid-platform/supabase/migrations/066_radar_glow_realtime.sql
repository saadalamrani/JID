-- Section 7.6 / 10 — glow metadata, status change tracking, realtime payloads

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS status_changed_at timestamptz,
  ADD COLUMN IF NOT EXISTS status_changed_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL;

-- Backfill from company action timestamps where available
UPDATE public.applications
SET
  status_changed_at = coalesce(last_company_action_at, updated_at),
  status_changed_by = NULL
WHERE status_changed_at IS NULL
  AND last_company_action_at IS NOT NULL;

CREATE OR REPLACE FUNCTION public.sync_application_status_metadata()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.status_changed_at := now();
    NEW.status_changed_by := auth.uid();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_application_status_metadata ON public.applications;

CREATE TRIGGER trg_sync_application_status_metadata
  BEFORE UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_application_status_metadata();

-- Realtime: include old row values for status diff toasts (Section 10)
ALTER TABLE public.applications REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'mentorship_meetings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.mentorship_meetings;
  END IF;
END;
$$;
