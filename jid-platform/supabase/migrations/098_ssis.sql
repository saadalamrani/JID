-- 098_ssis.sql — Smart Screening Interviews System (Prompt 5)
-- Master doc names 048; 048 is occupied by jobs_applications_database.

-- ===========================================================================
-- Enums
-- ===========================================================================

DO $$
BEGIN
  CREATE TYPE public.ssis_status_enum AS ENUM ('draft', 'pending_approval', 'active', 'closed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE TYPE public.ssis_block_kind_enum AS ENUM ('text', 'scenario');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE TYPE public.ssis_invitation_status_enum AS ENUM ('sent', 'started', 'completed', 'expired');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE TYPE public.ssis_recommendation_enum AS ENUM ('advance', 'review', 'decline_recommend');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

ALTER TYPE public.notification_category_enum ADD VALUE IF NOT EXISTS 'ssis.invitation';
ALTER TYPE public.notification_category_enum ADD VALUE IF NOT EXISTS 'ssis.evaluation_ready';

-- ===========================================================================
-- Tables
-- ===========================================================================

CREATE TABLE IF NOT EXISTS public.ssis_screenings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  status public.ssis_status_enum NOT NULL DEFAULT 'draft',
  generation_context JSONB NOT NULL,
  model_version TEXT,
  pass_threshold NUMERIC(5, 2) NOT NULL DEFAULT 60,
  time_limit_minutes INTEGER NOT NULL DEFAULT 25,
  invitation_validity_days INTEGER NOT NULL DEFAULT 5,
  preview_acknowledged_at TIMESTAMPTZ,
  preview_acknowledged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ssis_screenings_pass_threshold_chk CHECK (pass_threshold >= 0 AND pass_threshold <= 100),
  CONSTRAINT ssis_screenings_time_limit_chk CHECK (time_limit_minutes > 0 AND time_limit_minutes <= 120),
  CONSTRAINT ssis_screenings_invitation_validity_chk CHECK (invitation_validity_days > 0 AND invitation_validity_days <= 30)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ssis_screenings_active_job
  ON public.ssis_screenings (job_id)
  WHERE status IN ('draft', 'pending_approval', 'active');

CREATE INDEX IF NOT EXISTS idx_ssis_screenings_company
  ON public.ssis_screenings (company_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.ssis_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  screening_id UUID NOT NULL REFERENCES public.ssis_screenings(id) ON DELETE CASCADE,
  kind public.ssis_block_kind_enum NOT NULL,
  display_order INTEGER NOT NULL,
  prompt_ar TEXT NOT NULL,
  rubric JSONB NOT NULL,
  ai_generated BOOLEAN NOT NULL DEFAULT true,
  edited_by_human BOOLEAN NOT NULL DEFAULT false,
  max_score NUMERIC(5, 2) NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ssis_blocks_display_order_unique UNIQUE (screening_id, display_order),
  CONSTRAINT ssis_blocks_max_score_chk CHECK (max_score > 0 AND max_score <= 100)
);

CREATE INDEX IF NOT EXISTS idx_ssis_blocks_screening
  ON public.ssis_blocks (screening_id, display_order);

CREATE TABLE IF NOT EXISTS public.ssis_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  screening_id UUID NOT NULL REFERENCES public.ssis_screenings(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  consent_given_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status public.ssis_invitation_status_enum NOT NULL DEFAULT 'sent',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ssis_invitations_screening_application_unique UNIQUE (screening_id, application_id)
);

CREATE INDEX IF NOT EXISTS idx_ssis_invitations_application
  ON public.ssis_invitations (application_id);

CREATE INDEX IF NOT EXISTS idx_ssis_invitations_screening
  ON public.ssis_invitations (screening_id, status);

CREATE TABLE IF NOT EXISTS public.ssis_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID NOT NULL REFERENCES public.ssis_invitations(id) ON DELETE CASCADE,
  block_id UUID NOT NULL REFERENCES public.ssis_blocks(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  purge_after TIMESTAMPTZ,
  CONSTRAINT ssis_responses_invitation_block_unique UNIQUE (invitation_id, block_id)
);

CREATE INDEX IF NOT EXISTS idx_ssis_responses_purge
  ON public.ssis_responses (purge_after)
  WHERE purge_after IS NOT NULL AND answer_text <> '[purged]';

CREATE TABLE IF NOT EXISTS public.ssis_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID NOT NULL REFERENCES public.ssis_invitations(id) ON DELETE CASCADE,
  composite_score NUMERIC(5, 2) NOT NULL,
  per_block JSONB NOT NULL,
  recommendation public.ssis_recommendation_enum NOT NULL,
  model_version TEXT NOT NULL,
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ssis_evaluations_invitation_unique UNIQUE (invitation_id)
);

