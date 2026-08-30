-- Wave 8: governed Professional Discovery, talent invitations, hiring intelligence.
-- Forward-only and additive. Production execution is not authorized by this file.
-- Does not restore a general people directory. Search is RPC-only over an explicit
-- discoverable opt-in. Invitation never inserts into public.applications.

CREATE TYPE public.talent_invitation_state_enum AS ENUM
  ('invited', 'interested', 'declined', 'withdrawn');
CREATE TYPE public.talent_sourcing_event_type_enum AS ENUM
  ('search', 'card_viewed', 'compared', 'invited', 'invitation_withdrawn', 'invitation_responded');

CREATE TABLE public.talent_sourcing_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hiring_role_id uuid NOT NULL REFERENCES public.hiring_roles(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  business_profile_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE RESTRICT,
  candidate_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  state public.talent_invitation_state_enum NOT NULL DEFAULT 'invited',
  message_ar text NOT NULL CHECK (length(btrim(message_ar)) BETWEEN 1 AND 2000),
  message_en text NOT NULL CHECK (length(btrim(message_en)) BETWEEN 1 AND 2000),
  invited_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  application_id uuid REFERENCES public.applications(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  responded_at timestamptz,
  UNIQUE (hiring_role_id, candidate_profile_id)
);

CREATE TABLE public.talent_sourcing_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hiring_role_id uuid NOT NULL REFERENCES public.hiring_roles(id) ON DELETE CASCADE,
  business_profile_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE RESTRICT,
  actor_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type public.talent_sourcing_event_type_enum NOT NULL,
  candidate_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX talent_invitations_candidate_idx
  ON public.talent_sourcing_invitations (candidate_profile_id, created_at DESC);
CREATE INDEX talent_invitations_role_idx
  ON public.talent_sourcing_invitations (hiring_role_id, state);
CREATE INDEX talent_events_role_created_idx
  ON public.talent_sourcing_events (hiring_role_id, created_at DESC);

COMMENT ON TABLE public.talent_sourcing_invitations IS
  'Employer hiring interest. Never creates an Application. Candidate retains agency.';
COMMENT ON COLUMN public.talent_sourcing_invitations.application_id IS
  'Set only after the Individual independently creates an Application for the same role.';

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
      AND c.entity_state = 'approved'
      AND c.is_verified IS TRUE
  );
$$;

CREATE OR REPLACE FUNCTION public.can_source_talent(
  p_business_profile_id uuid,
  p_write boolean DEFAULT false
) RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT public.can_access_hiring_workspace(p_business_profile_id, p_write)
    AND (
      public.is_verified_hiring_employer(p_business_profile_id)
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role IN ('staff', 'super_admin')
      )
    );
$$;

CREATE OR REPLACE FUNCTION public.is_professionally_discoverable(p_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = p_profile_id
      AND p.role = 'individual'
      AND p.deleted_at IS NULL
      AND p.suspended_at IS NULL
      AND p.profile_state IN ('active', 'incomplete')
      AND p.visibility = 'discoverable'
      AND p.show_profile_to_companies IS TRUE
  );
$$;

