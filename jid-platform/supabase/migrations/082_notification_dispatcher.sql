-- Unified Notifications — Section 4 central dispatcher, wrappers, and Radar trigger.
-- Note: requested filename 051_notification_dispatcher.sql is occupied by application_rejection_email_queue.

-- ---------------------------------------------------------------------------
-- Section 4.0 — radar_cards domain view (Kanban cards = application rows)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.radar_cards AS
SELECT
  a.id,
  a.applicant_id AS user_id,
  a.job_id,
  a.company_id,
  a.status,
  a.status_changed_at,
  a.status_changed_by,
  a.created_at,
  a.updated_at
FROM public.applications a;

COMMENT ON VIEW public.radar_cards IS
  'Kanban-facing projection of applications — status mutations occur on public.applications.';

-- ---------------------------------------------------------------------------
-- Section 4.1 — dispatch_notification (SECURITY DEFINER central dispatcher)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.dispatch_notification(
  p_recipient_id uuid,
  p_category public.notification_category_enum,
  p_title_ar text,
  p_title_en text,
  p_body_ar text,
  p_body_en text,
  p_priority public.notification_priority_enum DEFAULT 'normal',
  p_action_url text DEFAULT NULL,
  p_action_label_ar text DEFAULT NULL,
  p_action_label_en text DEFAULT NULL,
  p_related_resource_type text DEFAULT NULL,
  p_related_resource_id uuid DEFAULT NULL,
  p_idempotency_key text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_id uuid;
  v_in_app_enabled boolean;
  v_email_enabled boolean;
  v_include_in_digest boolean;
  v_is_mandatory boolean;
  v_notification_id uuid;
  v_email_valid boolean;
BEGIN
  -- Step 1 — Idempotency: return existing notification without re-insert or re-notify.
  IF p_idempotency_key IS NOT NULL THEN
    SELECT n.id
    INTO v_existing_id
    FROM public.notifications n
    WHERE n.idempotency_key = p_idempotency_key;

    IF v_existing_id IS NOT NULL THEN
      RETURN v_existing_id;
    END IF;
  END IF;

  -- Step 2 — Preference fetch: mandatory or opted-in (in-app and/or email).
  SELECT
    gp.in_app_enabled,
    gp.email_enabled,
    gp.include_in_digest,
    gp.is_mandatory
  INTO
    v_in_app_enabled,
    v_email_enabled,
    v_include_in_digest,
    v_is_mandatory
  FROM public.get_notification_preference(p_recipient_id, p_category) gp;

  IF NOT v_is_mandatory AND NOT v_in_app_enabled AND NOT v_email_enabled THEN
    RETURN NULL;
  END IF;

  -- Step 3 — Insert bilingual pre-rendered notification row.
  INSERT INTO public.notifications (
    recipient_id,
    category,
    priority,
    title_ar,
    title_en,
    body_ar,
    body_en,
    action_url,
    action_label_ar,
    action_label_en,
    related_resource_type,
    related_resource_id,
    idempotency_key,
    metadata
  )
  VALUES (
    p_recipient_id,
    p_category,
    p_priority,
    p_title_ar,
    p_title_en,
    p_body_ar,
    p_body_en,
    p_action_url,
    p_action_label_ar,
    p_action_label_en,
    p_related_resource_type,
    p_related_resource_id,
    p_idempotency_key,
    COALESCE(p_metadata, '{}'::jsonb)
  )
  RETURNING id INTO v_notification_id;

  -- Step 4 — Email signaling when delivery is valid and not deferred to digest.
  v_email_valid := v_is_mandatory OR v_email_enabled;

  IF v_email_valid AND NOT v_include_in_digest THEN
    PERFORM pg_notify('email_queue', v_notification_id::text);
  END IF;

  RETURN v_notification_id;
END;
$$;

REVOKE ALL ON FUNCTION public.dispatch_notification(
  uuid,
  public.notification_category_enum,
  text,
  text,
  text,
  text,
  public.notification_priority_enum,
  text,
  text,
  text,
  text,
  uuid,
  text,
  jsonb
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.dispatch_notification(
  uuid,
  public.notification_category_enum,
  text,
  text,
  text,
  text,
  public.notification_priority_enum,
  text,
  text,
  text,
  text,
  uuid,
  text,
  jsonb
) TO authenticated;

-- ---------------------------------------------------------------------------
-- Section 4.2 — notify_claim_decision wrapper
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.notify_claim_decision(
  p_claim_id uuid,
  p_decision text,
  p_reason text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_claim public.claim_requests%ROWTYPE;
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
BEGIN
  IF NOT public.is_privileged_staff() THEN
    RAISE EXCEPTION 'notify_claim_decision requires privileged staff'
      USING ERRCODE = '42501';
  END IF;

  SELECT *
  INTO v_claim
  FROM public.claim_requests cr
  WHERE cr.id = p_claim_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'claim request not found: %', p_claim_id
      USING ERRCODE = 'P0002';
  END IF;

  -- Claimant must not invoke their own decision notification at this layer.
  IF v_claim.user_id = auth.uid() THEN
    RAISE EXCEPTION 'claimant cannot dispatch own claim decision notification'
      USING ERRCODE = '42501';
  END IF;

  SELECT *
  INTO v_company
  FROM public.companies c
  WHERE c.id = v_claim.company_id;

  v_company_ar := COALESCE(v_company.name_ar, v_company.name, v_claim.company_name);
  v_company_en := COALESCE(v_company.name, v_company.name_ar, v_claim.company_name);
  v_reason := NULLIF(trim(COALESCE(p_reason, '')), '');

  IF p_decision IN ('approve', 'approved') THEN
    v_category := 'claim.approved';
    v_priority := 'high';
    v_title_ar := 'تمت الموافقة على مطالبة الشركة';
    v_title_en := 'Company claim approved';
    v_body_ar := format(
      'وافقت إدارة جيد على مطالبتك بملكية %s. يمكنك الآن إدارة ملف الشركة.',
      v_company_ar
    );
    v_body_en := format(
      'JID staff approved your claim for %s. You can now manage the company profile.',
      v_company_en
    );
  ELSIF p_decision IN ('reject', 'rejected') THEN
    v_category := 'claim.rejected';
    v_priority := 'high';
    v_title_ar := 'تم رفض مطالبة الشركة';
    v_title_en := 'Company claim rejected';
    v_body_ar := format(
      'لم تُقبل مطالبتك بملكية %s.%s',
      v_company_ar,
      CASE
        WHEN v_reason IS NOT NULL THEN format(E'\n\nالسبب: %s', v_reason)
        ELSE ''
      END
    );
    v_body_en := format(
      'Your claim for %s was not approved.%s',
      v_company_en,
      CASE
        WHEN v_reason IS NOT NULL THEN format(E'\n\nReason: %s', v_reason)
        ELSE ''
      END
    );
  ELSIF p_decision = 'needs_more_info' THEN
    v_category := 'claim.needs_more_info';
    v_title_ar := 'مطلوب معلومات إضافية لمطالبة الشركة';
    v_title_en := 'More information needed for company claim';
    v_body_ar := format(
      'نحتاج مستندات أو توضيحات إضافية لإكمال مراجعة مطالبتك بملكية %s.%s',
      v_company_ar,
      CASE
        WHEN v_reason IS NOT NULL THEN format(E'\n\nالتفاصيل: %s', v_reason)
        ELSE ''
      END
    );
    v_body_en := format(
      'We need additional documents or clarification to complete the review of your claim for %s.%s',
      v_company_en,
      CASE
        WHEN v_reason IS NOT NULL THEN format(E'\n\nDetails: %s', v_reason)
        ELSE ''
      END
    );
  ELSE
    RAISE EXCEPTION 'unsupported claim decision: %', p_decision
      USING ERRCODE = '22023';
  END IF;

  v_idempotency_key := format('claim.decision:%s:%s', p_claim_id, p_decision);

  RETURN public.dispatch_notification(
    p_recipient_id := v_claim.user_id,
    p_category := v_category,
    p_title_ar := v_title_ar,
    p_title_en := v_title_en,
    p_body_ar := v_body_ar,
    p_body_en := v_body_en,
    p_priority := v_priority,
    p_action_url := '/settings',
    p_action_label_ar := 'عرض الإعدادات',
    p_action_label_en := 'View settings',
    p_related_resource_type := 'claim_request',
    p_related_resource_id := p_claim_id,
    p_idempotency_key := v_idempotency_key,
    p_metadata := jsonb_build_object(
      'claim_id', p_claim_id,
      'decision', p_decision,
      'company_id', v_claim.company_id,
      'reason', v_reason
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.notify_claim_decision(uuid, text, text)
  FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.notify_claim_decision(uuid, text, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- Section 4.3 — notify_radar_status_change wrapper
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.radar_status_label_ar(p_status text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE p_status
    WHEN 'draft' THEN 'مسودة'
    WHEN 'saved' THEN 'محفوظ'
    WHEN 'pending' THEN 'قيد التقديم'
    WHEN 'submitted' THEN 'مُرسل'
    WHEN 'under_review' THEN 'قيد المراجعة'
    WHEN 'shortlisted' THEN 'في القائمة المختصرة'
    WHEN 'rejected' THEN 'مرفوض'
    WHEN 'invited' THEN 'مدعو'
    WHEN 'withdrawn' THEN 'منسحب'
    WHEN 'expired' THEN 'منتهٍ'
    ELSE p_status
  END;
$$;

CREATE OR REPLACE FUNCTION public.radar_status_label_en(p_status text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE p_status
    WHEN 'draft' THEN 'Draft'
    WHEN 'saved' THEN 'Saved'
    WHEN 'pending' THEN 'Pending'
    WHEN 'submitted' THEN 'Submitted'
    WHEN 'under_review' THEN 'Under review'
    WHEN 'shortlisted' THEN 'Shortlisted'
    WHEN 'rejected' THEN 'Rejected'
    WHEN 'invited' THEN 'Invited'
    WHEN 'withdrawn' THEN 'Withdrawn'
    WHEN 'expired' THEN 'Expired'
    ELSE p_status
  END;
$$;

CREATE OR REPLACE FUNCTION public.notify_radar_status_change(
  p_card_id uuid,
  p_old_status text,
  p_new_status text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_card public.radar_cards%ROWTYPE;
  v_job public.jobs%ROWTYPE;
  v_company public.companies%ROWTYPE;
  v_priority public.notification_priority_enum := 'normal';
  v_title_ar text := 'تحديث حالة طلب التوظيف';
  v_title_en text := 'Application status updated';
  v_body_ar text;
  v_body_en text;
  v_job_ar text;
  v_job_en text;
  v_company_ar text;
  v_company_en text;
  v_idempotency_key text;
BEGIN
  IF p_old_status IS NOT DISTINCT FROM p_new_status THEN
    RETURN NULL;
  END IF;

  SELECT *
  INTO v_card
  FROM public.radar_cards rc
  WHERE rc.id = p_card_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'radar card not found: %', p_card_id
      USING ERRCODE = 'P0002';
  END IF;

  SELECT *
  INTO v_job
  FROM public.jobs j
  WHERE j.id = v_card.job_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'job not found for radar card: %', p_card_id
      USING ERRCODE = 'P0002';
  END IF;

  SELECT *
  INTO v_company
  FROM public.companies c
  WHERE c.id = v_card.company_id;

  v_job_ar := COALESCE(v_job.title_ar, v_job.title_en, 'الوظيفة');
  v_job_en := COALESCE(v_job.title_en, v_job.title_ar, 'the position');
  v_company_ar := COALESCE(v_company.name_ar, v_company.name, 'الشركة');
  v_company_en := COALESCE(v_company.name, v_company.name_ar, 'the company');

  IF p_new_status IN ('rejected', 'shortlisted', 'invited', 'expired', 'withdrawn') THEN
    v_priority := 'high';
  END IF;

  v_body_ar := format(
    'حدّثت %s حالة طلبك على «%s» من «%s» إلى «%s».',
    v_company_ar,
    v_job_ar,
    public.radar_status_label_ar(p_old_status),
    public.radar_status_label_ar(p_new_status)
  );

  v_body_en := format(
    '%s updated your application for "%s" from "%s" to "%s".',
    v_company_en,
    v_job_en,
    public.radar_status_label_en(p_old_status),
    public.radar_status_label_en(p_new_status)
  );

  v_idempotency_key := format('radar.status:%s:%s', p_card_id, p_new_status);

  RETURN public.dispatch_notification(
    p_recipient_id := v_card.user_id,
    p_category := 'job.application_status_changed',
    p_title_ar := v_title_ar,
    p_title_en := v_title_en,
    p_body_ar := v_body_ar,
    p_body_en := v_body_en,
    p_priority := v_priority,
    p_action_url := '/radar',
    p_action_label_ar := 'فتح الرادار',
    p_action_label_en := 'Open Radar',
    p_related_resource_type := 'application',
    p_related_resource_id := p_card_id,
    p_idempotency_key := v_idempotency_key,
    p_metadata := jsonb_build_object(
      'card_id', p_card_id,
      'job_id', v_card.job_id,
      'company_id', v_card.company_id,
      'old_status', p_old_status,
      'new_status', p_new_status
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.notify_radar_status_change(uuid, text, text)
  FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.notify_radar_status_change(uuid, text, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- Section 4.4 — Automated trigger on radar status mutations
-- (physical table: applications — radar_cards is the read projection)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.trg_notify_on_radar_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Applicant self-initiated Kanban moves should not generate notifications.
  IF NEW.status_changed_by IS NOT NULL AND NEW.status_changed_by = NEW.applicant_id THEN
    RETURN NEW;
  END IF;

  PERFORM public.notify_radar_status_change(
    NEW.id,
    OLD.status::text,
    NEW.status::text
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_radar_change ON public.applications;

CREATE TRIGGER trg_notify_on_radar_change
  AFTER UPDATE OF status ON public.applications
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.trg_notify_on_radar_change();

COMMENT ON TRIGGER trg_notify_on_radar_change ON public.applications IS
  'Fires notify_radar_status_change for company/system-initiated application status updates (Radar cards).';