-- ===========================================================================
-- Access helpers
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.user_can_manage_ssis(p_company_id UUID)
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

CREATE OR REPLACE FUNCTION public.user_owns_ssis_job(p_job_id UUID)
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
-- Dynamic Context assembler (server-side only — never client-supplied)
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.assemble_ssis_generation_context(p_job_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ctx JSONB;
BEGIN
  SELECT jsonb_build_object(
    'company', jsonb_build_object(
      'name_ar', COALESCE(c.name_ar, c.name),
      'name_en', c.name,
      'sector', COALESCE(s.name_ar, s.name_en, ''),
      'ownership', COALESCE(c.ownership_type::text, ''),
      'description_ar', COALESCE(c.description_ar, '')
    ),
    'job', jsonb_build_object(
      'title_ar', j.title_ar,
      'title_en', COALESCE(j.title_en, ''),
      'description_ar', COALESCE(j.description_ar, ''),
      'required_skills', COALESCE(to_jsonb(j.required_skills), '[]'::jsonb),
      'experience_level', COALESCE(j.experience_level::text, ''),
      'region', COALESCE(r.name_ar, r.name_en, '')
    )
  )
  INTO v_ctx
  FROM public.jobs j
  INNER JOIN public.companies c ON c.id = j.company_id
  LEFT JOIN public.sectors s ON s.id = c.sector_id
  LEFT JOIN public.regions r ON r.id = j.region_id
  WHERE j.id = p_job_id;

  IF v_ctx IS NULL THEN
    RAISE EXCEPTION 'job_not_found';
  END IF;

  RETURN v_ctx;
END;
$$;

-- ===========================================================================
-- RPCs — candidate session
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.consent_ssis_invitation(p_invitation_id UUID)
RETURNS public.ssis_invitations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.ssis_invitations;
BEGIN
  SELECT i.*
  INTO v_row
  FROM public.ssis_invitations i
  INNER JOIN public.applications a ON a.id = i.application_id
  WHERE i.id = p_invitation_id
    AND a.applicant_id = auth.uid()
    AND i.status = 'sent'
    AND i.expires_at > NOW();

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'invitation_not_available';
  END IF;

  UPDATE public.ssis_invitations
  SET consent_given_at = NOW()
  WHERE id = p_invitation_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.start_ssis_invitation(p_invitation_id UUID)
RETURNS public.ssis_invitations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.ssis_invitations;
BEGIN
  SELECT i.*
  INTO v_row
  FROM public.ssis_invitations i
  INNER JOIN public.applications a ON a.id = i.application_id
  INNER JOIN public.ssis_screenings s ON s.id = i.screening_id
  WHERE i.id = p_invitation_id
    AND a.applicant_id = auth.uid()
    AND i.consent_given_at IS NOT NULL
    AND i.expires_at > NOW()
    AND s.status = 'active'
    AND i.status IN ('sent', 'started');

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'cannot_start';
  END IF;

  UPDATE public.ssis_invitations
  SET
    status = 'started',
    started_at = COALESCE(started_at, NOW())
  WHERE id = p_invitation_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_ssis_response(
  p_invitation_id UUID,
  p_block_id UUID,
  p_answer_text TEXT
)
RETURNS public.ssis_responses
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inv public.ssis_invitations;
  v_block public.ssis_blocks;
  v_row public.ssis_responses;
BEGIN
  IF length(trim(COALESCE(p_answer_text, ''))) = 0 THEN
    RAISE EXCEPTION 'empty_answer';
  END IF;

  SELECT i.*
  INTO v_inv
  FROM public.ssis_invitations i
  INNER JOIN public.applications a ON a.id = i.application_id
  INNER JOIN public.ssis_screenings s ON s.id = i.screening_id
  WHERE i.id = p_invitation_id
    AND a.applicant_id = auth.uid()
    AND i.consent_given_at IS NOT NULL
    AND i.expires_at > NOW()
    AND s.status = 'active'
    AND i.status IN ('started', 'sent');

  IF v_inv.id IS NULL THEN
    RAISE EXCEPTION 'invitation_not_active';
  END IF;

  SELECT b.*
  INTO v_block
  FROM public.ssis_blocks b
  WHERE b.id = p_block_id
    AND b.screening_id = v_inv.screening_id;

  IF v_block.id IS NULL THEN
    RAISE EXCEPTION 'block_not_found';
  END IF;

  INSERT INTO public.ssis_responses (invitation_id, block_id, answer_text)
  VALUES (p_invitation_id, p_block_id, left(p_answer_text, 12000))
  ON CONFLICT (invitation_id, block_id)
  DO UPDATE SET
    answer_text = EXCLUDED.answer_text,
    updated_at = NOW()
  RETURNING * INTO v_row;

  IF v_inv.status = 'sent' THEN
    UPDATE public.ssis_invitations
    SET status = 'started', started_at = COALESCE(started_at, NOW())
    WHERE id = p_invitation_id;
  END IF;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_ssis_invitation(p_invitation_id UUID)
RETURNS public.ssis_invitations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.ssis_invitations;
  v_block_count INTEGER;
  v_response_count INTEGER;
BEGIN
  SELECT i.*
  INTO v_row
  FROM public.ssis_invitations i
  INNER JOIN public.applications a ON a.id = i.application_id
  WHERE i.id = p_invitation_id
    AND a.applicant_id = auth.uid()
    AND i.consent_given_at IS NOT NULL
    AND i.status = 'started';

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'cannot_complete';
  END IF;

  SELECT count(*) INTO v_block_count
  FROM public.ssis_blocks b
  WHERE b.screening_id = v_row.screening_id;

  SELECT count(*) INTO v_response_count
  FROM public.ssis_responses r
  WHERE r.invitation_id = p_invitation_id
    AND length(trim(r.answer_text)) > 0
    AND r.answer_text <> '[purged]';

  IF v_response_count < v_block_count THEN
    RAISE EXCEPTION 'incomplete_responses';
  END IF;

  UPDATE public.ssis_invitations
  SET status = 'completed', completed_at = NOW()
  WHERE id = p_invitation_id
  RETURNING * INTO v_row;

  PERFORM net.http_post(
    url := coalesce(
      nullif(current_setting('app.settings.supabase_functions_url', true), ''),
      'http://kong:8000'
    ) || '/functions/v1/ssis-evaluate-response',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || coalesce(current_setting('app.settings.service_role_key', true), '')
    ),
    body := jsonb_build_object('invitation_id', p_invitation_id)
  );

  RETURN v_row;
