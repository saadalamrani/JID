-- 094_smart_communication.sql — Smart Automated Communication System (Prompt 4)
-- Prerequisite: monetization foundation (subscriptions, plan_entitlements, company_has_entitlement RPC).
-- Note: master doc names this 047; 047 is taken by catalog_claim_link_auditor.

-- ===========================================================================
-- Enums
-- ===========================================================================

DO $$
BEGIN
  CREATE TYPE public.comm_kind_enum AS ENUM (
    'received_ack',
    'shortlisted',
    'interview_invite',
    'acceptance',
    'rejection',
    'holding_update'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE TYPE public.comm_batch_status_enum AS ENUM (
    'pending_confirmation',
    'scheduled',
    'sending',
    'sent',
    'canceled',
    'failed'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

-- ===========================================================================
-- Tables
-- ===========================================================================

CREATE TABLE IF NOT EXISTS public.communication_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  kind public.comm_kind_enum NOT NULL,
  subject_ar TEXT NOT NULL,
  body_ar TEXT NOT NULL,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, kind)
);

CREATE INDEX IF NOT EXISTS idx_communication_templates_company
  ON public.communication_templates (company_id);

CREATE TABLE IF NOT EXISTS public.communication_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  kind public.comm_kind_enum NOT NULL,
  recipient_application_ids UUID[] NOT NULL,
  recipient_count INTEGER NOT NULL,
  template_snapshot JSONB NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  status public.comm_batch_status_enum NOT NULL DEFAULT 'pending_confirmation',
  scheduled_send_at TIMESTAMPTZ,
  sent_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  canceled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT communication_batches_recipient_count_chk CHECK (recipient_count = cardinality(recipient_application_ids)),
  CONSTRAINT communication_batches_recipient_count_positive_chk CHECK (recipient_count > 0)
);

CREATE INDEX IF NOT EXISTS idx_communication_batches_job
  ON public.communication_batches (job_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_communication_batches_due
  ON public.communication_batches (scheduled_send_at)
  WHERE status = 'scheduled';

CREATE TABLE IF NOT EXISTS public.communication_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES public.communication_batches(id) ON DELETE SET NULL,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  kind public.comm_kind_enum NOT NULL,
  channel TEXT NOT NULL DEFAULT 'email',
  provider_message_id TEXT,
  status TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT communication_log_status_chk CHECK (status IN ('sent', 'failed', 'bounced'))
);

CREATE INDEX IF NOT EXISTS idx_communication_log_application
  ON public.communication_log (application_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_communication_log_batch
  ON public.communication_log (batch_id);

-- ===========================================================================
-- Immutability — communication_log append-only
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.prevent_communication_log_modification()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'communication_log records are immutable';
END;
$$;

DROP TRIGGER IF EXISTS trg_communication_log_prevent_update ON public.communication_log;
DROP TRIGGER IF EXISTS trg_communication_log_prevent_delete ON public.communication_log;

CREATE TRIGGER trg_communication_log_prevent_update
  BEFORE UPDATE ON public.communication_log
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_communication_log_modification();

CREATE TRIGGER trg_communication_log_prevent_delete
  BEFORE DELETE ON public.communication_log
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_communication_log_modification();

-- ===========================================================================
-- Locked rejection templates — body edits blocked at DB layer
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.prevent_locked_comm_template_body_edit()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.is_locked AND (NEW.body_ar IS DISTINCT FROM OLD.body_ar OR NEW.subject_ar IS DISTINCT FROM OLD.subject_ar) THEN
    RAISE EXCEPTION 'rejection template body is locked — variant selection only';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_comm_template_locked_body ON public.communication_templates;

CREATE TRIGGER trg_comm_template_locked_body
  BEFORE UPDATE ON public.communication_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_locked_comm_template_body_edit();

-- ===========================================================================
-- Access helpers
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.user_can_manage_company_communication(p_company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.companies c
    WHERE c.id = p_company_id
      AND c.claimed_by = auth.uid()
      AND c.entity_state = 'approved'
  )
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('staff', 'super_admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.user_owns_job_for_communication(p_job_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.jobs j
    INNER JOIN public.companies c ON c.id = j.company_id
    WHERE j.id = p_job_id
      AND c.claimed_by = auth.uid()
      AND c.entity_state = 'approved'
  )
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('staff', 'super_admin')
  );
$$;

