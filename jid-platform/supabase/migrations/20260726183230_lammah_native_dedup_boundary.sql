-- Race-safe precedence boundary between native JID jobs and external Lammah
-- opportunities. Native published jobs always win; superseded source rows are
-- retained for provenance.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

DO $$
BEGIN
  CREATE TYPE public.lammah_opportunity_type_enum AS ENUM (
    'job',
    'co_op',
    'internship',
    'fellowship',
    'scholarship'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

ALTER TABLE public.lammah_opportunities
  ADD COLUMN IF NOT EXISTS opportunity_type public.lammah_opportunity_type_enum;

CREATE OR REPLACE FUNCTION public.normalize_opportunity_title(p_text TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT NULLIF(
    trim(
      regexp_replace(
        translate(
          regexp_replace(lower(COALESCE(p_text, '')), '[ـًٌٍَُِّْٰ]', '', 'g'),
          'أإآىةؤئ',
          'ااايهوي'
        ),
        '[[:space:][:punct:]]+',
        ' ',
        'g'
      )
    ),
    ''
  );
$$;

CREATE OR REPLACE FUNCTION public.normalize_opportunity_url(p_url TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
DECLARE
  v_value TEXT;
  v_parts TEXT[];
  v_host TEXT;
  v_tail TEXT;
BEGIN
  v_value := split_part(trim(COALESCE(p_url, '')), '#', 1);
  IF v_value = '' OR v_value !~* '^https?://' OR v_value ~ '[[:space:]]' THEN
    RETURN NULL;
  END IF;

  v_parts := regexp_match(v_value, '^https?://([^/?#]+)([^#]*)$', 'i');
  IF v_parts IS NULL THEN
    RETURN NULL;
  END IF;

  v_host := lower(regexp_replace(v_parts[1], '^www\.', '', 'i'));
  v_tail := COALESCE(v_parts[2], '');

  -- Root career pages are not opportunity identities and are unsafe to use
  -- as an exact duplicate boundary.
  IF v_host = ''
     OR v_host ~ '@'
     OR v_host !~ '^[a-z0-9.-]+(?::[0-9]+)?$'
     OR v_host !~ '\.'
     OR v_tail IN ('', '/') THEN
    RETURN NULL;
  END IF;

  IF position('?' IN v_tail) = 0 THEN
    v_tail := regexp_replace(v_tail, '/+$', '');
  END IF;

  RETURN NULLIF(v_host || v_tail, '');
END;
$$;

CREATE OR REPLACE FUNCTION public.classify_lammah_opportunity_type(
  p_title_ar TEXT,
  p_title_en TEXT,
  p_excerpt TEXT
)
RETURNS public.lammah_opportunity_type_enum
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT CASE
    WHEN lower(concat_ws(' ', p_title_ar, p_title_en, p_excerpt))
      ~ '(scholarship|scholar|منح[ةه]?|ابتعاث)'
      THEN 'scholarship'::public.lammah_opportunity_type_enum
    WHEN lower(concat_ws(' ', p_title_ar, p_title_en, p_excerpt))
      ~ '(fellowship|fellow|زمال[ةه]?)'
      THEN 'fellowship'::public.lammah_opportunity_type_enum
    WHEN lower(concat_ws(' ', p_title_ar, p_title_en, p_excerpt))
      ~ '(co[ -]?op|cooperative|تدريب[[:space:]]+تعاوني|تعاون[يية])'
      THEN 'co_op'::public.lammah_opportunity_type_enum
    WHEN lower(concat_ws(' ', p_title_ar, p_title_en, p_excerpt))
      ~ '(intern(ship)?|trainee|training|تدريب|تمهير)'
      THEN 'internship'::public.lammah_opportunity_type_enum
    ELSE 'job'::public.lammah_opportunity_type_enum
  END;
$$;

UPDATE public.lammah_opportunities
SET opportunity_type = public.classify_lammah_opportunity_type(
  title_ar,
  title_en,
  excerpt
)
WHERE opportunity_type IS NULL;

ALTER TABLE public.lammah_opportunities
  ALTER COLUMN opportunity_type SET DEFAULT 'job',
  ALTER COLUMN opportunity_type SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_lammah_opportunity_type_feed
  ON public.lammah_opportunities (opportunity_type, status, expires_at)
  WHERE status = 'active';

CREATE OR REPLACE FUNCTION public.opportunity_title_similarity(
  p_left_ar TEXT,
  p_left_en TEXT,
  p_right_ar TEXT,
  p_right_en TEXT
)
RETURNS REAL
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT COALESCE(MAX(public.similarity(pair.left_title, pair.right_title)), 0)::REAL
  FROM (
    VALUES
      (
        public.normalize_opportunity_title(p_left_ar),
        public.normalize_opportunity_title(p_right_ar)
      ),
      (
        public.normalize_opportunity_title(p_left_ar),
        public.normalize_opportunity_title(p_right_en)
      ),
      (
        public.normalize_opportunity_title(p_left_en),
        public.normalize_opportunity_title(p_right_ar)
      ),
      (
        public.normalize_opportunity_title(p_left_en),
        public.normalize_opportunity_title(p_right_en)
      )
  ) AS pair(left_title, right_title)
  WHERE pair.left_title IS NOT NULL
    AND pair.right_title IS NOT NULL;
$$;

CREATE OR REPLACE FUNCTION public.opportunity_titles_match_exactly(
  p_left_ar TEXT,
  p_left_en TEXT,
  p_right_ar TEXT,
  p_right_en TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM (
      VALUES
        (
          public.normalize_opportunity_title(p_left_ar),
          public.normalize_opportunity_title(p_right_ar)
        ),
        (
          public.normalize_opportunity_title(p_left_ar),
          public.normalize_opportunity_title(p_right_en)
        ),
        (
          public.normalize_opportunity_title(p_left_en),
          public.normalize_opportunity_title(p_right_ar)
        ),
        (
          public.normalize_opportunity_title(p_left_en),
          public.normalize_opportunity_title(p_right_en)
        )
    ) AS pair(left_title, right_title)
    WHERE pair.left_title IS NOT NULL
      AND pair.left_title = pair.right_title
  );
$$;

CREATE OR REPLACE FUNCTION public.lammah_native_opportunity_matches(
  p_lammah_type public.lammah_opportunity_type_enum,
  p_lammah_company_id UUID,
  p_lammah_title_ar TEXT,
  p_lammah_title_en TEXT,
  p_lammah_url TEXT,
  p_lammah_region TEXT,
  p_lammah_experience public.experience_level_enum,
  p_job_company_id UUID,
  p_job_title_ar TEXT,
  p_job_title_en TEXT,
  p_job_url TEXT,
  p_job_region TEXT,
  p_job_experience public.experience_level_enum
)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
DECLARE
  v_lammah_url TEXT;
  v_job_url TEXT;
  v_region_compatible BOOLEAN;
  v_experience_compatible BOOLEAN;
  v_supporting_evidence BOOLEAN;
BEGIN
  -- Native jobs have no scholarship/fellowship taxonomy, so those families
  -- can never be suppressed automatically.
  IF p_lammah_type IN ('scholarship', 'fellowship') THEN
    RETURN false;
  END IF;

  IF p_lammah_type IN ('co_op', 'internship')
     AND p_job_experience <> 'intern'::public.experience_level_enum THEN
    RETURN false;
  END IF;

  v_lammah_url := public.normalize_opportunity_url(p_lammah_url);
  v_job_url := public.normalize_opportunity_url(p_job_url);

  IF v_lammah_url IS NOT NULL
     AND v_job_url IS NOT NULL
     AND v_lammah_url = v_job_url THEN
    RETURN true;
  END IF;

  IF p_lammah_company_id IS NULL
     OR p_job_company_id IS NULL
     OR p_lammah_company_id <> p_job_company_id THEN
    RETURN false;
  END IF;

  IF public.opportunity_titles_match_exactly(
    p_lammah_title_ar,
    p_lammah_title_en,
    p_job_title_ar,
    p_job_title_en
  ) THEN
    RETURN true;
  END IF;

  v_region_compatible := p_lammah_region IS NULL
    OR p_job_region IS NULL
    OR p_lammah_region = p_job_region;
  v_experience_compatible := p_lammah_experience IS NULL
    OR p_lammah_experience = p_job_experience;
  v_supporting_evidence := (
    p_lammah_region IS NOT NULL
    AND p_job_region IS NOT NULL
    AND p_lammah_region = p_job_region
  ) OR (
    p_lammah_experience IS NOT NULL
    AND p_lammah_experience = p_job_experience
  );

  RETURN v_region_compatible
    AND v_experience_compatible
    AND v_supporting_evidence
    AND public.opportunity_title_similarity(
      p_lammah_title_ar,
      p_lammah_title_en,
      p_job_title_ar,
      p_job_title_en
    ) >= 0.86;
END;
$$;

CREATE OR REPLACE FUNCTION public.lock_lammah_native_conflict(
  p_company_id UUID,
  p_external_url TEXT,
  p_external_ref_hash TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_key BIGINT;
  v_company_key BIGINT;
  v_url_key BIGINT;
  v_ref_key BIGINT;
BEGIN
  IF p_company_id IS NOT NULL THEN
    v_company_key := hashtextextended(
      'jid:lammah-native:company:' || p_company_id::TEXT,
      0
    );
  END IF;

  IF public.normalize_opportunity_url(p_external_url) IS NOT NULL THEN
    v_url_key := hashtextextended(
      'jid:lammah-native:url:' || public.normalize_opportunity_url(p_external_url),
      0
    );
  END IF;

  IF NULLIF(trim(COALESCE(p_external_ref_hash, '')), '') IS NOT NULL THEN
    v_ref_key := hashtextextended(
      'jid:lammah-native:ref:' || trim(p_external_ref_hash),
      0
    );
  END IF;

  FOR v_key IN
    SELECT DISTINCT lock_key
    FROM unnest(ARRAY[v_company_key, v_url_key, v_ref_key]) AS keys(lock_key)
    WHERE lock_key IS NOT NULL
    ORDER BY lock_key
  LOOP
    PERFORM pg_advisory_xact_lock(v_key);
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.find_native_job_conflict(
  p_opportunity_type public.lammah_opportunity_type_enum,
  p_company_id UUID,
  p_title_ar TEXT,
  p_title_en TEXT,
  p_external_url TEXT,
  p_region TEXT,
  p_experience_level public.experience_level_enum
)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT candidate.id
  FROM (
    SELECT
      j.id,
      (
        public.normalize_opportunity_url(p_external_url) IS NOT NULL
        AND public.normalize_opportunity_url(j.external_apply_url)
          = public.normalize_opportunity_url(p_external_url)
      ) AS url_match,
      public.opportunity_titles_match_exactly(
        p_title_ar,
        p_title_en,
        j.title_ar,
        j.title_en
      ) AS exact_title_match,
      public.opportunity_title_similarity(
        p_title_ar,
        p_title_en,
        j.title_ar,
        j.title_en
      ) AS title_similarity
    FROM public.jobs j
    LEFT JOIN public.regions r ON r.id = j.region_id
    WHERE j.status IN ('published', 'closing_soon')
      AND public.lammah_native_opportunity_matches(
        p_opportunity_type,
        p_company_id,
        p_title_ar,
        p_title_en,
        p_external_url,
        p_region,
        p_experience_level,
        j.company_id,
        j.title_ar,
        j.title_en,
        j.external_apply_url,
        r.slug,
        j.experience_level
      )
  ) AS candidate
  ORDER BY
    candidate.url_match DESC,
    candidate.exact_title_match DESC,
    candidate.title_similarity DESC,
    candidate.id
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.guard_lammah_against_native_conflict()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_native_job_id UUID;
BEGIN
  IF NEW.status IN ('active', 'hidden') THEN
    PERFORM public.lock_lammah_native_conflict(
      NEW.company_id,
      NEW.external_url,
      NEW.external_ref_hash
    );

    v_native_job_id := public.find_native_job_conflict(
      NEW.opportunity_type,
      NEW.company_id,
      NEW.title_ar,
      NEW.title_en,
      NEW.external_url,
      NEW.region,
      NEW.experience_level
    );

    IF v_native_job_id IS NOT NULL THEN
      NEW.status := 'superseded';
      NEW.superseded_by_job_id := v_native_job_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lammah_native_conflict_guard
  ON public.lammah_opportunities;
CREATE TRIGGER trg_lammah_native_conflict_guard
  BEFORE INSERT OR UPDATE OF
    status,
    company_id,
    title_ar,
    title_en,
    external_url,
    external_ref_hash,
    region,
    experience_level,
    opportunity_type
  ON public.lammah_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_lammah_against_native_conflict();

CREATE OR REPLACE FUNCTION public.ingest_lammah_opportunity(p JSONB)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_source public.lammah_sources%ROWTYPE;
  v_id UUID;
  v_company_id UUID;
  v_native_job_id UUID;
  v_confidence NUMERIC(3, 2);
  v_status public.lammah_status_enum;
  v_sector TEXT;
  v_region TEXT;
  v_external_url TEXT;
  v_external_ref_hash TEXT;
  v_opportunity_type public.lammah_opportunity_type_enum;
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

  v_sector := NULLIF(trim(p->>'sector'), '');
  v_region := NULLIF(trim(p->>'region'), '');
  v_external_url := NULLIF(trim(p->>'external_url'), '');
  v_external_ref_hash := NULLIF(trim(p->>'external_ref_hash'), '');
  -- A company-bound trusted source is authoritative. Payload company identity
  -- is accepted only for trusted sources that intentionally have no binding.
  v_company_id := COALESCE(v_source.company_id, NULLIF(p->>'company_id', '')::UUID);

  IF v_external_url IS NULL OR v_external_ref_hash IS NULL THEN
    RAISE EXCEPTION 'missing_external_identity';
  END IF;

  IF v_sector IS NULL
     OR NOT EXISTS (SELECT 1 FROM public.sectors s WHERE s.slug = v_sector) THEN
    RAISE EXCEPTION 'invalid_sector';
  END IF;

  IF v_region IS NULL
     OR NOT EXISTS (SELECT 1 FROM public.regions r WHERE r.slug = v_region) THEN
    RAISE EXCEPTION 'invalid_region';
  END IF;

  IF NULLIF(p->>'opportunity_type', '') IS NOT NULL
     AND (p->>'opportunity_type') NOT IN (
       'job',
       'co_op',
       'internship',
       'fellowship',
       'scholarship'
     ) THEN
    RAISE EXCEPTION 'invalid_lammah_opportunity_type';
  END IF;

  v_opportunity_type := COALESCE(
    NULLIF(p->>'opportunity_type', '')::public.lammah_opportunity_type_enum,
    public.classify_lammah_opportunity_type(
      NULLIF(trim(p->>'title_ar'), ''),
      NULLIF(trim(p->>'title_en'), ''),
      NULLIF(trim(p->>'excerpt'), '')
    )
  );
  v_confidence := COALESCE((p->>'extraction_confidence')::NUMERIC, 1.0);
  v_status := CASE
    WHEN v_confidence < 0.7 THEN 'hidden'::public.lammah_status_enum
    ELSE 'active'::public.lammah_status_enum
  END;

  PERFORM public.lock_lammah_native_conflict(
    v_company_id,
    v_external_url,
    v_external_ref_hash
  );

  IF EXISTS (
    SELECT 1
    FROM public.lammah_opportunities
    WHERE external_ref_hash = v_external_ref_hash
  ) THEN
    RETURN NULL;
  END IF;

  v_native_job_id := public.find_native_job_conflict(
    v_opportunity_type,
    v_company_id,
    NULLIF(trim(p->>'title_ar'), ''),
    NULLIF(trim(p->>'title_en'), ''),
    v_external_url,
    v_region,
    NULLIF(p->>'experience_level', '')::public.experience_level_enum
  );

  IF v_native_job_id IS NOT NULL THEN
    v_status := 'superseded'::public.lammah_status_enum;
  END IF;

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
    opportunity_type,
    external_url,
    external_ref_hash,
    source_published_at,
    extraction_confidence,
    status,
    superseded_by_job_id
  )
  VALUES (
    v_source.id,
    v_company_id,
    COALESCE(NULLIF(trim(p->>'company_name_raw'), ''), v_source.name),
    NULLIF(trim(p->>'title_ar'), ''),
    NULLIF(trim(p->>'title_en'), ''),
    NULLIF(trim(p->>'excerpt'), ''),
    v_sector,
    v_region,
    NULLIF(p->>'ownership_type', '')::public.ownership_enum,
    NULLIF(p->>'experience_level', '')::public.experience_level_enum,
    v_opportunity_type,
    v_external_url,
    v_external_ref_hash,
    (p->>'source_published_at')::TIMESTAMPTZ,
    v_confidence,
    v_status,
    v_native_job_id
  )
  ON CONFLICT (external_ref_hash) DO NOTHING
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.lock_native_publish_against_lammah()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.status IN ('published', 'closing_soon') THEN
    PERFORM public.lock_lammah_native_conflict(
      NEW.company_id,
      NEW.external_apply_url,
      NULL
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lock_native_lammah ON public.jobs;
CREATE TRIGGER trg_lock_native_lammah
  BEFORE INSERT OR UPDATE OF
    status,
    company_id,
    title_ar,
    title_en,
    external_apply_url,
    region_id,
    experience_level
  ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.lock_native_publish_against_lammah();

CREATE OR REPLACE FUNCTION public.supersede_lammah_on_native_post()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_job_region TEXT;
BEGIN
  IF NEW.status IN ('published', 'closing_soon') THEN
    SELECT r.slug INTO v_job_region
    FROM public.regions r
    WHERE r.id = NEW.region_id;

    UPDATE public.lammah_opportunities l
    SET
      status = 'superseded',
      superseded_by_job_id = NEW.id
    WHERE l.status IN ('active', 'hidden')
      AND public.lammah_native_opportunity_matches(
        l.opportunity_type,
        l.company_id,
        l.title_ar,
        l.title_en,
        l.external_url,
        l.region,
        l.experience_level,
        NEW.company_id,
        NEW.title_ar,
        NEW.title_en,
        NEW.external_apply_url,
        v_job_region,
        NEW.experience_level
      );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_supersede_lammah ON public.jobs;
CREATE TRIGGER trg_supersede_lammah
  AFTER INSERT OR UPDATE OF
    status,
    company_id,
    title_ar,
    title_en,
    external_apply_url,
    region_id,
    experience_level
  ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.supersede_lammah_on_native_post();

CREATE OR REPLACE FUNCTION public.dismiss_superseded_lammah_matches()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.status = 'superseded'
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
    UPDATE public.mandate_matches
    SET
      dismissed_at = COALESCE(dismissed_at, NOW()),
      dismissed_reason = COALESCE(dismissed_reason, 'native_superseded')
    WHERE lammah_id = NEW.id
      AND dismissed_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_dismiss_superseded_lammah_matches
  ON public.lammah_opportunities;
CREATE TRIGGER trg_dismiss_superseded_lammah_matches
  AFTER INSERT OR UPDATE OF status
  ON public.lammah_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION public.dismiss_superseded_lammah_matches();

CREATE OR REPLACE FUNCTION public.backfill_lammah_native_conflicts(
  p_apply BOOLEAN DEFAULT false
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF NOT p_apply THEN
    SELECT count(*)::INTEGER INTO v_count
    FROM public.lammah_opportunities l
    WHERE l.status IN ('active', 'hidden')
      AND public.find_native_job_conflict(
        l.opportunity_type,
        l.company_id,
        l.title_ar,
        l.title_en,
        l.external_url,
        l.region,
        l.experience_level
      ) IS NOT NULL;
    RETURN v_count;
  END IF;

  WITH conflicts AS (
    SELECT
      l.id,
      public.find_native_job_conflict(
        l.opportunity_type,
        l.company_id,
        l.title_ar,
        l.title_en,
        l.external_url,
        l.region,
        l.experience_level
      ) AS job_id
    FROM public.lammah_opportunities l
    WHERE l.status IN ('active', 'hidden')
  )
  UPDATE public.lammah_opportunities l
  SET
    status = 'superseded',
    superseded_by_job_id = conflicts.job_id
  FROM conflicts
  WHERE l.id = conflicts.id
    AND conflicts.job_id IS NOT NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- The callable defaults to a read-only count; the forward migration explicitly
-- applies the idempotent reconciliation inside this transaction.
SELECT public.backfill_lammah_native_conflicts(true);

CREATE OR REPLACE FUNCTION public.purge_expired_lammah()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.lammah_opportunities
  WHERE expires_at < NOW()
    AND status <> 'superseded';
END;
$$;

REVOKE ALL ON FUNCTION public.ingest_lammah_opportunity(JSONB)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ingest_lammah_opportunity(JSONB)
  TO service_role;

REVOKE INSERT ON TABLE public.lammah_opportunities
  FROM anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.normalize_opportunity_title(TEXT)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.normalize_opportunity_url(TEXT)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.classify_lammah_opportunity_type(TEXT, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.opportunity_title_similarity(TEXT, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.opportunity_titles_match_exactly(TEXT, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.lammah_native_opportunity_matches(
  public.lammah_opportunity_type_enum,
  UUID,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  public.experience_level_enum,
  UUID,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  public.experience_level_enum
) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.lock_lammah_native_conflict(UUID, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.find_native_job_conflict(
  public.lammah_opportunity_type_enum,
  UUID,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  public.experience_level_enum
) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.guard_lammah_against_native_conflict()
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.lock_native_publish_against_lammah()
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.supersede_lammah_on_native_post()
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.dismiss_superseded_lammah_matches()
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.backfill_lammah_native_conflicts(BOOLEAN)
  FROM PUBLIC, anon, authenticated, service_role;

COMMENT ON COLUMN public.lammah_opportunities.opportunity_type IS
  'Normalized Lammah family used for filtering and conservative native-job precedence.';
COMMENT ON FUNCTION public.lammah_native_opportunity_matches(
  public.lammah_opportunity_type_enum,
  UUID,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  public.experience_level_enum,
  UUID,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  public.experience_level_enum
) IS
  'Authoritative deterministic matcher shared by ingestion and native publication.';

COMMIT;
