-- 095_lammah.sql — لمّاح (Lammah) Plus-exclusive scraped feed (Prompt 3)
-- Master doc names 046; 046 is catalog_search_vector — using 095.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ===========================================================================
-- Enums & tables
-- ===========================================================================

DO $$
BEGIN
  CREATE TYPE public.lammah_status_enum AS ENUM ('active', 'hidden', 'superseded', 'expired');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

CREATE TABLE IF NOT EXISTS public.lammah_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  base_url TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('career_page', 'rss', 'api', 'official_program')),
  trust_tier SMALLINT NOT NULL CHECK (trust_tier IN (1, 2)),
  is_active BOOLEAN NOT NULL DEFAULT true,
  robots_ok BOOLEAN NOT NULL DEFAULT true,
  crawl_frequency_hours INTEGER NOT NULL DEFAULT 24,
  last_crawled_at TIMESTAMPTZ,
  last_content_hash TEXT,
  consecutive_failures INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lammah_sources_active
  ON public.lammah_sources (is_active, last_crawled_at);

CREATE TABLE IF NOT EXISTS public.lammah_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES public.lammah_sources(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  company_name_raw TEXT NOT NULL,
  title_ar TEXT,
  title_en TEXT,
  excerpt TEXT,
  sector TEXT NOT NULL,
  region TEXT NOT NULL,
  ownership_type public.ownership_enum,
  experience_level public.experience_level_enum,
  external_url TEXT NOT NULL,
  external_ref_hash TEXT NOT NULL UNIQUE,
  source_published_at TIMESTAMPTZ NOT NULL,
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  status public.lammah_status_enum NOT NULL DEFAULT 'active',
  superseded_by_job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  extraction_confidence NUMERIC(3, 2) NOT NULL DEFAULT 1.0,
  hidden_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  hidden_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT lammah_opportunities_title_chk CHECK (title_ar IS NOT NULL OR title_en IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_lammah_feed
  ON public.lammah_opportunities (status, expires_at, scraped_at DESC)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_lammah_company
  ON public.lammah_opportunities (company_id)
  WHERE company_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_lammah_taxonomy
  ON public.lammah_opportunities (sector, region);

CREATE INDEX IF NOT EXISTS idx_lammah_moderation
  ON public.lammah_opportunities (status, extraction_confidence ASC, scraped_at DESC)
  WHERE status = 'hidden';

CREATE OR REPLACE FUNCTION public.set_lammah_opportunity_expires_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.expires_at := COALESCE(NEW.scraped_at, NOW()) + INTERVAL '14 days';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lammah_opportunities_expires_at ON public.lammah_opportunities;
CREATE TRIGGER trg_lammah_opportunities_expires_at
  BEFORE INSERT OR UPDATE OF scraped_at ON public.lammah_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION public.set_lammah_opportunity_expires_at();

CREATE TABLE IF NOT EXISTS public.lammah_radar_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lammah_id UUID NOT NULL REFERENCES public.lammah_opportunities(id) ON DELETE CASCADE,
  self_declared BOOLEAN NOT NULL DEFAULT false,
  declared_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, lammah_id)
);

CREATE INDEX IF NOT EXISTS idx_lammah_radar_user
  ON public.lammah_radar_items (user_id, created_at DESC);

-- ===========================================================================
-- Rule D — single write path (service role only)
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.ingest_lammah_opportunity(p JSONB)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_source public.lammah_sources%ROWTYPE;
  v_id UUID;
  v_confidence NUMERIC(3, 2);
  v_status public.lammah_status_enum;
  v_sector TEXT;
  v_region TEXT;