-- ===========================================================================
-- Seed default templates for a company (idempotent)
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.ensure_communication_templates(p_company_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.user_can_manage_company_communication(p_company_id) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  INSERT INTO public.communication_templates (company_id, kind, subject_ar, body_ar, is_locked)
  VALUES
    (
      p_company_id,
      'shortlisted',
      'تحديث على طلبك — جِد',
      E'مرحباً {candidate_name}،\n\nيسرّنا إبلاغك بأن طلبك لفرصة «{job_title}» لدى {company_name} أصبح ضمن القائمة المختصرة.\n\nسنتواصل معك قريباً بشأن الخطوات التالية.\n\nمع أطيب التمنيات،\n{company_name}',
      false
    ),
    (
      p_company_id,
      'interview_invite',
      'دعوة مقابلة — جِد',
      E'مرحباً {candidate_name}،\n\nنودّ دعوتك لمقابلة بخصوص فرصة «{job_title}» لدى {company_name}.\n\nالخطوة التالية: {next_step}\nالجدول الزمني: {timeline}\n\nنتطلع للقائك.\n\n{company_name}',
      false
    ),
    (
      p_company_id,
      'acceptance',
      'تهانينا — جِد',
      E'مرحباً {candidate_name}،\n\nيسعدنا إبلاغك بقبولك لفرصة «{job_title}» لدى {company_name}.\n\nسيتواصل معك فريقنا قريباً لاستكمال الإجراءات.\n\nمع التهاني،\n{company_name}',
      false
    ),
    (
      p_company_id,
      'rejection',
      'تحديث على طلبك — جِد',
      E'مرحباً {candidate_name}،\n\nنشكرك على تقديمك لفرصة «{job_title}» لدى {company_name}.\n\nبعد مراجعة طلبك، نأسف لإبلاغك بعدم قبول طلبك في هذه المرحلة.\n\nيمكنك متابعة فرص أخرى على منصة جِد.\n\nمع أطيب التمنيات،\n{company_name}',
      true
    ),
    (
      p_company_id,
      'holding_update',
      'تحديث على طلبك — جِد',
      E'مرحباً {candidate_name}،\n\nنودّ إبلاغك بأن طلبك لفرصة «{job_title}» لدى {company_name} لا يزال قيد المراجعة.\n\nنقدّر صبرك وسنوافيك بأي مستجدات.\n\n{company_name}',
      false
    )
  ON CONFLICT (company_id, kind) DO NOTHING;
END;
$$;

-- ===========================================================================
-- Excluded recipients (already notified or queued)
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.comm_excluded_application_ids(
  p_job_id UUID,
  p_kind public.comm_kind_enum
)
RETURNS UUID[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(DISTINCT x.application_id), '{}'::uuid[])
  FROM (
    SELECT cl.application_id
    FROM public.communication_log cl
    INNER JOIN public.communication_batches cb ON cb.id = cl.batch_id
    WHERE cb.job_id = p_job_id
      AND cl.kind = p_kind
      AND cl.status = 'sent'
    UNION
    SELECT unnest(cb.recipient_application_ids) AS application_id
    FROM public.communication_batches cb
    WHERE cb.job_id = p_job_id
      AND cb.kind = p_kind
      AND cb.status IN ('pending_confirmation', 'scheduled', 'sending')
  ) x;
$$;

-- ===========================================================================
-- Cascade computation (complement sets)
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.compute_cascade_suggestion(p_job_id UUID)
RETURNS TABLE (
  suggestion_kind public.comm_kind_enum,
  target_status public.application_status_enum,
  recipient_ids UUID[],
  recipient_count INTEGER
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
  v_has_advanced BOOLEAN;
  v_has_shortlisted BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  IF NOT public.user_owns_job_for_communication(p_job_id) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT j.company_id INTO v_company_id
  FROM public.jobs j
  WHERE j.id = p_job_id;

  IF v_company_id IS NULL THEN
    RETURN;
  END IF;

  IF NOT public.company_has_entitlement(v_company_id, 'smart_communication') THEN
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.job_id = p_job_id AND a.status IN ('shortlisted', 'invited')
  ) INTO v_has_advanced;

  SELECT EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.job_id = p_job_id AND a.status = 'shortlisted'
  ) INTO v_has_shortlisted;

  -- Rejection complement: still waiting while others advanced
  IF v_has_advanced THEN
    RETURN QUERY
    SELECT
      'rejection'::public.comm_kind_enum,
      'under_review'::public.application_status_enum,
      array_agg(a.id ORDER BY a.submitted_at NULLS LAST),
      COUNT(*)::INTEGER
    FROM public.applications a
    WHERE a.job_id = p_job_id
      AND a.status IN ('pending', 'submitted', 'under_review')
      AND NOT (a.id = ANY(public.comm_excluded_application_ids(p_job_id, 'rejection')))
    HAVING COUNT(*) > 0;
  END IF;

  -- Acceptance for shortlisted not yet notified
  RETURN QUERY
  SELECT
    'acceptance'::public.comm_kind_enum,
    'shortlisted'::public.application_status_enum,
    array_agg(a.id ORDER BY a.last_company_action_at DESC NULLS LAST),
    COUNT(*)::INTEGER
  FROM public.applications a
  WHERE a.job_id = p_job_id
    AND a.status = 'shortlisted'
    AND NOT (a.id = ANY(public.comm_excluded_application_ids(p_job_id, 'acceptance')))
  HAVING COUNT(*) > 0;

  -- Interview invite for invited not yet notified
  RETURN QUERY
  SELECT
    'interview_invite'::public.comm_kind_enum,
    'invited'::public.application_status_enum,
    array_agg(a.id ORDER BY a.last_company_action_at DESC NULLS LAST),
    COUNT(*)::INTEGER
  FROM public.applications a
  WHERE a.job_id = p_job_id
    AND a.status = 'invited'
    AND NOT (a.id = ANY(public.comm_excluded_application_ids(p_job_id, 'interview_invite')))
  HAVING COUNT(*) > 0;

  -- Holding update: invited still waiting while shortlisted cohort exists
  IF v_has_shortlisted THEN
    RETURN QUERY
    SELECT
      'holding_update'::public.comm_kind_enum,
      'invited'::public.application_status_enum,
      array_agg(a.id ORDER BY a.last_company_action_at DESC NULLS LAST),
      COUNT(*)::INTEGER
    FROM public.applications a
    WHERE a.job_id = p_job_id
      AND a.status = 'invited'
      AND NOT (a.id = ANY(public.comm_excluded_application_ids(p_job_id, 'holding_update')))
      AND (a.id = ANY(public.comm_excluded_application_ids(p_job_id, 'interview_invite')))
    HAVING COUNT(*) > 0;
  END IF;
