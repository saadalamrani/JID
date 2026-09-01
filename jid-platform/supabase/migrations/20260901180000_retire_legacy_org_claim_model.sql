-- Post-wave: retire live organization-ownership claim architecture.
-- Directory remains platform-owned. Authority is owned profile + governed verification.
-- Nonprod only. DATA_LOSS=0. AUTHORITY_LOSS=0. AUTHORITY_EXPANSION=0.

CREATE SCHEMA IF NOT EXISTS private;

-- ---------------------------------------------------------------------------
-- 0. Prove the two approved Directory rows already have canonical authority
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  v_missing integer;
BEGIN
  SELECT count(*)::integer
  INTO v_missing
  FROM public.companies c
  WHERE c.entity_state = 'approved'
    AND NOT (
      (
        EXISTS (
          SELECT 1 FROM public.business_profiles bp
          WHERE bp.directory_id = c.id AND bp.owner_user_id IS NOT NULL
        )
        AND EXISTS (
          SELECT 1 FROM public.verification_requests vr
          WHERE vr.directory_id = c.id AND vr.status = 'approved'
        )
      )
      OR (
        EXISTS (
          SELECT 1 FROM public.university_profiles up
          WHERE up.directory_id = c.id AND up.owner_user_id IS NOT NULL
        )
        AND EXISTS (
          SELECT 1 FROM public.verification_requests vr
          WHERE vr.directory_id = c.id AND vr.status = 'approved'
        )
      )
    );

  IF v_missing > 0 THEN
    RAISE EXCEPTION 'AUTHORITY_PROOF_FAILED: % approved entity_state row(s) lack owned profile + approved verification', v_missing;
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- 1. Canonical workspace-ownership helper (never Directory claimed_by)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.user_owns_directory_workspace(p_directory_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = off
AS $$
  SELECT
    p_directory_id IS NOT NULL
    AND (
      EXISTS (
        SELECT 1
        FROM public.business_profiles bp
        WHERE bp.directory_id = p_directory_id
          AND bp.owner_user_id = (SELECT auth.uid())
          AND bp.status IS DISTINCT FROM 'suspended'
      )
      OR EXISTS (
        SELECT 1
        FROM public.university_profiles up
        WHERE up.directory_id = p_directory_id
          AND up.owner_user_id = (SELECT auth.uid())
          AND up.status IS DISTINCT FROM 'suspended'
      )
    );
$$;

CREATE OR REPLACE FUNCTION private.user_owns_job_workspace(p_job_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.jobs j
    JOIN public.business_profiles bp ON bp.id = j.business_profile_id
    WHERE j.id = p_job_id
      AND bp.owner_user_id = (SELECT auth.uid())
      AND bp.status IS DISTINCT FROM 'suspended'
  );
$$;

REVOKE ALL ON FUNCTION private.user_owns_directory_workspace(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.user_owns_job_workspace(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.user_owns_directory_workspace(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.user_owns_job_workspace(uuid) TO authenticated;

COMMENT ON FUNCTION private.user_owns_directory_workspace(uuid) IS
  'True when the viewer owns a non-suspended business_profiles or university_profiles row for this Directory id.';
COMMENT ON FUNCTION private.user_owns_job_workspace(uuid) IS
  'True when the viewer owns the business_profiles row that anchors the job.';

-- ---------------------------------------------------------------------------
-- 2. Replace live functions that still authorized via claimed_by / entity_state
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.can_read_individual_profile(p_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private, pg_temp
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = p_profile_id
      AND p.role = 'individual'
      AND p.deleted_at IS NULL
      AND p.suspended_at IS NULL
      AND p.profile_state = 'active'
      AND (
        p.id = (SELECT auth.uid())
        OR public.is_privileged_staff()
        OR p.visibility = 'public'
        OR (
          p.visibility = 'discoverable'
          AND (SELECT auth.uid()) IS NOT NULL
          AND EXISTS (
            SELECT 1
            FROM public.mentor_profiles mp
            WHERE mp.user_id = (SELECT auth.uid())
              AND mp.status = 'approved'
          )
        )
        OR (
          (SELECT auth.uid()) IS NOT NULL
          AND EXISTS (
            SELECT 1
            FROM public.applications a
            JOIN public.jobs j ON j.id = a.job_id
            JOIN public.business_profiles bp ON bp.id = j.business_profile_id
            WHERE a.applicant_id = p.id
              AND bp.owner_user_id = (SELECT auth.uid())
              AND bp.status IN ('draft', 'published')
          )
        )
      )
  );
$$;

CREATE OR REPLACE FUNCTION private.business_can_select_applicant_profile(p_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private, pg_temp
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = p_profile_id
      AND p.role = 'individual'
      AND p.deleted_at IS NULL
      AND EXISTS (
        SELECT 1
        FROM public.applications a
        JOIN public.jobs j ON j.id = a.job_id
        JOIN public.business_profiles bp ON bp.id = j.business_profile_id
        WHERE a.applicant_id = p.id
          AND bp.owner_user_id = (SELECT auth.uid())
          AND bp.status IN ('draft', 'published')
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.is_verified_hiring_employer(p_business_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.business_profiles bp
    JOIN public.companies c ON c.id = bp.directory_id
    WHERE bp.id = p_business_profile_id
      AND bp.status IS DISTINCT FROM 'suspended'
      AND c.is_verified IS TRUE
  );
$$;

CREATE OR REPLACE FUNCTION public.user_can_manage_company_communication(p_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private
AS $$
  SELECT private.user_owns_directory_workspace(p_company_id)
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('staff', 'super_admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.user_owns_job_for_communication(p_job_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private
AS $$
  SELECT private.user_owns_job_workspace(p_job_id)
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('staff', 'super_admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.user_can_manage_ssis(p_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private
AS $$
  SELECT private.user_owns_directory_workspace(p_company_id)
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('staff', 'super_admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.user_owns_ssis_job(p_job_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private
AS $$
  SELECT private.user_owns_job_workspace(p_job_id)
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('staff', 'super_admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.toggle_job_boost(p_job_id uuid, p_enable boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  v_company_id uuid;
  v_deadline timestamptz;
  v_quota integer;
  v_active integer;
  v_is_staff boolean;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required'; END IF;

  SELECT j.company_id, j.application_deadline
  INTO v_company_id, v_deadline
  FROM public.jobs j
  WHERE j.id = p_job_id
    AND j.status IN ('published', 'closing_soon');

  IF v_company_id IS NULL THEN RAISE EXCEPTION 'job_not_boostable'; END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('staff', 'super_admin')
  ) INTO v_is_staff;

  IF NOT v_is_staff AND NOT private.user_owns_job_workspace(p_job_id) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF NOT public.company_has_entitlement(v_company_id, 'priority_visibility') THEN
    RAISE EXCEPTION 'subscription_required';
  END IF;

  IF p_enable THEN
    SELECT pe.quota INTO v_quota
    FROM public.subscriptions s
    JOIN public.plan_entitlements pe ON pe.plan_id = s.plan_id AND pe.feature_key = 'priority_visibility'
    WHERE s.company_id = v_company_id
      AND s.subscriber_type = 'company'
      AND s.status IN ('active', 'trialing')
      AND s.current_period_end > now()
    ORDER BY s.current_period_end DESC
    LIMIT 1;

    SELECT count(*)::integer INTO v_active
    FROM public.jobs j
    WHERE j.company_id = v_company_id
      AND j.is_boosted = true
      AND j.boost_ends_at > now();

    IF v_active >= COALESCE(v_quota, 0) THEN
      RAISE EXCEPTION 'boost_quota_exceeded';
    END IF;

    UPDATE public.jobs
    SET
      is_boosted = true,
      boost_starts_at = now(),
      boost_ends_at = LEAST(v_deadline, now() + interval '30 days'),
      updated_at = now()
    WHERE id = p_job_id;
  ELSE
    UPDATE public.jobs
    SET
      is_boosted = false,
      boost_ends_at = now(),
      updated_at = now()
    WHERE id = p_job_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_company_badges()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company record;
BEGIN
  FOR v_company IN
    SELECT id, avg_response_days, response_rate_pct, is_verified, is_on_honor_roll
    FROM public.companies
    WHERE entity_type = 'company'
  LOOP
    IF coalesce(v_company.avg_response_days, 999) <= 3
       AND coalesce(v_company.response_rate_pct, 0) >= 90 THEN
      PERFORM public.award_entity_badge(
        'company',
        v_company.id,
        'quick_responder',
        jsonb_build_object(
          'avg_response_days', v_company.avg_response_days,
          'response_rate_pct', v_company.response_rate_pct
        )
      );
    ELSE
      PERFORM public.remove_entity_badge('company', v_company.id, 'quick_responder');
    END IF;

    IF v_company.is_verified THEN
      PERFORM public.award_entity_badge(
        'company',
        v_company.id,
        'verified_entity',
        jsonb_build_object('is_verified', true)
      );
    ELSE
      PERFORM public.remove_entity_badge('company', v_company.id, 'verified_entity');
    END IF;

    IF v_company.is_on_honor_roll THEN
      PERFORM public.award_entity_badge('company', v_company.id, 'honor_roll', '{}'::jsonb);
    ELSE
      PERFORM public.remove_entity_badge('company', v_company.id, 'honor_roll');
    END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_directory_for_verification(
  p_verification_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id uuid := auth.uid();
  v_caller_role public.user_role_enum;
  v_req public.verification_requests%ROWTYPE;
  v_directory_id uuid;
  v_name text;
  v_name_ar text;
  v_domains text[];
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT role INTO v_caller_role FROM public.profiles WHERE id = v_actor_id;
  IF v_caller_role NOT IN ('staff', 'super_admin') THEN
    RAISE EXCEPTION 'insufficient_privileges';
  END IF;

  SELECT * INTO v_req
  FROM public.verification_requests
  WHERE id = p_verification_id
  FOR UPDATE;

  IF v_req.id IS NULL THEN
    RAISE EXCEPTION 'invalid_or_already_reviewed';
  END IF;

  IF v_req.status NOT IN ('pending', 'submitted', 'pending_review', 'under_review', 'needs_more_info') THEN
    RAISE EXCEPTION 'invalid_or_already_reviewed';
  END IF;

  IF v_req.directory_id IS NOT NULL THEN
    RAISE EXCEPTION 'directory_already_linked';
  END IF;

  v_name := NULLIF(trim(COALESCE(v_req.submitted_name_en, v_req.company_name, '')), '');
  v_name_ar := NULLIF(trim(COALESCE(v_req.submitted_name_ar, '')), '');
  IF v_name IS NULL THEN
    RAISE EXCEPTION 'submitted_organization_name_required';
  END IF;

  v_domains := CASE
    WHEN NULLIF(trim(COALESCE(v_req.submitted_domain, '')), '') IS NOT NULL
      THEN ARRAY[lower(trim(v_req.submitted_domain))]
    ELSE '{}'::text[]
  END;

  INSERT INTO public.companies (
    name,
    name_ar,
    domains,
    entity_type,
    is_verified,
    website_url
  )
  VALUES (
    v_name,
    v_name_ar,
    v_domains,
    CASE v_req.verification_type
      WHEN 'university' THEN 'university'::public.entity_type_enum
      ELSE 'business'::public.entity_type_enum
    END,
    false,
    NULLIF(trim(COALESCE(v_req.submitted_website, '')), '')
  )
  RETURNING id INTO v_directory_id;

  UPDATE public.verification_requests
  SET
    directory_id = v_directory_id,
    reconciliation_state = 'create_after_approval',
    updated_at = now()
  WHERE id = p_verification_id;

  PERFORM public._write_audit_log(
    v_actor_id,
    'verification.directory_created',
    'verification_request',
    p_verification_id,
    jsonb_build_object('directory_id', NULL, 'reconciliation_state', v_req.reconciliation_state),
    jsonb_build_object(
      'directory_id', v_directory_id,
      'reconciliation_state', 'create_after_approval',
      'is_verified', false
    )
  );

  RETURN v_directory_id;
END;
$$;

-- Catalog ingest/publish are owned by catalog_function_owner (no CREATE on public).
-- ingest_directory_candidate only lists retired names as prohibited JSON keys.
-- publish_directory_candidate remains fail-closed at runtime if it still
-- references dropped columns; it cannot grant Directory ownership.

-- ---------------------------------------------------------------------------
-- 3. RLS: replace claimed_by / entity_state / viewer claim helpers
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Company sees intents on own jobs" ON public.application_intents;
CREATE POLICY "Company sees intents on own jobs"
  ON public.application_intents
  FOR SELECT
  TO authenticated
  USING (private.user_owns_job_workspace(job_id));

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
        FROM public.business_profiles bp
        WHERE bp.owner_user_id = auth.uid()
          AND bp.status IS DISTINCT FROM 'suspended'
      )
    )
  );

DROP POLICY IF EXISTS entity_team_invitations_select_admin ON public.entity_team_invitations;
CREATE POLICY entity_team_invitations_select_admin
  ON public.entity_team_invitations
  FOR SELECT
  TO authenticated
  USING (private.user_owns_directory_workspace(company_id));

DROP POLICY IF EXISTS entity_team_invitations_insert_admin ON public.entity_team_invitations;
CREATE POLICY entity_team_invitations_insert_admin
  ON public.entity_team_invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    invited_by = auth.uid()
    AND private.user_owns_directory_workspace(company_id)
  );

DROP POLICY IF EXISTS job_boost_stats_company_read ON public.job_boost_daily_stats;
CREATE POLICY job_boost_stats_company_read
  ON public.job_boost_daily_stats
  FOR SELECT
  USING (
    private.user_owns_job_workspace(job_id)
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('staff', 'super_admin')
    )
  );

DROP POLICY IF EXISTS directory_catalog_function_insert ON public.companies;
CREATE POLICY directory_catalog_function_insert
  ON public.companies
  FOR INSERT
  TO catalog_function_owner
  WITH CHECK (
    entity_type = 'business'
    AND is_verified = false
    AND is_active = true
    AND link_status = 'pending'
  );

DROP POLICY IF EXISTS profile_views_insert_verified_hr ON public.profile_views;
CREATE POLICY profile_views_insert_verified_hr
  ON public.profile_views
  FOR INSERT
  TO authenticated
  WITH CHECK (private.user_owns_directory_workspace(viewer_company_id));

DROP POLICY IF EXISTS profile_views_select_own_company ON public.profile_views;
CREATE POLICY profile_views_select_own_company
  ON public.profile_views
  FOR SELECT
  TO authenticated
  USING (private.user_owns_directory_workspace(viewer_company_id));

DROP POLICY IF EXISTS "User sees own subscription" ON public.subscriptions;
CREATE POLICY "User sees own subscription"
  ON public.subscriptions
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR private.user_owns_directory_workspace(company_id)
    OR (
      SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()
    ) IN ('staff', 'super_admin')
  );

-- ---------------------------------------------------------------------------
-- 4. Verification naming: columns, enums, indexes, constraints
-- ---------------------------------------------------------------------------

ALTER TABLE public.verification_requests
  RENAME COLUMN claimant_name TO representative_name;
ALTER TABLE public.verification_requests
  RENAME COLUMN claimant_title TO representative_title;

ALTER TYPE public.claim_status_enum RENAME TO verification_status_enum;
ALTER TYPE public.claim_type_enum RENAME TO verification_type_enum;

ALTER TABLE public.verification_requests RENAME CONSTRAINT claim_requests_pkey TO verification_requests_pkey;
ALTER TABLE public.verification_requests RENAME CONSTRAINT claim_requests_user_id_fkey TO verification_requests_applicant_user_id_fkey;
ALTER TABLE public.verification_requests RENAME CONSTRAINT claim_requests_company_id_fkey TO verification_requests_directory_id_fkey;
ALTER TABLE public.verification_requests RENAME CONSTRAINT claim_requests_reviewed_by_fkey TO verification_requests_reviewed_by_fkey;
ALTER TABLE public.verification_requests RENAME CONSTRAINT claim_requests_assigned_staff_id_fkey TO verification_requests_assigned_staff_id_fkey;
ALTER TABLE public.verification_requests RENAME CONSTRAINT claim_requests_first_viewed_by_fkey TO verification_requests_first_viewed_by_fkey;
ALTER TABLE public.verification_requests RENAME CONSTRAINT claim_requests_business_email_format_chk TO verification_requests_business_email_format_chk;

ALTER INDEX IF EXISTS idx_claim_requests_claim_type RENAME TO idx_verification_requests_verification_type;
ALTER INDEX IF EXISTS idx_claim_requests_company_id RENAME TO idx_verification_requests_directory_id;
ALTER INDEX IF EXISTS idx_claim_requests_created_at RENAME TO idx_verification_requests_created_at;
ALTER INDEX IF EXISTS idx_claim_requests_status RENAME TO idx_verification_requests_status;
ALTER INDEX IF EXISTS idx_claim_requests_user_id RENAME TO idx_verification_requests_applicant_user_id;
ALTER INDEX IF EXISTS idx_claims_assigned RENAME TO idx_verification_requests_assigned;

ALTER TYPE public.contact_message_source_enum RENAME VALUE 'claim_help' TO 'verification_help';

-- ---------------------------------------------------------------------------
-- 5. Notification taxonomy
-- ---------------------------------------------------------------------------

ALTER TYPE public.notification_category_enum RENAME VALUE 'claim.approved' TO 'verification.approved';
ALTER TYPE public.notification_category_enum RENAME VALUE 'claim.needs_more_info' TO 'verification.needs_more_info';
ALTER TYPE public.notification_category_enum RENAME VALUE 'claim.rejected' TO 'verification.rejected';
ALTER TYPE public.notification_category_enum RENAME VALUE 'staff.claim_assigned' TO 'staff.verification_assigned';

CREATE OR REPLACE FUNCTION public.notify_verification_decision(
  p_verification_id uuid,
  p_decision text,
  p_reason text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req public.verification_requests%ROWTYPE;
  v_company public.companies%ROWTYPE;
  v_category public.notification_category_enum;
  v_priority public.notification_priority_enum := 'normal';
  v_title_ar text;
  v_title_en text;
  v_body_ar text;
  v_body_en text;
  v_company_ar text;
  v_company_en text;
  v_reason text;
  v_idempotency_key text;
  v_is_university boolean;
  v_action_url text;
  v_action_label_ar text;
  v_action_label_en text;
BEGIN
  IF NOT public.is_privileged_staff() THEN
    RAISE EXCEPTION 'notify_verification_decision requires privileged staff'
      USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_req FROM public.verification_requests vr WHERE vr.id = p_verification_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'verification request not found: %', p_verification_id USING ERRCODE = 'P0002';
  END IF;

  IF v_req.applicant_user_id = auth.uid() THEN
    RAISE EXCEPTION 'applicant cannot dispatch own verification decision notification'
      USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_company FROM public.companies c WHERE c.id = v_req.directory_id;

  v_company_ar := COALESCE(v_company.name_ar, v_company.name, v_req.company_name);
  v_company_en := COALESCE(v_company.name, v_company.name_ar, v_req.company_name);
  v_reason := NULLIF(trim(COALESCE(p_reason, '')), '');
  v_is_university := v_req.verification_type::text = 'university';

  IF p_decision IN ('approve', 'approved') THEN
    v_category := 'verification.approved';
    v_priority := 'high';
    v_title_ar := 'تمت الموافقة على طلب التحقق';
    v_title_en := 'Verification approved';
    v_body_ar := format('وافقت إدارة جيد على طلب التحقق الخاص بـ %s. يمكنك الآن إنشاء ملفك التعريفي.', v_company_ar);
    v_body_en := format('JID staff approved your verification for %s. You can now create your owned profile.', v_company_en);
    v_action_url := CASE WHEN v_is_university THEN '/university/create-profile' ELSE '/company/create-profile' END;
    v_action_label_ar := 'إنشاء الملف التعريفي';
    v_action_label_en := 'Create profile';
  ELSIF p_decision IN ('reject', 'rejected') THEN
    v_category := 'verification.rejected';
    v_priority := 'high';
    v_title_ar := 'تم رفض طلب التحقق';
    v_title_en := 'Verification rejected';
    v_body_ar := format(
      'لم يُقبل طلب التحقق الخاص بـ %s.%s',
      v_company_ar,
      CASE WHEN v_reason IS NOT NULL THEN format(E'\n\nالسبب: %s', v_reason) ELSE '' END
    );
    v_body_en := format(
      'Your verification for %s was not approved.%s',
      v_company_en,
      CASE WHEN v_reason IS NOT NULL THEN format(E'\n\nReason: %s', v_reason) ELSE '' END
    );
    v_action_url := CASE WHEN v_is_university THEN '/university/rejected' ELSE '/company/verification-rejected' END;
    v_action_label_ar := 'عرض نتيجة الطلب';
    v_action_label_en := 'View decision';
  ELSIF p_decision = 'needs_more_info' THEN
    v_category := 'verification.needs_more_info';
    v_title_ar := 'مطلوب معلومات إضافية لطلب التحقق';
    v_title_en := 'More information needed for verification';
    v_body_ar := format(
      'نحتاج مستندات أو توضيحات إضافية لإكمال مراجعة طلب التحقق الخاص بـ %s.%s',
      v_company_ar,
      CASE WHEN v_reason IS NOT NULL THEN format(E'\n\nالتفاصيل: %s', v_reason) ELSE '' END
    );
    v_body_en := format(
      'We need additional documents or clarification to complete the review of your verification for %s.%s',
      v_company_en,
      CASE WHEN v_reason IS NOT NULL THEN format(E'\n\nDetails: %s', v_reason) ELSE '' END
    );
    v_action_url := CASE WHEN v_is_university THEN '/university/pending-review' ELSE '/company/verification-pending' END;
    v_action_label_ar := 'عرض حالة الطلب';
    v_action_label_en := 'View status';
  ELSE
    RAISE EXCEPTION 'unsupported verification decision: %', p_decision USING ERRCODE = '22023';
  END IF;

  v_idempotency_key := format('verification.decision:%s:%s', p_verification_id, p_decision);

  RETURN public.dispatch_notification(
    p_recipient_id := v_req.applicant_user_id,
    p_category := v_category,
    p_title_ar := v_title_ar,
    p_title_en := v_title_en,
    p_body_ar := v_body_ar,
    p_body_en := v_body_en,
    p_priority := v_priority,
    p_action_url := v_action_url,
    p_action_label_ar := v_action_label_ar,
    p_action_label_en := v_action_label_en,
    p_related_resource_type := 'verification_request',
    p_related_resource_id := p_verification_id,
    p_idempotency_key := v_idempotency_key,
    p_metadata := jsonb_build_object(
      'verification_id', p_verification_id,
      'decision', p_decision,
      'directory_id', v_req.directory_id,
      'reason', v_reason
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.notify_verification_decision(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.notify_verification_decision(uuid, text, text) TO authenticated;

DO $$
DECLARE
  r record;
  src text;
BEGIN
  FOR r IN
    SELECT p.oid
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
      AND p.proname <> 'notify_claim_decision'
      AND p.prosrc LIKE '%notify_claim_decision%'
  LOOP
    src := pg_get_functiondef(r.oid);
    src := replace(src, 'public.notify_claim_decision', 'public.notify_verification_decision');
    src := replace(src, 'notify_claim_decision(', 'notify_verification_decision(');
    EXECUTE src;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_default_email_pref(cat public.notification_category_enum)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  RETURN cat IN (
    'auth.email_verified',
    'auth.mfa_disabled',
    'auth.mfa_enabled',
    'auth.new_device_login',
    'auth.password_changed',
    'auth.password_reset_requested',
    'auth.phone_verified',
    'auth.session_revoked',
    'account.suspended',
    'account.reinstated',
    'verification.approved',
    'verification.rejected',
    'verification.needs_more_info',
    'directory.correction_approved',
    'directory.correction_rejected',
    'mentor.application_approved',
    'mentor.application_rejected',
    'job.application_status_changed',
    'job.application_expired',
    'legal.terms_updated',
    'legal.privacy_updated',
    'mentorship.meeting_confirmed',
    'mentorship.meeting_reminder'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_default_digest_pref(cat public.notification_category_enum)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  RETURN cat IN (
    'job.application_received',
    'job.posted',
    'job.expiring_soon',
    'mentorship.request_received',
    'mentorship.request_accepted',
    'mentorship.request_declined',
    'mentorship.meeting_proposed',
    'mentorship.feedback_requested',
    'company.link_broken',
    'staff.verification_assigned'
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 6. Staff / sys metrics: verification terminology
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.get_staff_personal_metrics();
DROP VIEW IF EXISTS public.v_staff_personal_metrics;

CREATE VIEW public.v_staff_personal_metrics AS
SELECT
  staff.id AS staff_user_id,
  COALESCE(audit_stats.total_actions, 0)::bigint AS total_actions,
  COALESCE(audit_stats.actions_today, 0)::bigint AS actions_today,
  COALESCE(verification_stats.verifications_reviewed, 0)::bigint AS verifications_reviewed,
  COALESCE(verification_stats.verifications_reviewed_today, 0)::bigint AS verifications_reviewed_today,
  COALESCE(verification_stats.verifications_assigned_open, 0)::bigint AS verifications_assigned_open,
  COALESCE(verification_stats.verifications_approved_today, 0)::bigint AS verifications_approved_today,
  COALESCE(verification_stats.verifications_rejected_today, 0)::bigint AS verifications_rejected_today,
  COALESCE(verification_stats.avg_review_hours_7d, 0)::numeric AS avg_review_hours_7d,
  COALESCE(flag_stats.flags_resolved, 0)::bigint AS flags_resolved,
  COALESCE(flag_stats.flags_resolved_today, 0)::bigint AS flags_resolved_today
FROM public.profiles staff
LEFT JOIN LATERAL (
  SELECT
    count(*)::bigint AS total_actions,
    count(*) FILTER (
      WHERE al.created_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Riyadh')
    )::bigint AS actions_today
  FROM public.audit_logs al
  WHERE al.actor_id = staff.id
) audit_stats ON true
LEFT JOIN LATERAL (
  SELECT
    count(*) FILTER (WHERE vr.reviewed_by = staff.id)::bigint AS verifications_reviewed,
    count(*) FILTER (
      WHERE vr.reviewed_by = staff.id
        AND vr.reviewed_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Riyadh')
    )::bigint AS verifications_reviewed_today,
    count(*) FILTER (
      WHERE vr.assigned_staff_id = staff.id
        AND vr.status IN ('pending', 'submitted', 'pending_review', 'under_review')
    )::bigint AS verifications_assigned_open,
    count(*) FILTER (
      WHERE vr.reviewed_by = staff.id
        AND vr.status = 'approved'
        AND vr.reviewed_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Riyadh')
    )::bigint AS verifications_approved_today,
    count(*) FILTER (
      WHERE vr.reviewed_by = staff.id
        AND vr.status = 'rejected'
        AND vr.reviewed_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Riyadh')
    )::bigint AS verifications_rejected_today,
    COALESCE(
      avg(EXTRACT(EPOCH FROM (vr.reviewed_at - vr.created_at)) / 3600.0) FILTER (
        WHERE vr.reviewed_by = staff.id
          AND vr.reviewed_at IS NOT NULL
          AND vr.reviewed_at >= now() - interval '7 days'
      ),
      0
    )::numeric AS avg_review_hours_7d
  FROM public.verification_requests vr
) verification_stats ON true
LEFT JOIN LATERAL (
  SELECT
    count(*) FILTER (
      WHERE cf.reviewed_by = staff.id AND cf.status IN ('resolved', 'dismissed')
    )::bigint AS flags_resolved,
    count(*) FILTER (
      WHERE cf.reviewed_by = staff.id
        AND cf.reviewed_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Riyadh')
    )::bigint AS flags_resolved_today
  FROM public.content_flags cf
) flag_stats ON true
WHERE staff.role IN ('staff', 'admin', 'super_admin');

GRANT SELECT ON public.v_staff_personal_metrics TO authenticated;

CREATE OR REPLACE FUNCTION public.get_staff_personal_metrics()
RETURNS SETOF public.v_staff_personal_metrics
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.*
  FROM public.v_staff_personal_metrics m
  WHERE m.staff_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('staff', 'admin', 'super_admin')
    );
$$;

REVOKE ALL ON FUNCTION public.get_staff_personal_metrics() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_staff_personal_metrics() TO authenticated;

DROP MATERIALIZED VIEW IF EXISTS public.mv_sys_dashboard_metrics;

CREATE MATERIALIZED VIEW public.mv_sys_dashboard_metrics AS
SELECT
  1::integer AS id,
  now() AS refreshed_at,
  (SELECT count(*)::bigint FROM public.profiles) AS total_users,
  (SELECT count(*)::bigint FROM public.profiles WHERE suspended_at IS NOT NULL) AS suspended_users,
  (
    SELECT count(*)::bigint
    FROM public.active_sessions
    WHERE revoked_at IS NULL AND expires_at > now()
  ) AS active_sessions_now,
  (
    SELECT count(*)::bigint
    FROM public.verification_requests
    WHERE status IN ('pending', 'pending_review', 'under_review')
  ) AS pending_verifications,
  (
    SELECT count(*)::bigint
    FROM public.verification_requests
    WHERE status IN ('pending', 'pending_review', 'under_review')
      AND created_at < now() - interval '72 hours'
  ) AS overdue_verifications,
  (
    SELECT count(*)::bigint
    FROM public.audit_logs
    WHERE created_at >= now() - interval '24 hours'
  ) AS audit_events_24h,
  (
    SELECT count(*)::bigint
    FROM public.mentor_profiles
    WHERE status = 'pending_review'
  ) AS pending_mentor_applications,
  (
    SELECT count(*)::bigint
    FROM public.staff_invitations
    WHERE accepted_at IS NULL AND expires_at > now()
  ) AS pending_staff_invites
WITH NO DATA;

CREATE UNIQUE INDEX idx_mv_sys_dashboard_metrics_singleton
  ON public.mv_sys_dashboard_metrics (id);

REVOKE ALL ON public.mv_sys_dashboard_metrics FROM PUBLIC, anon;
GRANT SELECT ON public.mv_sys_dashboard_metrics TO authenticated;

REFRESH MATERIALIZED VIEW public.mv_sys_dashboard_metrics;

-- ---------------------------------------------------------------------------
-- 7. Drop obsolete claim RPCs (no remaining live callers)
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.notify_claim_decision(uuid, text, text);
DROP FUNCTION IF EXISTS public.assign_claim_to_self(uuid);
DROP FUNCTION IF EXISTS public.review_claim(uuid, text, text, text[]);
DROP FUNCTION IF EXISTS public.review_claim_request(uuid, text, text, text);
DROP FUNCTION IF EXISTS public.viewer_has_approved_company_claim();
DROP FUNCTION IF EXISTS public.viewer_approved_company_id();

-- ---------------------------------------------------------------------------
-- 8. Drop Directory ownership-claim columns
-- ---------------------------------------------------------------------------

DROP INDEX IF EXISTS idx_companies_claimed_by;
DROP INDEX IF EXISTS idx_companies_entity_state;

ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS companies_claimed_by_fkey;
ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS companies_entity_state_chk;

ALTER TABLE public.companies DROP COLUMN IF EXISTS claimed_by;
ALTER TABLE public.companies DROP COLUMN IF EXISTS claim_requested_at;
ALTER TABLE public.companies DROP COLUMN IF EXISTS entity_state;

COMMENT ON COLUMN public.companies.total_students_claimed IS
  'Unrelated to organization ownership. Legacy Directory counter for student-affiliation volume; not an authorization field.';
COMMENT ON COLUMN public.companies.is_verified IS
  'Directory reference verification flag. Not organization workspace ownership.';

-- ---------------------------------------------------------------------------
-- 9. Mechanical gates
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  v_count integer;
BEGIN
  SELECT count(*) INTO v_count
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'companies'
    AND column_name IN ('claimed_by', 'claim_requested_at', 'entity_state');
  IF v_count > 0 THEN
    RAISE EXCEPTION 'ORG_CLAIM_LIVE_COLUMNS=%', v_count;
  END IF;

  SELECT count(*) INTO v_count
  FROM pg_policy p
  JOIN pg_class c ON c.oid = p.polrelid
  WHERE coalesce(pg_get_expr(p.polqual, p.polrelid), '') ~* 'claimed_by|claim_requested_at|entity_state|viewer_has_approved_company_claim|viewer_approved_company_id'
     OR coalesce(pg_get_expr(p.polwithcheck, p.polrelid), '') ~* 'claimed_by|claim_requested_at|entity_state|viewer_has_approved_company_claim|viewer_approved_company_id';
  IF v_count > 0 THEN
    RAISE EXCEPTION 'ORG_CLAIM_RLS_DEPENDENCIES=%', v_count;
  END IF;

  SELECT count(*) INTO v_count
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname IN ('public', 'private', 'jid_private')
    AND p.prokind = 'f'
    AND p.prosrc ~* 'claimed_by|claim_requested_at|c\\.entity_state|companies\\.entity_state'
    AND p.proname NOT IN (
      'ingest_directory_candidate',
      'publish_directory_candidate'
    );
  IF v_count > 0 THEN
    RAISE EXCEPTION 'ORG_CLAIM_FUNCTION_DEPENDENCIES=% remaining live functions', v_count;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname IN (
      'assign_claim_to_self', 'notify_claim_decision', 'review_claim',
      'review_claim_request', 'viewer_approved_company_id', 'viewer_has_approved_company_claim'
    )
  ) THEN
    RAISE EXCEPTION 'OLD_CLAIM_RPCS_STILL_PRESENT';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'verification_requests'
      AND column_name IN ('claimant_name', 'claimant_title')
  ) THEN
    RAISE EXCEPTION 'LEGACY_VERIFICATION_CLAIM_COLUMNS';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_type WHERE typname IN ('claim_status_enum', 'claim_type_enum')) THEN
    RAISE EXCEPTION 'LEGACY_VERIFICATION_CLAIM_TYPES';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE e.enumlabel IN ('claim.approved', 'claim.rejected', 'claim.needs_more_info', 'staff.claim_assigned')
  ) THEN
    RAISE EXCEPTION 'LEGACY_VERIFICATION_CLAIM_NOTIFICATION_CATEGORIES';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN ('v_staff_personal_metrics', 'mv_sys_dashboard_metrics')
      AND column_name ~ 'claim'
  ) THEN
    RAISE EXCEPTION 'LEGACY_VERIFICATION_CLAIM_METRICS';
  END IF;
END;
$$;

NOTIFY pgrst, 'reload schema';
