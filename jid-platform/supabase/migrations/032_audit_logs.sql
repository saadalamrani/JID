-- Immutable audit trail for sensitive actions
-- Section 11 Step 1

CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_actor_id ON public.audit_logs (actor_id);

CREATE INDEX idx_audit_logs_entity ON public.audit_logs (entity_type, entity_id);

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs (created_at DESC);

CREATE OR REPLACE FUNCTION public.prevent_audit_modification()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs records are immutable';
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_logs_prevent_update ON public.audit_logs;
DROP TRIGGER IF EXISTS trg_audit_logs_prevent_delete ON public.audit_logs;

CREATE TRIGGER trg_audit_logs_prevent_update
  BEFORE UPDATE ON public.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_audit_modification();

CREATE TRIGGER trg_audit_logs_prevent_delete
  BEFORE DELETE ON public.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_audit_modification();
