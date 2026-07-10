-- 089_kill_commitment_score.sql — Prompt 0 / logical migration 040
-- Kill Commitment Score: cron SLA flatten, badge purge, column archive + drop.

-- ---------------------------------------------------------------------------
-- STEP 1: Flatten expire_stale_applications (remove commitment_score SLA tiers)
-- Preserves 052 email-outbox queue; uses uniform 30-day SLA (former default tier).
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.expire_stale_applications()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  WITH expired AS (
    UPDATE public.applications a
    SET
      status = 'expired',
      expires_at = coalesce(a.expires_at, now()),
      updated_at = now()
    FROM public.jobs j
    WHERE a.job_id = j.id
      AND a.status IN ('submitted', 'under_review')
      AND a.submitted_at IS NOT NULL
      AND now() >= a.submitted_at + interval '30 days'
    RETURNING
      a.id,
      a.applicant_id,
      a.job_id,
      a.contact_email,
      j.title_ar,
      j.title_en,
      j.company_id
  ),
  queued AS (
    INSERT INTO public.email_outbox (template, payload, status)
    SELECT
      'application_expiry',
      jsonb_build_object(
        'application_id', e.id,
        'applicant_id', e.applicant_id,
        'job_id', e.job_id,
        'contact_email', e.contact_email,
        'job_title_ar', e.title_ar,
        'job_title_en', e.title_en,
        'company_name', coalesce(c.name_ar, c.name)
      ),
      'pending'
    FROM expired e
    JOIN public.companies c ON c.id = e.company_id
    RETURNING 1
  )
  SELECT count(*)::integer INTO v_count FROM expired;

  RETURN coalesce(v_count, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.expire_stale_applications() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.expire_stale_applications() TO service_role;

-- ---------------------------------------------------------------------------
-- STEP 2: Remove jid_partner badge automation + purge awarded instances
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
    SELECT id, avg_response_days, response_rate_pct, entity_state, is_on_honor_roll
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

    IF v_company.entity_state = 'approved' THEN
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

DELETE FROM public.entity_badges eb
USING public.badges_catalog bc
WHERE eb.badge_id = bc.id
  AND bc.slug = 'jid_partner';

UPDATE public.badges_catalog
SET is_active = false, is_auto_awarded = false
WHERE slug = 'jid_partner';

-- ---------------------------------------------------------------------------
-- STEP 3: Archive then drop companies.commitment_score
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public._deprecated_commitment_scores (
  company_id uuid PRIMARY KEY,
  commitment_score numeric(5, 2) NOT NULL,
  archived_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public._deprecated_commitment_scores (company_id, commitment_score, archived_at)
SELECT id, commitment_score, now()
FROM public.companies
WHERE commitment_score IS NOT NULL
ON CONFLICT (company_id) DO UPDATE
SET
  commitment_score = EXCLUDED.commitment_score,
  archived_at = EXCLUDED.archived_at;

DROP INDEX IF EXISTS public.idx_companies_commitment_score;

ALTER TABLE public.companies
  DROP CONSTRAINT IF EXISTS companies_commitment_score_chk;

ALTER TABLE public.companies
  DROP COLUMN IF EXISTS commitment_score;