END;
$$;

-- ===========================================================================
-- Public disclaimer boolean (minimal subscription exposure)
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.job_auto_reply_enabled(p_job_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT public.company_has_entitlement(j.company_id, 'smart_communication')
      FROM public.jobs j
      WHERE j.id = p_job_id
    ),
    false
  );
$$;

GRANT EXECUTE ON FUNCTION public.job_auto_reply_enabled(UUID) TO anon, authenticated;

-- ===========================================================================
-- Batch lifecycle — strict 15-minute undo window
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.create_communication_batch(
  p_job_id UUID,
  p_kind public.comm_kind_enum,
  p_recipient_ids UUID[],
  p_template_snapshot JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
  v_batch_id UUID;
  v_template RECORD;
  v_snapshot JSONB;
  v_recipient_ids UUID[];
  v_count INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  IF p_kind = 'received_ack' THEN
    RAISE EXCEPTION 'received_ack is platform-managed';
  END IF;

  IF NOT public.user_owns_job_for_communication(p_job_id) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT j.company_id INTO v_company_id
  FROM public.jobs j
  WHERE j.id = p_job_id;

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'job_not_found';
  END IF;

  IF NOT public.company_has_entitlement(v_company_id, 'smart_communication') THEN
    RAISE EXCEPTION 'subscription_required';
  END IF;

  PERFORM public.ensure_communication_templates(v_company_id);

  SELECT array_agg(DISTINCT a.id ORDER BY a.id)
  INTO v_recipient_ids
  FROM public.applications a
  WHERE a.job_id = p_job_id
    AND a.id = ANY(p_recipient_ids);

  v_count := COALESCE(cardinality(v_recipient_ids), 0);
  IF v_count = 0 THEN
    RAISE EXCEPTION 'no_recipients';
  END IF;

  IF p_template_snapshot IS NOT NULL THEN
    v_snapshot := p_template_snapshot;
  ELSE
    SELECT t.subject_ar, t.body_ar, t.kind
    INTO v_template
    FROM public.communication_templates t
    WHERE t.company_id = v_company_id
      AND t.kind = p_kind;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'template_not_found';
    END IF;

    v_snapshot := jsonb_build_object(
      'kind', p_kind,
      'subject_ar', v_template.subject_ar,
      'body_ar', v_template.body_ar
    );
  END IF;

  INSERT INTO public.communication_batches (
    company_id,
    job_id,
    kind,
    recipient_application_ids,
    recipient_count,
    template_snapshot,
    created_by,
    status,
    scheduled_send_at
  )
  VALUES (
    v_company_id,
    p_job_id,
    p_kind,
    v_recipient_ids,
    v_count,
    v_snapshot,
    auth.uid(),
    'scheduled',
    NOW() + INTERVAL '15 minutes'
  )
  RETURNING id INTO v_batch_id;

  RETURN v_batch_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_communication_batch(p_batch_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_batch public.communication_batches%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  SELECT * INTO v_batch
  FROM public.communication_batches
  WHERE id = p_batch_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'batch_not_found';
  END IF;

  IF NOT public.user_can_manage_company_communication(v_batch.company_id) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF v_batch.status <> 'scheduled' THEN
    RAISE EXCEPTION 'batch_not_cancelable';
  END IF;

  IF v_batch.scheduled_send_at IS NULL OR NOW() >= v_batch.scheduled_send_at THEN
    RAISE EXCEPTION 'undo_window_expired';
  END IF;

  UPDATE public.communication_batches
  SET
    status = 'canceled',
    canceled_by = auth.uid()
  WHERE id = p_batch_id;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_due_communication_batches(p_limit INTEGER DEFAULT 10)
RETURNS SETOF public.communication_batches
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH due AS (
    SELECT cb.id
    FROM public.communication_batches cb
    WHERE cb.status = 'scheduled'
      AND cb.scheduled_send_at IS NOT NULL
      AND cb.scheduled_send_at <= NOW()
    ORDER BY cb.scheduled_send_at ASC
    LIMIT GREATEST(p_limit, 1)
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.communication_batches cb
  SET status = 'sending'
  FROM due
  WHERE cb.id = due.id
  RETURNING cb.*;
END;
$$;

CREATE OR REPLACE FUNCTION public.finalize_communication_batch(
  p_batch_id UUID,
  p_sent_count INTEGER,
  p_failed_count INTEGER,
  p_status public.comm_batch_status_enum
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.communication_batches
  SET
    sent_count = GREATEST(p_sent_count, 0),
    failed_count = GREATEST(p_failed_count, 0),
    status = p_status
  WHERE id = p_batch_id;
END;
$$;

-- ===========================================================================
-- RLS
-- ===========================================================================

ALTER TABLE public.communication_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS communication_templates_company_rw ON public.communication_templates;
CREATE POLICY communication_templates_company_rw
  ON public.communication_templates
  FOR ALL
  USING (public.user_can_manage_company_communication(company_id))
  WITH CHECK (public.user_can_manage_company_communication(company_id));

DROP POLICY IF EXISTS communication_templates_staff_read ON public.communication_templates;
CREATE POLICY communication_templates_staff_read
  ON public.communication_templates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('staff', 'super_admin')
    )
  );

DROP POLICY IF EXISTS communication_batches_company_read ON public.communication_batches;
CREATE POLICY communication_batches_company_read
  ON public.communication_batches
  FOR SELECT
  USING (public.user_can_manage_company_communication(company_id));

DROP POLICY IF EXISTS communication_batches_staff_read ON public.communication_batches;
CREATE POLICY communication_batches_staff_read
  ON public.communication_batches
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('staff', 'super_admin')
    )
  );

