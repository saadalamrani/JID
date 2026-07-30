-- Spec 06-D — point claim decision notifications at Spec 03 outcome surfaces.
-- Preserves notify_claim_decision name, parameters, return type, and
-- idempotency key format verification.decision:<id>:<decision>.

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
    RAISE EXCEPTION 'notify_claim_decision requires privileged staff'
      USING ERRCODE = '42501';
  END IF;

  SELECT *
  INTO v_req
  FROM public.verification_requests vr
  WHERE vr.id = p_claim_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'verification request not found: %', p_claim_id
      USING ERRCODE = 'P0002';
  END IF;

  IF v_req.applicant_user_id = auth.uid() THEN
    RAISE EXCEPTION 'applicant cannot dispatch own verification decision notification'
      USING ERRCODE = '42501';
  END IF;

  SELECT *
  INTO v_company
  FROM public.companies c
  WHERE c.id = v_req.directory_id;

  v_company_ar := COALESCE(v_company.name_ar, v_company.name, v_req.company_name);
  v_company_en := COALESCE(v_company.name, v_company.name_ar, v_req.company_name);
  v_reason := NULLIF(trim(COALESCE(p_reason, '')), '');
  v_is_university := v_req.verification_type::text = 'university';

  IF p_decision IN ('approve', 'approved') THEN
    v_category := 'claim.approved';
    v_priority := 'high';
    v_title_ar := 'تمت الموافقة على طلب التحقق';
    v_title_en := 'Verification approved';
    v_body_ar := format(
      'وافقت إدارة جيد على طلب التحقق الخاص بـ %s. يمكنك الآن إنشاء ملفك التعريفي.',
      v_company_ar
    );
    v_body_en := format(
      'JID staff approved your verification for %s. You can now create your owned profile.',
      v_company_en
    );
    v_action_url := CASE
      WHEN v_is_university THEN '/university/create-profile'
      ELSE '/company/create-profile'
    END;
    v_action_label_ar := 'إنشاء الملف التعريفي';
    v_action_label_en := 'Create profile';
  ELSIF p_decision IN ('reject', 'rejected') THEN
    v_category := 'claim.rejected';
    v_priority := 'high';
    v_title_ar := 'تم رفض طلب التحقق';
    v_title_en := 'Verification rejected';
    v_body_ar := format(
      'لم يُقبل طلب التحقق الخاص بـ %s.%s',
      v_company_ar,
      CASE
        WHEN v_reason IS NOT NULL THEN format(E'\n\nالسبب: %s', v_reason)
        ELSE ''
      END
    );
    v_body_en := format(
      'Your verification for %s was not approved.%s',
      v_company_en,
      CASE
        WHEN v_reason IS NOT NULL THEN format(E'\n\nReason: %s', v_reason)
        ELSE ''
      END
    );
    v_action_url := CASE
      WHEN v_is_university THEN '/university/rejected'
      ELSE '/company/verification-rejected'
    END;
    v_action_label_ar := 'عرض نتيجة الطلب';
    v_action_label_en := 'View decision';
  ELSIF p_decision = 'needs_more_info' THEN
    -- Schema-bound category preserved; deferred workflow is not implemented.
    -- Route to existing Spec 03 pending surfaces only (no new route).
    v_category := 'claim.needs_more_info';
    v_title_ar := 'مطلوب معلومات إضافية لطلب التحقق';
    v_title_en := 'More information needed for verification';
    v_body_ar := format(
      'نحتاج مستندات أو توضيحات إضافية لإكمال مراجعة طلب التحقق الخاص بـ %s.%s',
      v_company_ar,
      CASE
        WHEN v_reason IS NOT NULL THEN format(E'\n\nالتفاصيل: %s', v_reason)
        ELSE ''
      END
    );
    v_body_en := format(
      'We need additional documents or clarification to complete the review of your verification for %s.%s',
      v_company_en,
      CASE
        WHEN v_reason IS NOT NULL THEN format(E'\n\nDetails: %s', v_reason)
        ELSE ''
      END
    );
    v_action_url := CASE
      WHEN v_is_university THEN '/university/pending-review'
      ELSE '/company/verification-pending'
    END;
    v_action_label_ar := 'عرض حالة الطلب';
    v_action_label_en := 'View status';
  ELSE
    RAISE EXCEPTION 'unsupported verification decision: %', p_decision
      USING ERRCODE = '22023';
  END IF;

  v_idempotency_key := format('verification.decision:%s:%s', p_claim_id, p_decision);

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
    p_related_resource_id := p_claim_id,
    p_idempotency_key := v_idempotency_key,
    p_metadata := jsonb_build_object(
      'verification_id', p_claim_id,
      'decision', p_decision,
      'directory_id', v_req.directory_id,
      'reason', v_reason
    )
  );
END;
$$;

NOTIFY pgrst, 'reload schema';