END;
$$;

-- ===========================================================================
-- RPCs — employer workflow
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.acknowledge_ssis_preview(p_screening_id UUID)
RETURNS public.ssis_screenings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.ssis_screenings;
BEGIN
  SELECT s.*
  INTO v_row
  FROM public.ssis_screenings s
  WHERE s.id = p_screening_id
    AND public.user_can_manage_ssis(s.company_id);

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  UPDATE public.ssis_screenings
  SET
    preview_acknowledged_at = NOW(),
    preview_acknowledged_by = auth.uid(),
    updated_at = NOW()
  WHERE id = p_screening_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_ssis_screening(p_screening_id UUID)
RETURNS public.ssis_screenings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.ssis_screenings;
BEGIN
  SELECT s.*
  INTO v_row
  FROM public.ssis_screenings s
  WHERE s.id = p_screening_id
    AND public.user_can_manage_ssis(s.company_id)
    AND s.status IN ('draft', 'pending_approval');

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF v_row.preview_acknowledged_at IS NULL THEN
    RAISE EXCEPTION 'preview_required';
  END IF;

  IF NOT public.company_has_entitlement(v_row.company_id, 'ssis') THEN
    RAISE EXCEPTION 'ssis_entitlement_required';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.ssis_blocks b WHERE b.screening_id = p_screening_id
  ) THEN
    RAISE EXCEPTION 'no_blocks';
  END IF;

  UPDATE public.ssis_screenings
  SET
    status = 'active',
    approved_by = auth.uid(),
    approved_at = NOW(),
    updated_at = NOW()
  WHERE id = p_screening_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.close_ssis_screening(p_screening_id UUID)