BEGIN
  SELECT * INTO v_source
  FROM public.lammah_sources
  WHERE id = (p->>'source_id')::UUID
    AND is_active = true;

  IF v_source IS NULL THEN
    RAISE EXCEPTION 'untrusted_or_inactive_source';
  END IF;

  IF (p->>'source_published_at')::TIMESTAMPTZ < NOW() - INTERVAL '14 days' THEN
    RAISE EXCEPTION 'stale_posting_rejected';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.lammah_opportunities
    WHERE external_ref_hash = p->>'external_ref_hash'
  ) THEN
    RETURN NULL;
  END IF;

  v_sector := NULLIF(trim(p->>'sector'), '');
  v_region := NULLIF(trim(p->>'region'), '');

  IF v_sector IS NULL OR NOT EXISTS (SELECT 1 FROM public.sectors s WHERE s.slug = v_sector) THEN
    RAISE EXCEPTION 'invalid_sector';
  END IF;

  IF v_region IS NULL OR NOT EXISTS (SELECT 1 FROM public.regions r WHERE r.slug = v_region) THEN
    RAISE EXCEPTION 'invalid_region';
  END IF;

  v_confidence := COALESCE((p->>'extraction_confidence')::NUMERIC, 1.0);
  v_status := CASE WHEN v_confidence < 0.7 THEN 'hidden'::public.lammah_status_enum ELSE 'active'::public.lammah_status_enum END;

  INSERT INTO public.lammah_opportunities (
    source_id,
    company_id,
    company_name_raw,
    title_ar,
    title_en,
    excerpt,
    sector,
    region,
    ownership_type,
    experience_level,
    external_url,
    external_ref_hash,
    source_published_at,
    extraction_confidence,
    status
  )
  VALUES (
    v_source.id,
    NULLIF(p->>'company_id', '')::UUID,
    COALESCE(NULLIF(trim(p->>'company_name_raw'), ''), v_source.name),
    NULLIF(trim(p->>'title_ar'), ''),
    NULLIF(trim(p->>'title_en'), ''),
    NULLIF(trim(p->>'excerpt'), ''),
    v_sector,
    v_region,
    NULLIF(p->>'ownership_type', '')::public.ownership_enum,
    NULLIF(p->>'experience_level', '')::public.experience_level_enum,
    p->>'external_url',
    p->>'external_ref_hash',
    (p->>'source_published_at')::TIMESTAMPTZ,
    v_confidence,
    v_status
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.ingest_lammah_opportunity(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ingest_lammah_opportunity(JSONB) TO service_role;

-- ===========================================================================
-- Rule C — TTL purge cron
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.purge_expired_lammah()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.lammah_opportunities
  WHERE expires_at < NOW();
END;
$$;

SELECT cron.schedule(
  'purge-lammah',
  '15 * * * *',
  $$SELECT public.purge_expired_lammah();$$
);

-- ===========================================================================
-- Rule F — supersede on native job publish
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.supersede_lammah_on_native_post()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status IN ('published', 'closing_soon') THEN
    UPDATE public.lammah_opportunities l
    SET
      status = 'superseded',
      superseded_by_job_id = NEW.id
    WHERE l.status = 'active'
      AND l.company_id IS NOT NULL
      AND l.company_id = NEW.company_id
      AND similarity(
        lower(COALESCE(l.title_ar, l.title_en, '')),
        lower(COALESCE(NEW.title_ar, NEW.title_en, ''))
      ) > 0.55;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_supersede_lammah ON public.jobs;

CREATE TRIGGER trg_supersede_lammah
  AFTER INSERT OR UPDATE OF status ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.supersede_lammah_on_native_post();

-- ===========================================================================
-- Staff helpers
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.is_staff_or_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('staff', 'super_admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.lammah_weekly_active_count()
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.lammah_opportunities lo
  WHERE lo.status = 'active'
    AND lo.scraped_at >= NOW() - INTERVAL '7 days';
$$;

GRANT EXECUTE ON FUNCTION public.lammah_weekly_active_count() TO anon, authenticated;

-- ===========================================================================
-- RLS — Plus exclusivity (Rule A moderation for staff)
-- ===========================================================================

ALTER TABLE public.lammah_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lammah_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lammah_radar_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lammah_sources_staff_all ON public.lammah_sources;
CREATE POLICY lammah_sources_staff_all
  ON public.lammah_sources
  FOR ALL
  USING (public.is_staff_or_super_admin())
  WITH CHECK (public.is_staff_or_super_admin());

DROP POLICY IF EXISTS lammah_opportunities_plus_read ON public.lammah_opportunities;
CREATE POLICY lammah_opportunities_plus_read
  ON public.lammah_opportunities
  FOR SELECT
  USING (
    (
      status = 'active'
      AND expires_at > NOW()
      AND public.has_entitlement('lammah_feed')
    )
    OR public.is_staff_or_super_admin()
  );

DROP POLICY IF EXISTS lammah_opportunities_staff_update ON public.lammah_opportunities;
CREATE POLICY lammah_opportunities_staff_update
  ON public.lammah_opportunities
  FOR UPDATE
  USING (public.is_staff_or_super_admin())
  WITH CHECK (public.is_staff_or_super_admin());

DROP POLICY IF EXISTS lammah_opportunities_staff_delete ON public.lammah_opportunities;
CREATE POLICY lammah_opportunities_staff_delete
  ON public.lammah_opportunities
  FOR DELETE
  USING (public.is_staff_or_super_admin());

DROP POLICY IF EXISTS lammah_radar_owner ON public.lammah_radar_items;
CREATE POLICY lammah_radar_owner
  ON public.lammah_radar_items
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND public.has_entitlement('lammah_feed'));

COMMENT ON TABLE public.lammah_opportunities IS
  'External scraped opportunities — physically isolated from applications/communication_batches (Rule E).';

-- Crawl active sources every 6 hours (Prompt 3)
SELECT cron.schedule(
  'lammah-crawler',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := coalesce(
      nullif(current_setting('app.settings.supabase_functions_url', true), ''),
      'http://kong:8000'
    ) || '/functions/v1/lammah-crawler',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || coalesce(current_setting('app.settings.service_role_key', true), '')
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
