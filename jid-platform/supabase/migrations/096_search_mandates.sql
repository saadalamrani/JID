-- 096_search_mandates.sql — ابحثلي (Search For Me) Plus mandates + matching engine (Prompt 2)
-- Master doc names 045; 045 is sectors_display_order — using 096.

-- ---------------------------------------------------------------------------
-- Notification category for mandate matches
-- ---------------------------------------------------------------------------

ALTER TYPE public.notification_category_enum ADD VALUE IF NOT EXISTS 'search.mandate_match';

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.search_mandates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sectors TEXT[] NOT NULL DEFAULT '{}',
  regions TEXT[] NOT NULL DEFAULT '{}',
  ownership_types public.ownership_enum[] NOT NULL DEFAULT '{}',
  experience_levels public.experience_level_enum[] NOT NULL DEFAULT '{}',
  keywords TEXT[] NOT NULL DEFAULT '{}',
  include_lammah BOOLEAN NOT NULL DEFAULT true,
  digest_frequency TEXT NOT NULL DEFAULT 'instant' CHECK (digest_frequency IN ('instant', 'daily')),
  weight_overrides JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_run_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_mandates_active
  ON public.search_mandates (is_active)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_mandates_user_active
  ON public.search_mandates (user_id, is_active);

CREATE TABLE IF NOT EXISTS public.mandate_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id UUID NOT NULL REFERENCES public.search_mandates(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  lammah_id UUID REFERENCES public.lammah_opportunities(id) ON DELETE CASCADE,
  score NUMERIC(5, 2) NOT NULL,
  match_reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  matched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  seen_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  dismissed_reason TEXT,
  CONSTRAINT mandate_matches_one_target_chk CHECK (
    (job_id IS NOT NULL AND lammah_id IS NULL)
    OR (job_id IS NULL AND lammah_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mandate_matches_job
  ON public.mandate_matches (mandate_id, job_id)
  WHERE job_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mandate_matches_lammah
  ON public.mandate_matches (mandate_id, lammah_id)
  WHERE lammah_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_matches_mandate
  ON public.mandate_matches (mandate_id, matched_at DESC);

CREATE INDEX IF NOT EXISTS idx_matches_unseen
  ON public.mandate_matches (mandate_id, matched_at DESC)
  WHERE seen_at IS NULL AND dismissed_at IS NULL;

-- ---------------------------------------------------------------------------
-- Entitlement helper for sweep (any user)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.user_has_feature_entitlement(p_user_id UUID, p_feature TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.subscriptions s
    JOIN public.plan_entitlements pe ON pe.plan_id = s.plan_id
    WHERE s.subscriber_type = 'user'
      AND s.user_id = p_user_id
      AND s.status IN ('active', 'trialing')
      AND s.current_period_end > NOW()
      AND pe.feature_key = p_feature
  );
$$;

-- ---------------------------------------------------------------------------
-- Scoring helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.mandate_dimension_weight(
  p_mandate public.search_mandates,
  p_dimension TEXT,
  p_base NUMERIC
)
RETURNS NUMERIC
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT GREATEST(0::numeric, p_base + COALESCE((p_mandate.weight_overrides ->> p_dimension)::numeric, 0));
$$;

CREATE OR REPLACE FUNCTION public.compute_mandate_item_score(
  p_mandate public.search_mandates,
  p_sector TEXT,
  p_region TEXT,
  p_ownership public.ownership_enum,
  p_experience public.experience_level_enum,
  p_title_ar TEXT,
  p_title_en TEXT,
  p_required_skills TEXT[]
)
RETURNS TABLE(score NUMERIC, reasons JSONB)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_score NUMERIC := 0;
  v_reasons JSONB := '[]'::jsonb;
  v_title TEXT;
  v_kw TEXT;
  v_sector_w NUMERIC;
  v_region_w NUMERIC;
  v_keyword_w NUMERIC;
  v_exp_w NUMERIC;
  v_own_w NUMERIC;
BEGIN
  v_sector_w := public.mandate_dimension_weight(p_mandate, 'sector', 0.30);
  v_region_w := public.mandate_dimension_weight(p_mandate, 'region', 0.25);
  v_keyword_w := public.mandate_dimension_weight(p_mandate, 'keyword', 0.25);
  v_exp_w := public.mandate_dimension_weight(p_mandate, 'experience', 0.15);
  v_own_w := public.mandate_dimension_weight(p_mandate, 'ownership', 0.05);

  IF cardinality(p_mandate.sectors) = 0 OR p_sector = ANY (p_mandate.sectors) THEN
    v_score := v_score + v_sector_w;
    IF cardinality(p_mandate.sectors) > 0 THEN
      v_reasons := v_reasons || to_jsonb(ARRAY['sector']);
    END IF;
  END IF;

  IF cardinality(p_mandate.regions) = 0 OR p_region = ANY (p_mandate.regions) THEN
    v_score := v_score + v_region_w;
    IF cardinality(p_mandate.regions) > 0 THEN
      v_reasons := v_reasons || to_jsonb(ARRAY['region']);
    END IF;
  END IF;

  IF cardinality(p_mandate.ownership_types) = 0
     OR (p_ownership IS NOT NULL AND p_ownership = ANY (p_mandate.ownership_types)) THEN
    v_score := v_score + v_own_w;
    IF cardinality(p_mandate.ownership_types) > 0 THEN
      v_reasons := v_reasons || to_jsonb(ARRAY['ownership']);
    END IF;
  END IF;

  IF cardinality(p_mandate.experience_levels) = 0
     OR (p_experience IS NOT NULL AND p_experience = ANY (p_mandate.experience_levels)) THEN
    v_score := v_score + v_exp_w;
    IF cardinality(p_mandate.experience_levels) > 0 THEN
      v_reasons := v_reasons || to_jsonb(ARRAY['experience']);
    END IF;
  END IF;

  v_title := lower(COALESCE(p_title_ar, '') || ' ' || COALESCE(p_title_en, ''));

  IF cardinality(p_mandate.keywords) = 0 THEN
    v_score := v_score + v_keyword_w;
  ELSE
    FOREACH v_kw IN ARRAY p_mandate.keywords LOOP
      IF v_title LIKE '%' || lower(v_kw) || '%'
         OR EXISTS (
           SELECT 1 FROM unnest(COALESCE(p_required_skills, '{}'::text[])) s(skill)
           WHERE lower(skill) LIKE '%' || lower(v_kw) || '%'
         ) THEN
        v_score := v_score + v_keyword_w;
        v_reasons := v_reasons || to_jsonb(ARRAY['keyword:' || v_kw]);
        EXIT;
      END IF;
    END LOOP;
  END IF;

  RETURN QUERY SELECT ROUND(LEAST(v_score, 1.00), 2), v_reasons;
END;
$$;

-- ---------------------------------------------------------------------------
-- Match insert + notification (engine-only write path)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.insert_mandate_match(
  p_mandate_id UUID,
  p_job_id UUID,
  p_lammah_id UUID,
  p_score NUMERIC,
  p_reasons JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mandate public.search_mandates%ROWTYPE;
  v_match_id UUID;
  v_title_ar TEXT;
  v_title_en TEXT;
  v_action_url TEXT;
BEGIN
  SELECT * INTO v_mandate FROM public.search_mandates WHERE id = p_mandate_id AND is_active = true;
  IF v_mandate IS NULL THEN RETURN NULL; END IF;

  IF NOT public.user_has_feature_entitlement(v_mandate.user_id, 'search_for_me') THEN
    RETURN NULL;
  END IF;

  IF p_score < 0.55 THEN RETURN NULL; END IF;

  IF p_job_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.mandate_matches WHERE mandate_id = p_mandate_id AND job_id = p_job_id
  ) THEN RETURN NULL; END IF;

  IF p_lammah_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.mandate_matches WHERE mandate_id = p_mandate_id AND lammah_id = p_lammah_id
  ) THEN RETURN NULL; END IF;

  INSERT INTO public.mandate_matches (mandate_id, job_id, lammah_id, score, match_reasons)
  VALUES (p_mandate_id, p_job_id, p_lammah_id, p_score, p_reasons)
  RETURNING id INTO v_match_id;

  IF v_match_id IS NULL THEN RETURN NULL; END IF;

  IF p_job_id IS NOT NULL THEN
    SELECT j.title_ar, j.title_en
    INTO v_title_ar, v_title_en
    FROM public.jobs j WHERE j.id = p_job_id;
    v_action_url := '/opportunities?abhathliMatch=' || v_match_id::text;
  ELSE
    SELECT lo.title_ar, lo.title_en
    INTO v_title_ar, v_title_en
    FROM public.lammah_opportunities lo WHERE lo.id = p_lammah_id;
    v_action_url := '/opportunities?abhathliMatch=' || v_match_id::text || '&tab=lammah';
  END IF;

  IF v_mandate.digest_frequency = 'instant' THEN
    PERFORM public.dispatch_notification(
      v_mandate.user_id,
      'search.mandate_match'::public.notification_category_enum,
      'ابحثلي وجدت فرصة لك',
      'Search For Me found a match',
      COALESCE(v_title_ar, v_title_en, 'فرصة جديدة'),
      COALESCE(v_title_en, v_title_ar, 'New opportunity'),
      'normal',
      v_action_url,
      'عرض المطابقة',
      'View match',
      CASE WHEN p_job_id IS NOT NULL THEN 'job' ELSE 'lammah_opportunity' END,
      COALESCE(p_job_id, p_lammah_id),
      'mandate_match:' || v_match_id::text,
      jsonb_build_object('mandate_id', p_mandate_id, 'match_id', v_match_id)
    );
  END IF;

  UPDATE public.search_mandates SET last_run_at = NOW(), updated_at = NOW() WHERE id = p_mandate_id;

  RETURN v_match_id;
END;
$$;

REVOKE ALL ON FUNCTION public.insert_mandate_match(UUID, UUID, UUID, NUMERIC, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.insert_mandate_match(UUID, UUID, UUID, NUMERIC, JSONB) TO service_role;

-- ---------------------------------------------------------------------------
-- Publish triggers — single item vs all active mandates
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.run_mandate_matching_for_job(p_job_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job RECORD;
  v_mandate public.search_mandates%ROWTYPE;
  v_score NUMERIC;
  v_reasons JSONB;
  v_inserted INTEGER := 0;
BEGIN
  SELECT
    j.id,
    j.title_ar,
    j.title_en,
    j.experience_level,
    j.required_skills,
    s.slug AS sector_slug,
    r.slug AS region_slug,
    c.ownership_type
  INTO v_job
  FROM public.jobs j
  JOIN public.companies c ON c.id = j.company_id
  LEFT JOIN public.sectors s ON s.id = j.sector_id
  LEFT JOIN public.regions r ON r.id = j.region_id
  WHERE j.id = p_job_id
    AND j.status IN ('published', 'closing_soon');

  IF v_job IS NULL THEN RETURN 0; END IF;

  FOR v_mandate IN
    SELECT sm.*
    FROM public.search_mandates sm
    WHERE sm.is_active = true
      AND public.user_has_feature_entitlement(sm.user_id, 'search_for_me')
      AND (cardinality(sm.sectors) = 0 OR v_job.sector_slug = ANY (sm.sectors))
      AND (cardinality(sm.regions) = 0 OR v_job.region_slug = ANY (sm.regions))
  LOOP
    SELECT cs.score, cs.reasons INTO v_score, v_reasons
    FROM public.compute_mandate_item_score(
      v_mandate,
      v_job.sector_slug,
      v_job.region_slug,
      v_job.ownership_type,
      v_job.experience_level,
      v_job.title_ar,
      v_job.title_en,
      v_job.required_skills
    ) cs;

    IF public.insert_mandate_match(v_mandate.id, p_job_id, NULL, v_score, v_reasons) IS NOT NULL THEN
      v_inserted := v_inserted + 1;
    END IF;
  END LOOP;

  RETURN v_inserted;
END;
$$;

CREATE OR REPLACE FUNCTION public.run_mandate_matching_for_lammah(p_lammah_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item RECORD;
  v_mandate public.search_mandates%ROWTYPE;
  v_score NUMERIC;
  v_reasons JSONB;
  v_inserted INTEGER := 0;
BEGIN
  SELECT
    lo.id,
    lo.title_ar,
    lo.title_en,
    lo.sector,
    lo.region,
    lo.ownership_type,
    lo.experience_level
  INTO v_item
  FROM public.lammah_opportunities lo
  WHERE lo.id = p_lammah_id
    AND lo.status = 'active'
    AND lo.expires_at > NOW();

  IF v_item IS NULL THEN RETURN 0; END IF;

  FOR v_mandate IN
    SELECT sm.*
    FROM public.search_mandates sm
    WHERE sm.is_active = true
      AND sm.include_lammah = true
      AND public.user_has_feature_entitlement(sm.user_id, 'search_for_me')
      AND (cardinality(sm.sectors) = 0 OR v_item.sector = ANY (sm.sectors))
      AND (cardinality(sm.regions) = 0 OR v_item.region = ANY (sm.regions))
  LOOP
    SELECT cs.score, cs.reasons INTO v_score, v_reasons
    FROM public.compute_mandate_item_score(
      v_mandate,
      v_item.sector,
      v_item.region,
      v_item.ownership_type,
      v_item.experience_level,
      v_item.title_ar,
      v_item.title_en,
      '{}'::text[]
    ) cs;

    IF public.insert_mandate_match(v_mandate.id, NULL, p_lammah_id, v_score, v_reasons) IS NOT NULL THEN
      v_inserted := v_inserted + 1;
    END IF;
  END LOOP;

  RETURN v_inserted;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_mandate_match_on_job_publish()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IN ('published', 'closing_soon')
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
    PERFORM public.run_mandate_matching_for_job(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mandate_match_job ON public.jobs;
CREATE TRIGGER trg_mandate_match_job
  AFTER INSERT OR UPDATE OF status ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_mandate_match_on_job_publish();

CREATE OR REPLACE FUNCTION public.trg_mandate_match_on_lammah_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'active' THEN
    PERFORM public.run_mandate_matching_for_lammah(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mandate_match_lammah ON public.lammah_opportunities;
CREATE TRIGGER trg_mandate_match_lammah
  AFTER INSERT ON public.lammah_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_mandate_match_on_lammah_insert();

-- ---------------------------------------------------------------------------
-- Hourly sweep — missed items + Plus lapse deactivation
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.sweep_mandate_matching()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job_id UUID;
  v_lammah_id UUID;
BEGIN
  UPDATE public.search_mandates sm
  SET is_active = false, updated_at = NOW()
  WHERE sm.is_active = true
    AND NOT public.user_has_feature_entitlement(sm.user_id, 'search_for_me');

  FOR v_job_id IN
    SELECT j.id
    FROM public.jobs j
    WHERE j.status IN ('published', 'closing_soon')
      AND j.published_at >= NOW() - INTERVAL '48 hours'
  LOOP
    PERFORM public.run_mandate_matching_for_job(v_job_id);
  END LOOP;

  FOR v_lammah_id IN
    SELECT lo.id
    FROM public.lammah_opportunities lo
    WHERE lo.status = 'active'
      AND lo.expires_at > NOW()
      AND lo.scraped_at >= NOW() - INTERVAL '48 hours'
  LOOP
    PERFORM public.run_mandate_matching_for_lammah(v_lammah_id);
  END LOOP;
END;
$$;

SELECT cron.schedule(
  'sweep-mandate-matching',
  '15 * * * *',
  $$SELECT public.sweep_mandate_matching();$$
);

-- ---------------------------------------------------------------------------
-- Mandate CRUD (quota max 3 active)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_search_mandate(p JSONB)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_active INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required'; END IF;
  IF NOT public.has_entitlement('search_for_me') THEN RAISE EXCEPTION 'plus_required'; END IF;

  SELECT COUNT(*)::INTEGER INTO v_active
  FROM public.search_mandates
  WHERE user_id = auth.uid() AND is_active = true;

  IF v_active >= 3 THEN RAISE EXCEPTION 'mandate_quota_exceeded'; END IF;

  INSERT INTO public.search_mandates (
    user_id,
    name,
    sectors,
    regions,
    ownership_types,
    experience_levels,
    keywords,
    include_lammah,
    digest_frequency
  )
  VALUES (
    auth.uid(),
    trim(p->>'name'),
    COALESCE(ARRAY(SELECT jsonb_array_elements_text(p->'sectors')), '{}'::text[]),
    COALESCE(ARRAY(SELECT jsonb_array_elements_text(p->'regions')), '{}'::text[]),
    COALESCE(
      ARRAY(SELECT jsonb_array_elements_text(p->'ownership_types'))::public.ownership_enum[],
      '{}'::public.ownership_enum[]
    ),
    COALESCE(
      ARRAY(SELECT jsonb_array_elements_text(p->'experience_levels'))::public.experience_level_enum[],
      '{}'::public.experience_level_enum[]
    ),
    COALESCE(ARRAY(SELECT jsonb_array_elements_text(p->'keywords')), '{}'::text[]),
    COALESCE((p->>'include_lammah')::boolean, true),
    COALESCE(NULLIF(p->>'digest_frequency', ''), 'instant')
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_search_mandate(p_id UUID, p JSONB)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required'; END IF;
  IF NOT public.has_entitlement('search_for_me') THEN RAISE EXCEPTION 'plus_required'; END IF;

  IF COALESCE((p->>'is_active')::boolean, false) = true THEN
    IF (
      SELECT COUNT(*)::INTEGER FROM public.search_mandates
      WHERE user_id = auth.uid() AND is_active = true AND id <> p_id
    ) >= 3 THEN
      RAISE EXCEPTION 'mandate_quota_exceeded';
    END IF;
  END IF;

  UPDATE public.search_mandates
  SET
    name = COALESCE(NULLIF(trim(p->>'name'), ''), name),
    is_active = COALESCE((p->>'is_active')::boolean, is_active),
    sectors = COALESCE(ARRAY(SELECT jsonb_array_elements_text(p->'sectors')), sectors),
    regions = COALESCE(ARRAY(SELECT jsonb_array_elements_text(p->'regions')), regions),
    ownership_types = COALESCE(
      ARRAY(SELECT jsonb_array_elements_text(p->'ownership_types'))::public.ownership_enum[],
      ownership_types
    ),
    experience_levels = COALESCE(
      ARRAY(SELECT jsonb_array_elements_text(p->'experience_levels'))::public.experience_level_enum[],
      experience_levels
    ),
    keywords = COALESCE(ARRAY(SELECT jsonb_array_elements_text(p->'keywords')), keywords),
    include_lammah = COALESCE((p->>'include_lammah')::boolean, include_lammah),
    digest_frequency = COALESCE(NULLIF(p->>'digest_frequency', ''), digest_frequency),
    updated_at = NOW()
  WHERE id = p_id AND user_id = auth.uid();

  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.dismiss_mandate_match(p_match_id UUID, p_reason TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mandate_id UUID;
  v_dim TEXT;
  v_delta NUMERIC;
BEGIN
  SELECT mm.mandate_id INTO v_mandate_id
  FROM public.mandate_matches mm
  JOIN public.search_mandates sm ON sm.id = mm.mandate_id
  WHERE mm.id = p_match_id AND sm.user_id = auth.uid();

  IF v_mandate_id IS NULL THEN RETURN false; END IF;

  UPDATE public.mandate_matches
  SET dismissed_at = NOW(), dismissed_reason = p_reason
  WHERE id = p_match_id;

  v_dim := CASE p_reason
    WHEN 'wrong_city' THEN 'region'
    WHEN 'wrong_level' THEN 'experience'
    ELSE 'keyword'
  END;
  v_delta := CASE p_reason
    WHEN 'not_interested' THEN -0.05
    ELSE -0.10
  END;

  UPDATE public.search_mandates
  SET weight_overrides = weight_overrides || jsonb_build_object(
    v_dim,
    COALESCE((weight_overrides ->> v_dim)::numeric, 0) + v_delta
  ),
  updated_at = NOW()
  WHERE id = v_mandate_id;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_mandate_matches_seen(p_mandate_id UUID DEFAULT NULL)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN RETURN 0; END IF;

  UPDATE public.mandate_matches mm
  SET seen_at = NOW()
  FROM public.search_mandates sm
  WHERE mm.mandate_id = sm.id
    AND sm.user_id = auth.uid()
    AND mm.seen_at IS NULL
    AND mm.dismissed_at IS NULL
    AND (p_mandate_id IS NULL OR mm.mandate_id = p_mandate_id);

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.abhathli_unseen_match_count()
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.mandate_matches mm
  JOIN public.search_mandates sm ON sm.id = mm.mandate_id
  WHERE sm.user_id = auth.uid()
    AND sm.is_active = true
    AND mm.seen_at IS NULL
    AND mm.dismissed_at IS NULL;
$$;

GRANT EXECUTE ON FUNCTION public.create_search_mandate(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_search_mandate(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.dismiss_mandate_match(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_mandate_matches_seen(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.abhathli_unseen_match_count() TO authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.search_mandates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mandate_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS search_mandates_owner ON public.search_mandates;
CREATE POLICY search_mandates_owner
  ON public.search_mandates
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND public.has_entitlement('search_for_me'));

DROP POLICY IF EXISTS mandate_matches_owner_read ON public.mandate_matches;
CREATE POLICY mandate_matches_owner_read
  ON public.mandate_matches
  FOR SELECT
  USING (
    mandate_id IN (SELECT id FROM public.search_mandates WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS mandate_matches_owner_update ON public.mandate_matches;
CREATE POLICY mandate_matches_owner_update
  ON public.mandate_matches
  FOR UPDATE
  USING (
    mandate_id IN (SELECT id FROM public.search_mandates WHERE user_id = auth.uid())
  )
  WITH CHECK (
    mandate_id IN (SELECT id FROM public.search_mandates WHERE user_id = auth.uid())
  );

COMMENT ON TABLE public.search_mandates IS
  'ابحثلي persistent search mandates — max 3 active per Plus user; no auto-apply.';

COMMENT ON TABLE public.mandate_matches IS
  'Mandate match results — inserts only via insert_mandate_match (matching engine).';