RETURNS public.ssis_screenings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.ssis_screenings;
BEGIN
  SELECT s.*
  INTO v_row
  FROM public.ssis_screenings s
  WHERE s.id = p_screening_id
    AND public.user_can_manage_ssis(s.company_id);

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  UPDATE public.ssis_screenings
  SET status = 'closed', updated_at = NOW()
  WHERE id = p_screening_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.invite_ssis_applicants(
  p_screening_id UUID,
  p_application_ids UUID[]
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_screening public.ssis_screenings;
  v_app_id UUID;
  v_count INTEGER := 0;
  v_applicant_id UUID;
  v_job_title_ar TEXT;
  v_job_title_en TEXT;
  v_company_name TEXT;
  v_invitation_id UUID;
  v_has_smart BOOLEAN;
BEGIN
  SELECT s.*
  INTO v_screening
  FROM public.ssis_screenings s
  WHERE s.id = p_screening_id
    AND public.user_can_manage_ssis(s.company_id)
    AND s.status = 'active';

  IF v_screening.id IS NULL THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF NOT public.company_has_entitlement(v_screening.company_id, 'ssis') THEN
    RAISE EXCEPTION 'ssis_entitlement_required';
  END IF;

  SELECT j.title_ar, COALESCE(j.title_en, j.title_ar), COALESCE(c.name_ar, c.name)
  INTO v_job_title_ar, v_job_title_en, v_company_name
  FROM public.jobs j
  INNER JOIN public.companies c ON c.id = j.company_id
  WHERE j.id = v_screening.job_id;

  v_has_smart := public.company_has_entitlement(v_screening.company_id, 'smart_communication');

  FOREACH v_app_id IN ARRAY p_application_ids LOOP
    SELECT a.applicant_id
    INTO v_applicant_id
    FROM public.applications a
    WHERE a.id = v_app_id
      AND a.job_id = v_screening.job_id
      AND a.status NOT IN ('draft', 'withdrawn');

    IF v_applicant_id IS NULL THEN
      CONTINUE;
    END IF;

    INSERT INTO public.ssis_invitations (
      screening_id,
      application_id,
      expires_at,
      status
    )
    VALUES (
      p_screening_id,
      v_app_id,
      NOW() + make_interval(days => v_screening.invitation_validity_days),
      'sent'
    )
    ON CONFLICT (screening_id, application_id) DO NOTHING
    RETURNING id INTO v_invitation_id;

    IF v_invitation_id IS NULL THEN
      CONTINUE;
    END IF;

    v_count := v_count + 1;

    PERFORM public.dispatch_notification(
      v_applicant_id,
      'ssis.invitation'::public.notification_category_enum,
      'دعوة فحص ذكي — جِد',
      'Smart screening invitation — JID',
      format(
        'دعوتك لإكمال فحص أولي لفرصة «%s» لدى %s. المدة المتوقعة: %s دقيقة.',
        v_job_title_ar,
        v_company_name,
        v_screening.time_limit_minutes::text
      ),
      format(
        'You are invited to complete a smart screening for "%s" at %s. Estimated time: %s minutes.',
        COALESCE(v_job_title_en, v_job_title_ar),
        v_company_name,
        v_screening.time_limit_minutes::text
      ),
      'high',
      '/screenings/' || v_invitation_id::text,
      'بدء الفحص',
      'Start screening',
      'ssis_invitation',
      v_invitation_id,
      'ssis_invite:' || v_invitation_id::text,
      jsonb_build_object(
        'screening_id', p_screening_id,
        'application_id', v_app_id,
        'job_id', v_screening.job_id
      )
    );

    IF v_has_smart THEN
      PERFORM public.create_communication_batch(
        v_screening.job_id,
        'interview_invite'::public.comm_kind_enum,
        ARRAY[v_app_id],
        NULL
      );
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_ssis_outcome(
  p_invitation_id UUID,
  p_action TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inv public.ssis_invitations;
  v_new_status public.application_status_enum;
BEGIN
  IF p_action NOT IN ('advance', 'decline') THEN
    RAISE EXCEPTION 'invalid_action';
  END IF;

  SELECT i.*
  INTO v_inv
  FROM public.ssis_invitations i
  INNER JOIN public.ssis_screenings s ON s.id = i.screening_id
  WHERE i.id = p_invitation_id
    AND public.user_can_manage_ssis(s.company_id);

  IF v_inv.id IS NULL THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  v_new_status := CASE WHEN p_action = 'advance' THEN 'shortlisted' ELSE 'rejected' END;

  UPDATE public.applications
  SET
    status = v_new_status,
    last_company_action_at = NOW(),
    updated_at = NOW()
  WHERE id = v_inv.application_id;

  UPDATE public.ssis_responses
  SET purge_after = NOW() + interval '90 days'
  WHERE invitation_id = p_invitation_id
    AND purge_after IS NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.purge_expired_ssis_responses()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.ssis_responses
  SET answer_text = '[purged]', updated_at = NOW()
  WHERE purge_after < NOW()
    AND answer_text <> '[purged]';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ===========================================================================
-- RLS
-- ===========================================================================

ALTER TABLE public.ssis_screenings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ssis_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ssis_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ssis_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ssis_evaluations ENABLE ROW LEVEL SECURITY;

-- screenings
CREATE POLICY ssis_screenings_select
  ON public.ssis_screenings FOR SELECT TO authenticated
  USING (
    public.user_can_manage_ssis(company_id)
    OR public.is_privileged_staff()
  );

CREATE POLICY ssis_screenings_mutate
  ON public.ssis_screenings FOR ALL TO authenticated
  USING (public.user_can_manage_ssis(company_id))
  WITH CHECK (public.user_can_manage_ssis(company_id));

-- blocks
CREATE POLICY ssis_blocks_select_company
  ON public.ssis_blocks FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ssis_screenings s
      WHERE s.id = screening_id
        AND (public.user_can_manage_ssis(s.company_id) OR public.is_privileged_staff())
    )
  );

