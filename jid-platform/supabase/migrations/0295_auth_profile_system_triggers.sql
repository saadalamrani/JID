-- Profile completion scoring, auto-award badges, company badge cron (Section 7)
-- Runs after auth foundation columns exist (029).

-- ---------------------------------------------------------------------------
-- Section 7.2 — profile completion scoring
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.recalculate_profile_completion(p_profile_id uuid)
RETURNS smallint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.profiles%ROWTYPE;
  v_skill_count integer;
  v_linkedin_present boolean;
  v_score smallint := 0;
BEGIN
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_profile_id;
  IF v_profile.id IS NULL THEN
    RETURN 0;
  END IF;

  SELECT count(*)::integer
  INTO v_skill_count
  FROM public.profile_skills ps
  WHERE ps.profile_id = p_profile_id;

  v_linkedin_present := coalesce(
    nullif(trim(v_profile.linkedin_url), ''),
    nullif(trim(v_profile.smart_links ->> 'linkedin'), '')
  ) IS NOT NULL;

  IF coalesce(nullif(trim(v_profile.avatar_url), ''), null) IS NOT NULL THEN
    v_score := v_score + 5;
  END IF;

  IF coalesce(nullif(trim(v_profile.headline), ''), null) IS NOT NULL THEN
    v_score := v_score + 10;
  END IF;

  IF coalesce(nullif(trim(v_profile.about_me), ''), null) IS NOT NULL THEN
    v_score := v_score + 15;
  END IF;

  IF v_profile.university_id IS NOT NULL THEN
    v_score := v_score + 15;
  END IF;

  IF v_profile.college_id IS NOT NULL THEN
    v_score := v_score + 10;
  END IF;

  IF v_skill_count > 0 THEN
    v_score := v_score + 20;
  END IF;

  IF cardinality(v_profile.target_sectors) > 0 THEN
    v_score := v_score + 15;
  END IF;

  IF v_linkedin_present THEN
    v_score := v_score + 10;
  END IF;

  UPDATE public.profiles
  SET
    profile_completion_pct = v_score,
    profile_state = CASE
      WHEN v_profile.deleted_at IS NOT NULL THEN 'deleted'::public.profile_state_enum
      WHEN v_profile.suspended_at IS NOT NULL THEN 'suspended'::public.profile_state_enum
      WHEN v_score >= 100 THEN 'active'::public.profile_state_enum
      ELSE 'incomplete'::public.profile_state_enum
    END,
    updated_at = now()
  WHERE id = p_profile_id;

  RETURN v_score;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_recalculate_profile_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.recalculate_profile_completion(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_recalculate_completion ON public.profiles;

CREATE TRIGGER trg_profiles_recalculate_completion
  AFTER INSERT OR UPDATE OF
    avatar_url,
    headline,
    about_me,
    university_id,
    college_id,
    target_sectors,
    linkedin_url,
    smart_links,
    deleted_at,
    suspended_at
  ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_recalculate_profile_completion();

CREATE OR REPLACE FUNCTION public.trg_profile_skills_recalculate_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.recalculate_profile_completion(
    CASE WHEN TG_OP = 'DELETE' THEN OLD.profile_id ELSE NEW.profile_id END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_profile_skills_recalculate_completion ON public.profile_skills;

CREATE TRIGGER trg_profile_skills_recalculate_completion
  AFTER INSERT OR DELETE ON public.profile_skills
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_profile_skills_recalculate_completion();

-- ---------------------------------------------------------------------------
-- Section 7.1 — auto-award badge triggers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.award_user_badge(p_user_id uuid, p_slug text, p_metadata jsonb DEFAULT '{}'::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_badge_id uuid;
BEGIN
  SELECT id INTO v_badge_id
  FROM public.badges_catalog
  WHERE slug = p_slug AND is_active = true;

  IF v_badge_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.user_badges (user_id, badge_id, metadata)
  VALUES (p_user_id, v_badge_id, p_metadata)
  ON CONFLICT (user_id, badge_id) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.award_entity_badge(
  p_entity_type text,
  p_entity_id uuid,
  p_slug text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_badge_id uuid;
BEGIN
  SELECT id INTO v_badge_id
  FROM public.badges_catalog
  WHERE slug = p_slug AND is_active = true;

  IF v_badge_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.entity_badges (entity_type, entity_id, badge_id, metadata)
  VALUES (p_entity_type, p_entity_id, v_badge_id, p_metadata)
  ON CONFLICT (entity_type, entity_id, badge_id) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_entity_badge(p_entity_type text, p_entity_id uuid, p_slug text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_badge_id uuid;
BEGIN
  SELECT id INTO v_badge_id FROM public.badges_catalog WHERE slug = p_slug;

  IF v_badge_id IS NULL THEN
    RETURN;
  END IF;

  DELETE FROM public.entity_badges
  WHERE entity_type = p_entity_type
    AND entity_id = p_entity_id
    AND badge_id = v_badge_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.award_verified_badge()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (
    (NEW.phone_verified_at IS NOT NULL AND OLD.phone_verified_at IS NULL)
    OR (NEW.email_verified_at IS NOT NULL AND OLD.email_verified_at IS NULL)
  ) THEN
    PERFORM public.award_user_badge(NEW.id, 'verified', jsonb_build_object('source', 'profile_verification'));
  END IF;

  IF NEW.profile_completion_pct >= 100 AND COALESCE(OLD.profile_completion_pct, 0) < 100 THEN
    PERFORM public.award_user_badge(NEW.id, 'profile_complete', jsonb_build_object('source', 'completion_trigger'));
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_award_verified_badge ON public.profiles;

CREATE TRIGGER trg_profiles_award_verified_badge
  AFTER UPDATE OF phone_verified_at, email_verified_at, profile_completion_pct
  ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.award_verified_badge();

CREATE OR REPLACE FUNCTION public.award_cv_builder_badge()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.award_user_badge(NEW.user_id, 'cv_builder', jsonb_build_object('cv_id', NEW.id));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cvs_award_cv_builder_badge ON public.cvs;

CREATE TRIGGER trg_cvs_award_cv_builder_badge
  AFTER INSERT ON public.cvs
  FOR EACH ROW
  EXECUTE FUNCTION public.award_cv_builder_badge();

CREATE OR REPLACE FUNCTION public.award_mentorship_active_badge()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM 'completed' AND NEW.status = 'completed' THEN
    PERFORM public.award_user_badge(
      NEW.mentor_id,
      'mentorship_active',
      jsonb_build_object('meeting_id', NEW.id, 'role', 'mentor')
    );
    PERFORM public.award_user_badge(
      NEW.mentee_id,
      'mentorship_graduate',
      jsonb_build_object('meeting_id', NEW.id, 'role', 'mentee')
    );
    NEW.completed_at := coalesce(NEW.completed_at, now());
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mentorship_meetings_award_badges ON public.mentorship_meetings;

CREATE TRIGGER trg_mentorship_meetings_award_badges
  BEFORE UPDATE OF status ON public.mentorship_meetings
  FOR EACH ROW
  EXECUTE FUNCTION public.award_mentorship_active_badge();

-- ---------------------------------------------------------------------------
-- Section 7.1 — company badge refresh (cron every 6h)
-- ---------------------------------------------------------------------------

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
    SELECT id, commitment_score, avg_response_days, response_rate_pct, entity_state, is_on_honor_roll
    FROM public.companies
    WHERE entity_type = 'company'
  LOOP
    IF coalesce(v_company.commitment_score, 0) >= 80 THEN
      PERFORM public.award_entity_badge(
        'company',
        v_company.id,
        'jid_partner',
        jsonb_build_object('commitment_score', v_company.commitment_score)
      );
    ELSE
      PERFORM public.remove_entity_badge('company', v_company.id, 'jid_partner');
    END IF;

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

    IF v_company.entity_state = 'claimed' THEN
      PERFORM public.award_entity_badge(
        'company',
        v_company.id,
        'verified_entity',
        jsonb_build_object('entity_state', v_company.entity_state)
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

REVOKE ALL ON FUNCTION public.refresh_company_badges() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_company_badges() TO service_role;

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

DO $$
DECLARE
  v_job_id bigint;
BEGIN
  SELECT jobid INTO v_job_id FROM cron.job WHERE jobname = 'refresh-company-badges-6h' LIMIT 1;
  IF v_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(v_job_id);
  END IF;
END;
$$;

SELECT cron.schedule(
  'refresh-company-badges-6h',
  '0 */6 * * *',
  $$ SELECT public.refresh_company_badges(); $$
);