DROP POLICY IF EXISTS communication_log_company_read ON public.communication_log;
CREATE POLICY communication_log_company_read
  ON public.communication_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.applications a
      INNER JOIN public.jobs j ON j.id = a.job_id
      WHERE a.id = communication_log.application_id
        AND public.user_can_manage_company_communication(j.company_id)
    )
  );

DROP POLICY IF EXISTS communication_log_candidate_read ON public.communication_log;
CREATE POLICY communication_log_candidate_read
  ON public.communication_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.applications a
      WHERE a.id = communication_log.application_id
        AND a.applicant_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS communication_log_staff_read ON public.communication_log;
CREATE POLICY communication_log_staff_read
  ON public.communication_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('staff', 'super_admin')
    )
  );

-- No direct INSERT/UPDATE on batches or log — SECURITY DEFINER functions / service role only.

GRANT EXECUTE ON FUNCTION public.compute_cascade_suggestion(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_communication_batch(UUID, public.comm_kind_enum, UUID[], JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_communication_batch(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_communication_templates(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_due_communication_batches(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.finalize_communication_batch(UUID, INTEGER, INTEGER, public.comm_batch_status_enum) TO service_role;

COMMENT ON TABLE public.communication_batches IS
  'Employer communication batches — 15-minute undo window enforced via scheduled_send_at + cancel_communication_batch.';

-- Drain due communication batches every 5 minutes (Prompt 4)
SELECT cron.schedule(
  'process-communication-batches',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := coalesce(
      nullif(current_setting('app.settings.supabase_functions_url', true), ''),
      'http://kong:8000'
    ) || '/functions/v1/process-communication-batches',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || coalesce(current_setting('app.settings.service_role_key', true), '')
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