CREATE POLICY ssis_blocks_select_candidate
  ON public.ssis_blocks FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.ssis_invitations i
      INNER JOIN public.applications a ON a.id = i.application_id
      INNER JOIN public.ssis_screenings s ON s.id = i.screening_id
      WHERE i.screening_id = ssis_blocks.screening_id
        AND a.applicant_id = auth.uid()
        AND i.consent_given_at IS NOT NULL
        AND s.status = 'active'
        AND i.status IN ('started', 'completed')
        AND i.expires_at > NOW()
    )
  );

CREATE POLICY ssis_blocks_mutate
  ON public.ssis_blocks FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ssis_screenings s
      WHERE s.id = screening_id
        AND public.user_can_manage_ssis(s.company_id)
        AND s.status IN ('draft', 'pending_approval')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ssis_screenings s
      WHERE s.id = screening_id
        AND public.user_can_manage_ssis(s.company_id)
        AND s.status IN ('draft', 'pending_approval')
    )
  );

-- invitations
CREATE POLICY ssis_invitations_select
  ON public.ssis_invitations FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = application_id AND a.applicant_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.ssis_screenings s
      WHERE s.id = screening_id
        AND (public.user_can_manage_ssis(s.company_id) OR public.is_privileged_staff())
    )
  );

-- responses: candidate reads own; staff audit; company NEVER direct SELECT
CREATE POLICY ssis_responses_select_candidate
  ON public.ssis_responses FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.ssis_invitations i
      INNER JOIN public.applications a ON a.id = i.application_id
      WHERE i.id = invitation_id AND a.applicant_id = auth.uid()
    )
    OR public.is_privileged_staff()
  );

-- evaluations
CREATE POLICY ssis_evaluations_select
  ON public.ssis_evaluations FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.ssis_invitations i
      INNER JOIN public.applications a ON a.id = i.application_id
      WHERE i.id = invitation_id AND a.applicant_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.ssis_invitations i
      INNER JOIN public.ssis_screenings s ON s.id = i.screening_id
      WHERE i.id = invitation_id
        AND (public.user_can_manage_ssis(s.company_id) OR public.is_privileged_staff())
    )
  );

-- ===========================================================================
-- Grants
-- ===========================================================================

REVOKE ALL ON FUNCTION public.assemble_ssis_generation_context(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assemble_ssis_generation_context(UUID) TO service_role;

REVOKE ALL ON FUNCTION public.consent_ssis_invitation(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consent_ssis_invitation(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.start_ssis_invitation(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.start_ssis_invitation(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.submit_ssis_response(UUID, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_ssis_response(UUID, UUID, TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.complete_ssis_invitation(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_ssis_invitation(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.acknowledge_ssis_preview(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.acknowledge_ssis_preview(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.approve_ssis_screening(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_ssis_screening(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.close_ssis_screening(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.close_ssis_screening(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.invite_ssis_applicants(UUID, UUID[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.invite_ssis_applicants(UUID, UUID[]) TO authenticated;

REVOKE ALL ON FUNCTION public.record_ssis_outcome(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_ssis_outcome(UUID, TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.purge_expired_ssis_responses() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purge_expired_ssis_responses() TO service_role;

REVOKE ALL ON FUNCTION public.user_can_manage_ssis(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_can_manage_ssis(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.user_owns_ssis_job(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_owns_ssis_job(UUID) TO authenticated;

-- ===========================================================================
-- Retention cron — purge answer_text after purge_after
-- ===========================================================================

SELECT cron.schedule(
  'purge-ssis-responses',
  '0 4 * * *',
  $$SELECT public.purge_expired_ssis_responses();$$
);

COMMENT ON TABLE public.ssis_screenings IS
  'SSIS screenings — AI drafts with frozen generation_context; human approval required before active.';
