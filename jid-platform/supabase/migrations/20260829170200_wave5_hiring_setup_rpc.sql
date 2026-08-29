-- Atomic setup for the default governed hiring role and stage graph.
CREATE OR REPLACE FUNCTION public.initialize_hiring_role(
  p_job_id uuid,
  p_title_ar text,
  p_title_en text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE v_job public.jobs%ROWTYPE; v_role_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'authentication required'; END IF;
  SELECT * INTO v_job FROM public.jobs WHERE id = p_job_id FOR UPDATE;
  IF NOT FOUND OR v_job.business_profile_id IS NULL
     OR NOT public.can_access_hiring_workspace(v_job.business_profile_id, true) THEN
    RAISE EXCEPTION 'opportunity not found' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF nullif(btrim(p_title_ar), '') IS NULL OR nullif(btrim(p_title_en), '') IS NULL THEN
    RAISE EXCEPTION 'Arabic and English role titles are required';
  END IF;

  INSERT INTO public.hiring_roles
    (job_id, business_profile_id, title_ar, title_en, lifecycle_state, created_by)
  VALUES (v_job.id, v_job.business_profile_id, btrim(p_title_ar), btrim(p_title_en),
    'draft', auth.uid())
  ON CONFLICT (job_id) DO UPDATE SET
    title_ar = EXCLUDED.title_ar, title_en = EXCLUDED.title_en, updated_at = now()
  WHERE public.hiring_roles.business_profile_id = EXCLUDED.business_profile_id
  RETURNING id INTO v_role_id;

  IF NOT EXISTS (SELECT 1 FROM public.hiring_stages WHERE hiring_role_id = v_role_id) THEN
    INSERT INTO public.hiring_stages
      (hiring_role_id, kind, label_ar, label_en, candidate_visible_status, sort_order, terminal)
    VALUES
      (v_role_id, 'applied', 'تم التقديم', 'Applied', 'submitted', 0, false),
      (v_role_id, 'review', 'قيد المراجعة', 'Review', 'in_review', 10, false),
      (v_role_id, 'screening', 'الفرز المنظم', 'Structured screening', 'action_required', 20, false),
      (v_role_id, 'interview', 'المقابلة', 'Interview', 'interview', 30, false),
      (v_role_id, 'offer', 'العرض', 'Offer', 'offer', 40, false),
      (v_role_id, 'closed', 'مغلق — تم التوظيف', 'Closed — hired', 'hired', 50, true),
      (v_role_id, 'closed', 'مغلق — لم يتم الاختيار', 'Closed — not selected', 'not_selected', 60, true);
  END IF;
  RETURN v_role_id;
END;
$$;

REVOKE ALL ON FUNCTION public.initialize_hiring_role(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.initialize_hiring_role(uuid, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.add_hiring_note(p_application_id uuid, p_body text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE v_role public.hiring_roles%ROWTYPE; v_id uuid;
BEGIN
  SELECT r.* INTO v_role FROM public.applications a
  JOIN public.hiring_roles r ON r.id = a.hiring_role_id
  WHERE a.id = p_application_id;
  IF NOT FOUND OR NOT public.can_access_hiring_workspace(v_role.business_profile_id, true) THEN
    RAISE EXCEPTION 'application not found' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF length(btrim(coalesce(p_body, ''))) NOT BETWEEN 1 AND 5000 THEN
    RAISE EXCEPTION 'note must contain 1 to 5000 characters';
  END IF;
  INSERT INTO public.hiring_notes(application_id, body, author_user_id)
  VALUES (p_application_id, btrim(p_body), auth.uid()) RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.add_hiring_note(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.add_hiring_note(uuid, text) TO authenticated;