REVOKE ALL ON FUNCTION public.is_verified_hiring_employer(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_source_talent(uuid, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_professionally_discoverable(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_verified_hiring_employer(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_source_talent(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_professionally_discoverable(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.wave8_touch_invitation_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  UPDATE public.talent_sourcing_invitations
     SET application_id = NEW.id
   WHERE candidate_profile_id = NEW.applicant_id
     AND hiring_role_id = NEW.hiring_role_id
     AND application_id IS NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_wave8_link_invitation_application ON public.applications;
CREATE TRIGGER trg_wave8_link_invitation_application
  AFTER INSERT ON public.applications
  FOR EACH ROW
  WHEN (NEW.hiring_role_id IS NOT NULL)
  EXECUTE FUNCTION public.wave8_touch_invitation_application();

CREATE OR REPLACE FUNCTION public.search_discoverable_talent(p_job_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_role public.hiring_roles%ROWTYPE;
  v_result jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT r.* INTO v_role
  FROM public.hiring_roles r
  WHERE r.job_id = p_job_id;

  IF NOT FOUND OR NOT public.can_source_talent(v_role.business_profile_id, false) THEN
    RAISE EXCEPTION 'opportunity not found' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT jsonb_build_object(
    'hiringRoleId', v_role.id,
    'jobId', p_job_id,
    'criteria', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', c.id,
        'labelAr', c.label_ar,
        'labelEn', c.label_en,
        'required', c.required,
        'sortOrder', c.sort_order
      ) ORDER BY c.sort_order)
      FROM public.hiring_criteria c
      WHERE c.hiring_role_id = v_role.id
    ), '[]'::jsonb),
    'candidates', COALESCE((
      SELECT jsonb_agg(card)
      FROM (
        SELECT jsonb_build_object(
          'profileId', p.id,
          'displayName', COALESCE(p.full_name, ''),
          'headline', p.headline,
          'about', p.about_me,
          'targetSectors', COALESCE(p.target_sectors, ARRAY[]::text[]),
          'targetProgramTypes', COALESCE(p.target_program_types, ARRAY[]::text[]),
          'targetRegions', COALESCE(p.target_regions, ARRAY[]::text[]),
          'skills', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
              'id', s.id, 'name', s.name, 'nameAr', s.name_ar
            ))
            FROM public.profile_skills ps
            JOIN public.skills s ON s.id = ps.skill_id
            WHERE ps.profile_id = p.id
          ), '[]'::jsonb),
          'invitationState', inv.state
        ) AS card
        FROM public.profiles p
        LEFT JOIN public.talent_sourcing_invitations inv
          ON inv.candidate_profile_id = p.id AND inv.hiring_role_id = v_role.id
        WHERE public.is_professionally_discoverable(p.id)
          AND EXISTS (SELECT 1 FROM public.hiring_criteria hc WHERE hc.hiring_role_id = v_role.id)
          AND EXISTS (
            SELECT 1
            FROM public.hiring_criteria hc
            WHERE hc.hiring_role_id = v_role.id
              AND (
                position(lower(hc.label_en) in lower(coalesce(p.headline, '') || ' ' || coalesce(p.about_me, ''))) > 0
                OR position(lower(hc.label_ar) in lower(coalesce(p.headline, '') || ' ' || coalesce(p.about_me, ''))) > 0
                OR EXISTS (
                  SELECT 1
                  FROM public.profile_skills ps
                  JOIN public.skills s ON s.id = ps.skill_id
                  WHERE ps.profile_id = p.id
                    AND (
                      position(lower(hc.label_en) in lower(coalesce(s.name, ''))) > 0
                      OR position(lower(hc.label_ar) in lower(coalesce(s.name_ar, s.name, ''))) > 0
                      OR position(lower(coalesce(s.name, '')) in lower(hc.label_en)) > 0
                      OR position(lower(coalesce(s.name_ar, '')) in lower(hc.label_ar)) > 0
                    )
                )
                OR EXISTS (
                  SELECT 1
                  FROM unnest(COALESCE(p.target_sectors, ARRAY[]::text[])
                    || COALESCE(p.target_program_types, ARRAY[]::text[])
                    || COALESCE(p.target_regions, ARRAY[]::text[])) AS published(label)
                  WHERE position(lower(hc.label_en) in lower(published.label)) > 0
                     OR position(lower(hc.label_ar) in lower(published.label)) > 0
                     OR position(lower(published.label) in lower(hc.label_en)) > 0
                     OR position(lower(published.label) in lower(hc.label_ar)) > 0
                )
              )
          )
        ORDER BY p.updated_at DESC NULLS LAST
        LIMIT 50
      ) listed
    ), '[]'::jsonb)
  ) INTO v_result;

  INSERT INTO public.talent_sourcing_events
    (hiring_role_id, business_profile_id, actor_user_id, event_type, payload)
  VALUES
    (v_role.id, v_role.business_profile_id, auth.uid(), 'search',
     jsonb_build_object(
       'job_id', p_job_id,
       'profile_ids', COALESCE((
         SELECT jsonb_agg(card.value ->> 'profileId')
         FROM jsonb_array_elements(v_result -> 'candidates') AS card(value)
       ), '[]'::jsonb)
     ));

  PERFORM public._write_audit_log(
    auth.uid(), 'talent_sourcing.search', 'hiring_roles', v_role.id, NULL,
    jsonb_build_object('job_id', p_job_id));

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.invite_discoverable_talent(
  p_job_id uuid,
  p_candidate_profile_id uuid,
  p_message_ar text,
  p_message_en text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_role public.hiring_roles%ROWTYPE;
  v_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT r.* INTO v_role FROM public.hiring_roles r WHERE r.job_id = p_job_id;
  IF NOT FOUND OR NOT public.can_source_talent(v_role.business_profile_id, true) THEN
    RAISE EXCEPTION 'opportunity not found' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF NOT public.is_professionally_discoverable(p_candidate_profile_id) THEN
    RAISE EXCEPTION 'candidate is not discoverable' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF length(btrim(coalesce(p_message_ar, ''))) NOT BETWEEN 1 AND 2000
     OR length(btrim(coalesce(p_message_en, ''))) NOT BETWEEN 1 AND 2000 THEN
    RAISE EXCEPTION 'invitation message required in Arabic and English';
  END IF;

  INSERT INTO public.talent_sourcing_invitations (
    hiring_role_id, job_id, business_profile_id, candidate_profile_id,
    state, message_ar, message_en, invited_by
  ) VALUES (
    v_role.id, p_job_id, v_role.business_profile_id, p_candidate_profile_id,
    'invited', btrim(p_message_ar), btrim(p_message_en), auth.uid()
  )
  ON CONFLICT (hiring_role_id, candidate_profile_id) DO UPDATE
    SET state = 'invited',
        message_ar = EXCLUDED.message_ar,
        message_en = EXCLUDED.message_en,
        invited_by = EXCLUDED.invited_by,
        responded_at = NULL
    WHERE public.talent_sourcing_invitations.state = 'withdrawn'
  RETURNING id INTO v_id;

  IF v_id IS NULL THEN
    RAISE EXCEPTION 'invitation already exists';
  END IF;

  INSERT INTO public.talent_sourcing_events
    (hiring_role_id, business_profile_id, actor_user_id, event_type, candidate_profile_id, payload)
  VALUES
    (v_role.id, v_role.business_profile_id, auth.uid(), 'invited', p_candidate_profile_id,
     jsonb_build_object('invitation_id', v_id));

  PERFORM public._write_audit_log(
    auth.uid(), 'talent_sourcing.invited', 'talent_sourcing_invitations', v_id, NULL,
    jsonb_build_object('candidate_profile_id', p_candidate_profile_id, 'job_id', p_job_id));

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.withdraw_talent_invitation(p_invitation_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_row public.talent_sourcing_invitations%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT * INTO v_row FROM public.talent_sourcing_invitations WHERE id = p_invitation_id;
  IF NOT FOUND OR NOT public.can_source_talent(v_row.business_profile_id, true) THEN
    RAISE EXCEPTION 'invitation not found' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF v_row.state NOT IN ('invited', 'interested') THEN
    RAISE EXCEPTION 'invitation cannot be withdrawn';
  END IF;

  UPDATE public.talent_sourcing_invitations
     SET state = 'withdrawn'
   WHERE id = p_invitation_id;

  INSERT INTO public.talent_sourcing_events
    (hiring_role_id, business_profile_id, actor_user_id, event_type, candidate_profile_id, payload)
  VALUES
    (v_row.hiring_role_id, v_row.business_profile_id, auth.uid(), 'invitation_withdrawn',
     v_row.candidate_profile_id, jsonb_build_object('invitation_id', p_invitation_id));

  PERFORM public._write_audit_log(
    auth.uid(), 'talent_sourcing.invitation_withdrawn', 'talent_sourcing_invitations',
    p_invitation_id, jsonb_build_object('state', v_row.state), jsonb_build_object('state', 'withdrawn'));

  RETURN p_invitation_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.respond_talent_invitation(
  p_invitation_id uuid,
  p_decision text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_row public.talent_sourcing_invitations%ROWTYPE;
  v_state public.talent_invitation_state_enum;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF p_decision NOT IN ('interested', 'declined') THEN
    RAISE EXCEPTION 'decision must be interested or declined';
  END IF;
  v_state := p_decision::public.talent_invitation_state_enum;

  SELECT * INTO v_row FROM public.talent_sourcing_invitations WHERE id = p_invitation_id;
  IF NOT FOUND OR v_row.candidate_profile_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'invitation not found' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF v_row.state <> 'invited' THEN
    RAISE EXCEPTION 'invitation is not awaiting a response';
  END IF;

  UPDATE public.talent_sourcing_invitations
     SET state = v_state, responded_at = timezone('utc', now())
   WHERE id = p_invitation_id;

  INSERT INTO public.talent_sourcing_events
    (hiring_role_id, business_profile_id, actor_user_id, event_type, candidate_profile_id, payload)
  VALUES
    (v_row.hiring_role_id, v_row.business_profile_id, auth.uid(), 'invitation_responded',
     auth.uid(), jsonb_build_object('invitation_id', p_invitation_id, 'decision', p_decision));

  PERFORM public._write_audit_log(
    auth.uid(), 'talent_sourcing.invitation_responded', 'talent_sourcing_invitations',
    p_invitation_id, jsonb_build_object('state', 'invited'), jsonb_build_object('state', p_decision));

  RETURN p_invitation_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.hiring_sourcing_intelligence(p_job_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_role public.hiring_roles%ROWTYPE;
  v_since timestamptz := timezone('utc', now()) - interval '30 days';
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT r.* INTO v_role FROM public.hiring_roles r WHERE r.job_id = p_job_id;
  IF NOT FOUND OR NOT public.can_source_talent(v_role.business_profile_id, false) THEN
    RAISE EXCEPTION 'opportunity not found' USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN jsonb_build_object(
    'hiringRoleId', v_role.id,
    'generatedAt', timezone('utc', now()),
    'counts', jsonb_build_object(
      'sourcedCandidates', (
        SELECT COUNT(DISTINCT profile_id)
        FROM public.talent_sourcing_events e
        CROSS JOIN LATERAL jsonb_array_elements_text(
          COALESCE(e.payload -> 'profile_ids', '[]'::jsonb)
        ) AS profile_id
        WHERE e.hiring_role_id = v_role.id
          AND e.created_at >= v_since
          AND e.event_type = 'search'
          AND profile_id ~ '^[0-9a-f-]{36}$'
      ),
      'invitationsSent', (
        SELECT COUNT(*) FROM public.talent_sourcing_invitations
        WHERE hiring_role_id = v_role.id AND created_at >= v_since
      ),
      'responses', (
        SELECT COUNT(*) FROM public.talent_sourcing_invitations
        WHERE hiring_role_id = v_role.id
          AND state IN ('interested', 'declined')
          AND COALESCE(responded_at, created_at) >= v_since
      ),
      'applicationsFromSourcing', (
        SELECT COUNT(*) FROM public.talent_sourcing_invitations
        WHERE hiring_role_id = v_role.id
          AND application_id IS NOT NULL
          AND created_at >= v_since
      ),
      'criterionCount', (
        SELECT COUNT(*) FROM public.hiring_criteria WHERE hiring_role_id = v_role.id
      )
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.search_discoverable_talent(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.invite_discoverable_talent(uuid, uuid, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.withdraw_talent_invitation(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.respond_talent_invitation(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.hiring_sourcing_intelligence(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_discoverable_talent(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.invite_discoverable_talent(uuid, uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.withdraw_talent_invitation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_talent_invitation(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.hiring_sourcing_intelligence(uuid) TO authenticated;

ALTER TABLE public.talent_sourcing_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talent_sourcing_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY talent_invitations_candidate_read ON public.talent_sourcing_invitations
  FOR SELECT TO authenticated
  USING (candidate_profile_id = auth.uid());

CREATE POLICY talent_invitations_employer_read ON public.talent_sourcing_invitations
  FOR SELECT TO authenticated
  USING (public.can_source_talent(business_profile_id, false));

CREATE POLICY talent_events_employer_read ON public.talent_sourcing_events
  FOR SELECT TO authenticated
  USING (public.can_source_talent(business_profile_id, false));

REVOKE ALL ON TABLE public.talent_sourcing_invitations FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.talent_sourcing_events FROM PUBLIC, anon;
GRANT SELECT ON TABLE public.talent_sourcing_invitations TO authenticated;
GRANT SELECT ON TABLE public.talent_sourcing_events TO authenticated;
