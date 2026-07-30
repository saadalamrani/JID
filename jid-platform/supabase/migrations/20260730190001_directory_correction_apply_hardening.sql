-- Spec 06-B — harden existing approve/reject correction RPCs (no duplicate RPC).
-- Adds: missing Directory guard (no orphan apply), suggester in-app notification
-- via suggested_by, email default prefs.

CREATE OR REPLACE FUNCTION public.get_default_email_pref(
  cat public.notification_category_enum
)
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
    'claim.approved',
    'claim.rejected',
    'claim.needs_more_info',
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

CREATE OR REPLACE FUNCTION public.approve_correction_suggestion(
  p_suggestion_id uuid,
  p_review_notes text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id uuid := auth.uid();
  v_caller_role public.user_role_enum;
  v_sug public.directory_correction_suggestions%ROWTYPE;
  v_directory public.companies%ROWTYPE;
  v_allowed_fields text[] := ARRAY[
    'city',
    'career_portal_url',
    'website_url',
    'linkedin_url',
    'twitter_url',
    'sector_id',
    'region_id'
  ];
  v_company_ar text;
  v_company_en text;
  v_updated int;
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT role INTO v_caller_role FROM public.profiles WHERE id = v_actor_id;

  IF v_caller_role NOT IN ('staff', 'super_admin') THEN
    RAISE EXCEPTION 'insufficient_privileges';
  END IF;

  IF p_review_notes IS NULL OR length(trim(p_review_notes)) = 0 THEN
    RAISE EXCEPTION 'review_notes_required';
  END IF;

  SELECT * INTO v_sug
  FROM public.directory_correction_suggestions
  WHERE id = p_suggestion_id
  FOR UPDATE;

  IF v_sug.id IS NULL OR v_sug.status <> 'pending' THEN
    RAISE EXCEPTION 'invalid_or_reviewed';
  END IF;

  IF NOT (v_sug.field_name = ANY (v_allowed_fields)) THEN
    RAISE EXCEPTION 'field_not_allowed';
  END IF;

  SELECT * INTO v_directory
  FROM public.companies
  WHERE id = v_sug.directory_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'directory_missing';
  END IF;

  EXECUTE format(
    'UPDATE public.companies SET %I = $1, updated_at = now() WHERE id = $2',
    v_sug.field_name
  )
  USING v_sug.suggested_value, v_sug.directory_id;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated <> 1 THEN
    RAISE EXCEPTION 'directory_missing';
  END IF;

  UPDATE public.directory_correction_suggestions
  SET
    status = 'approved',
    reviewed_by = v_actor_id,
    reviewed_at = now(),
    review_notes = trim(p_review_notes)
  WHERE id = p_suggestion_id;

  PERFORM public._write_audit_log(
    v_actor_id,
    'directory.corrected',
    'company',
    v_sug.directory_id,
    jsonb_build_object('field', v_sug.field_name, 'old', v_sug.current_value),
    jsonb_build_object(
      'field', v_sug.field_name,
      'new', v_sug.suggested_value,
      'reason', trim(p_review_notes),
      'suggestion_id', p_suggestion_id
    )
  );

  v_company_ar := COALESCE(v_directory.name_ar, v_directory.name);
  v_company_en := COALESCE(v_directory.name, v_directory.name_ar);

  PERFORM public.dispatch_notification(
    p_recipient_id := v_sug.suggested_by,
    p_category := 'directory.correction_approved',
    p_title_ar := 'تمت الموافقة على اقتراح التصحيح',
    p_title_en := 'Correction suggestion approved',
    p_body_ar := format(
      'وافقت إدارة جيد على اقتراحك لتصحيح حقل %s في دليل %s.',
      v_sug.field_name,
      v_company_ar
    ),
    p_body_en := format(
      'JID staff approved your correction suggestion for field %s on %s.',
      v_sug.field_name,
      v_company_en
    ),
    p_priority := 'normal',
    p_action_url := NULL,
    p_action_label_ar := NULL,
    p_action_label_en := NULL,
    p_related_resource_type := 'directory_correction_suggestion',
    p_related_resource_id := p_suggestion_id,
    p_idempotency_key := format('directory.correction:%s:approved', p_suggestion_id),
    p_metadata := jsonb_build_object(
      'suggestion_id', p_suggestion_id,
      'directory_id', v_sug.directory_id,
      'field_name', v_sug.field_name,
      'decision', 'approved'
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_correction_suggestion(
  p_suggestion_id uuid,
  p_review_notes text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id uuid := auth.uid();
  v_caller_role public.user_role_enum;
  v_sug public.directory_correction_suggestions%ROWTYPE;
  v_directory public.companies%ROWTYPE;
  v_notes text;
  v_company_ar text;
  v_company_en text;
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT role INTO v_caller_role FROM public.profiles WHERE id = v_actor_id;

  IF v_caller_role NOT IN ('staff', 'super_admin') THEN
    RAISE EXCEPTION 'insufficient_privileges';
  END IF;

  v_notes := NULLIF(trim(p_review_notes), '');
  IF v_notes IS NULL THEN
    RAISE EXCEPTION 'review_notes_required';
  END IF;

  SELECT * INTO v_sug
  FROM public.directory_correction_suggestions
  WHERE id = p_suggestion_id
  FOR UPDATE;

  IF v_sug.id IS NULL OR v_sug.status <> 'pending' THEN
    RAISE EXCEPTION 'invalid_or_reviewed';
  END IF;

  SELECT * INTO v_directory
  FROM public.companies
  WHERE id = v_sug.directory_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'directory_missing';
  END IF;

  UPDATE public.directory_correction_suggestions
  SET
    status = 'rejected',
    reviewed_by = v_actor_id,
    reviewed_at = now(),
    review_notes = v_notes
  WHERE id = p_suggestion_id;

  PERFORM public._write_audit_log(
    v_actor_id,
    'directory.correction_rejected',
    'directory_correction_suggestion',
    p_suggestion_id,
    jsonb_build_object('status', v_sug.status, 'field', v_sug.field_name),
    jsonb_build_object('status', 'rejected', 'reason', v_notes)
  );

  v_company_ar := COALESCE(v_directory.name_ar, v_directory.name, '—');
  v_company_en := COALESCE(v_directory.name, v_directory.name_ar, '—');

  PERFORM public.dispatch_notification(
    p_recipient_id := v_sug.suggested_by,
    p_category := 'directory.correction_rejected',
    p_title_ar := 'تم رفض اقتراح التصحيح',
    p_title_en := 'Correction suggestion rejected',
    p_body_ar := format(
      'لم يُقبل اقتراحك لتصحيح حقل %s في دليل %s.%s',
      v_sug.field_name,
      v_company_ar,
      CASE
        WHEN v_notes IS NOT NULL THEN format(E'\n\nالسبب: %s', v_notes)
        ELSE ''
      END
    ),
    p_body_en := format(
      'Your correction suggestion for field %s on %s was not approved.%s',
      v_sug.field_name,
      v_company_en,
      CASE
        WHEN v_notes IS NOT NULL THEN format(E'\n\nReason: %s', v_notes)
        ELSE ''
      END
    ),
    p_priority := 'normal',
    p_action_url := NULL,
    p_action_label_ar := NULL,
    p_action_label_en := NULL,
    p_related_resource_type := 'directory_correction_suggestion',
    p_related_resource_id := p_suggestion_id,
    p_idempotency_key := format('directory.correction:%s:rejected', p_suggestion_id),
    p_metadata := jsonb_build_object(
      'suggestion_id', p_suggestion_id,
      'directory_id', v_sug.directory_id,
      'field_name', v_sug.field_name,
      'decision', 'rejected'
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.approve_correction_suggestion(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_correction_suggestion(uuid, text) TO authenticated;

REVOKE ALL ON FUNCTION public.reject_correction_suggestion(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reject_correction_suggestion(uuid, text) TO authenticated;

NOTIFY pgrst, 'reload schema';
