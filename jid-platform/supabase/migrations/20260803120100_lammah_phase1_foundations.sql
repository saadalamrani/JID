-- JID Lammah Phase 1: adjacent governance, evidence, candidate, review,
-- provenance, and operations foundations. Existing published inventory and
-- the native-precedence boundary are preserved. lammah_radar_items is not
-- altered by this migration.

BEGIN;

-- ---------------------------------------------------------------------------
-- Restricted capability and function-owner roles
-- ---------------------------------------------------------------------------

DO $roles$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lammah_worker') THEN
    CREATE ROLE lammah_worker NOLOGIN NOBYPASSRLS NOSUPERUSER NOCREATEDB
      NOCREATEROLE NOREPLICATION INHERIT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lammah_function_owner') THEN
    CREATE ROLE lammah_function_owner NOLOGIN NOBYPASSRLS NOSUPERUSER NOCREATEDB
      NOCREATEROLE NOREPLICATION NOINHERIT;
  END IF;
END
$roles$;

GRANT USAGE ON SCHEMA public TO lammah_worker, lammah_function_owner;
GRANT USAGE ON SCHEMA extensions TO lammah_function_owner;

-- ---------------------------------------------------------------------------
-- Reconcile the shipped source registry additively
-- ---------------------------------------------------------------------------

ALTER TABLE public.lammah_sources
  ADD COLUMN IF NOT EXISTS source_key text,
  ADD COLUMN IF NOT EXISTS program_scope text NOT NULL DEFAULT 'lammah',
  ADD COLUMN IF NOT EXISTS approval_state text NOT NULL DEFAULT 'candidate',
  ADD COLUMN IF NOT EXISTS licence_basis text,
  ADD COLUMN IF NOT EXISTS terms_url text,
  ADD COLUMN IF NOT EXISTS terms_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS robots_url text,
  ADD COLUMN IF NOT EXISTS robots_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS robots_review_result text,
  ADD COLUMN IF NOT EXISTS apply_url_pattern text,
  ADD COLUMN IF NOT EXISTS record_identity_strategy text,
  ADD COLUMN IF NOT EXISTS technical_format text,
  ADD COLUMN IF NOT EXISTS evidence_retention_terms text,
  ADD COLUMN IF NOT EXISTS confidence_policy jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS rate_limit_policy jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS authoritative_fields text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS supported_opportunity_types public.lammah_opportunity_type_enum[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS parser_name text,
  ADD COLUMN IF NOT EXISTS parser_version text,
  ADD COLUMN IF NOT EXISTS health_state text NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS auto_publication_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS allowed_apply_hosts text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS last_success_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_failure_at timestamptz,
  ADD COLUMN IF NOT EXISTS staff_owner_id uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS qualification_reviewer text,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz,
  ADD COLUMN IF NOT EXISTS suspension_reason text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

UPDATE public.lammah_sources
SET source_key = 'legacy_' || left(replace(id::text, '-', ''), 24)
WHERE source_key IS NULL;

ALTER TABLE public.lammah_sources
  ALTER COLUMN source_key SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS lammah_sources_source_key_key
  ON public.lammah_sources (source_key);

ALTER TABLE public.lammah_sources
  DROP CONSTRAINT IF EXISTS lammah_sources_source_key_chk,
  DROP CONSTRAINT IF EXISTS lammah_sources_program_scope_chk,
  DROP CONSTRAINT IF EXISTS lammah_sources_approval_state_chk,
  DROP CONSTRAINT IF EXISTS lammah_sources_qualification_chk,
  DROP CONSTRAINT IF EXISTS lammah_sources_health_state_chk,
  DROP CONSTRAINT IF EXISTS lammah_sources_rate_limit_chk,
  DROP CONSTRAINT IF EXISTS lammah_sources_suspend_chk;

ALTER TABLE public.lammah_sources
  ADD CONSTRAINT lammah_sources_source_key_chk
    CHECK (source_key ~ '^[a-z0-9][a-z0-9._-]{2,63}$'),
  ADD CONSTRAINT lammah_sources_program_scope_chk
    CHECK (program_scope = 'lammah'),
  ADD CONSTRAINT lammah_sources_approval_state_chk
    CHECK (approval_state IN ('candidate', 'approved', 'suspended')),
  ADD CONSTRAINT lammah_sources_qualification_chk
    CHECK (
      approval_state <> 'approved'
      OR (
        licence_basis IS NOT NULL
        AND terms_url IS NOT NULL
        AND terms_reviewed_at IS NOT NULL
        AND robots_url IS NOT NULL
        AND robots_reviewed_at IS NOT NULL
        AND robots_review_result IS NOT NULL
        AND apply_url_pattern IS NOT NULL
        AND record_identity_strategy IS NOT NULL
        AND technical_format IS NOT NULL
        AND evidence_retention_terms IS NOT NULL
        AND jsonb_typeof(confidence_policy) = 'object'
        AND jsonb_typeof(rate_limit_policy) = 'object'
        AND cardinality(authoritative_fields) > 0
        AND cardinality(supported_opportunity_types) > 0
        AND parser_name IS NOT NULL
        AND parser_version IS NOT NULL
        AND qualification_reviewer IS NOT NULL
        AND approved_at IS NOT NULL
      )
    ),
  ADD CONSTRAINT lammah_sources_health_state_chk
    CHECK (health_state IN ('unknown', 'healthy', 'degraded', 'unhealthy')),
  ADD CONSTRAINT lammah_sources_rate_limit_chk
    CHECK (
      jsonb_typeof(rate_limit_policy) = 'object'
      AND COALESCE((rate_limit_policy->>'max_pages')::integer, 1) BETWEEN 1 AND 20
      AND COALESCE((rate_limit_policy->>'max_records')::integer, 20) BETWEEN 1 AND 100
      AND COALESCE((rate_limit_policy->>'min_delay_ms')::integer, 1000) BETWEEN 250 AND 60000
    ),
  ADD CONSTRAINT lammah_sources_suspend_chk
    CHECK (
      approval_state <> 'suspended'
      OR (suspended_at IS NOT NULL AND NULLIF(btrim(suspension_reason), '') IS NOT NULL)
    );

-- The one Phase-1 source was qualified in-wave against its official pages,
-- robots policy, and explicit CC BY 4.0 reuse licence. Flags remain off.
INSERT INTO public.lammah_sources (
  id, source_key, name, base_url, source_type, trust_tier, is_active, robots_ok,
  crawl_frequency_hours, program_scope, approval_state, licence_basis,
  terms_url, terms_reviewed_at, robots_url, robots_reviewed_at,
  robots_review_result, apply_url_pattern, record_identity_strategy,
  technical_format, evidence_retention_terms, confidence_policy, rate_limit_policy,
  authoritative_fields, supported_opportunity_types, parser_name,
  parser_version, health_state, auto_publication_enabled, allowed_apply_hosts,
  qualification_reviewer, approved_at
)
VALUES (
  '6a6d6d61-682d-4100-8000-000000000001',
  'eu_careers_cast',
  'EU Careers / EPSO',
  'https://eu-careers.europa.eu/en/job-opportunities/open-vacancies/cast',
  'career_page',
  1,
  true,
  true,
  24,
  'lammah',
  'approved',
  'EU-owned website content is expressly reusable under CC BY 4.0 with attribution and change disclosure.',
  'https://european-union.europa.eu/legal-notice_en',
  '2026-08-03T00:00:00+03:00',
  'https://eu-careers.europa.eu/robots.txt',
  '2026-08-03T00:00:00+03:00',
  'Public vacancy and detail paths are not disallowed; administrative, search, and account paths are disallowed and never fetched.',
  'Detail field field--name-field-epso-link; final HTTPS destination is validated before publication.',
  'Source reference number; fallback is canonical detail URL plus content checksum.',
  'html_stable_structured_fields',
  'CC BY 4.0 permits retention and reuse with attribution; private raw evidence is retained for 180 days, metadata and provenance permanently.',
  '{"minimum_fact_confidence":0.85,"allowed_methods":["source_structured","parser","staff_entry"]}'::jsonb,
  '{"max_pages":1,"max_records":20,"min_delay_ms":1500,"request_timeout_ms":15000,"retry_limit":3}'::jsonb,
  ARRAY[
    'source_record_id','title.original','organization.raw_name','opportunity.type',
    'location.country','location.region','location.city','dates.published',
    'dates.deadline','url.apply','url.source_page'
  ],
  ARRAY['job']::public.lammah_opportunity_type_enum[],
  'eu_careers_html',
  '1.0.0',
  'unknown',
  false,
  ARRAY['europa.eu','gestmax.eu'],
  'Codex implementation wave; founder-authorized final specification v2.0',
  '2026-08-03T00:00:00+03:00'
)
ON CONFLICT (source_key) DO UPDATE SET
  name = EXCLUDED.name,
  base_url = EXCLUDED.base_url,
  source_type = EXCLUDED.source_type,
  trust_tier = EXCLUDED.trust_tier,
  program_scope = EXCLUDED.program_scope,
  approval_state = EXCLUDED.approval_state,
  licence_basis = EXCLUDED.licence_basis,
  terms_url = EXCLUDED.terms_url,
  terms_reviewed_at = EXCLUDED.terms_reviewed_at,
  robots_url = EXCLUDED.robots_url,
  robots_reviewed_at = EXCLUDED.robots_reviewed_at,
  robots_review_result = EXCLUDED.robots_review_result,
  apply_url_pattern = EXCLUDED.apply_url_pattern,
  record_identity_strategy = EXCLUDED.record_identity_strategy,
  technical_format = EXCLUDED.technical_format,
  evidence_retention_terms = EXCLUDED.evidence_retention_terms,
  confidence_policy = EXCLUDED.confidence_policy,
  rate_limit_policy = EXCLUDED.rate_limit_policy,
  authoritative_fields = EXCLUDED.authoritative_fields,
  supported_opportunity_types = EXCLUDED.supported_opportunity_types,
  parser_name = EXCLUDED.parser_name,
  parser_version = EXCLUDED.parser_version,
  allowed_apply_hosts = EXCLUDED.allowed_apply_hosts,
  qualification_reviewer = EXCLUDED.qualification_reviewer,
  approved_at = EXCLUDED.approved_at,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- Published model truth correction: optional facts stay optional
-- ---------------------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_lammah_opportunities_expires_at
  ON public.lammah_opportunities;

ALTER TABLE public.lammah_opportunities
  ALTER COLUMN sector DROP NOT NULL,
  ALTER COLUMN region DROP NOT NULL,
  ALTER COLUMN source_published_at DROP NOT NULL,
  ALTER COLUMN expires_at DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS source_name text,
  ADD COLUMN IF NOT EXISTS location_country text,
  ADD COLUMN IF NOT EXISTS location_city text,
  ADD COLUMN IF NOT EXISTS first_retrieved_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS source_removed_scan_count smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS publication_candidate_id uuid,
  ADD COLUMN IF NOT EXISTS translation_attribution text;

UPDATE public.lammah_opportunities
SET source_name = COALESCE(
      source_name,
      (SELECT source.name FROM public.lammah_sources source
       WHERE source.id=lammah_opportunities.source_id)
    ),
    first_retrieved_at = COALESCE(first_retrieved_at, scraped_at),
    last_confirmed_at = COALESCE(last_confirmed_at, scraped_at)
WHERE source_name IS NULL OR first_retrieved_at IS NULL OR last_confirmed_at IS NULL;

ALTER TABLE public.lammah_opportunities
  ALTER COLUMN source_name SET NOT NULL,
  ALTER COLUMN first_retrieved_at SET DEFAULT now(),
  ALTER COLUMN first_retrieved_at SET NOT NULL,
  ALTER COLUMN last_confirmed_at SET DEFAULT now(),
  ALTER COLUMN last_confirmed_at SET NOT NULL,
  DROP CONSTRAINT IF EXISTS lammah_opportunities_removed_scan_chk,
  DROP CONSTRAINT IF EXISTS lammah_opportunities_translation_chk;

ALTER TABLE public.lammah_opportunities
  ADD CONSTRAINT lammah_opportunities_removed_scan_chk
    CHECK (source_removed_scan_count BETWEEN 0 AND 2),
  ADD CONSTRAINT lammah_opportunities_translation_chk
    CHECK (translation_attribution IS NULL OR translation_attribution = 'reviewed_ai_localization');

-- ---------------------------------------------------------------------------
-- Adjacent internal models
-- ---------------------------------------------------------------------------

CREATE TABLE public.lammah_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES public.lammah_sources(id) ON DELETE RESTRICT,
  external_run_id text NOT NULL UNIQUE,
  worker_identity text NOT NULL,
  mode text NOT NULL DEFAULT 'incremental',
  parser_version text NOT NULL,
  status text NOT NULL DEFAULT 'running',
  retrieved_count integer NOT NULL DEFAULT 0,
  accepted_count integer NOT NULL DEFAULT 0,
  replayed_count integer NOT NULL DEFAULT 0,
  review_count integer NOT NULL DEFAULT 0,
  published_count integer NOT NULL DEFAULT 0,
  rejected_count integer NOT NULL DEFAULT 0,
  dead_letter_count integer NOT NULL DEFAULT 0,
  page_count integer NOT NULL DEFAULT 0,
  retry_count integer NOT NULL DEFAULT 0,
  checkpoint jsonb NOT NULL DEFAULT '{}'::jsonb,
  failure_class text,
  failure_detail text,
  started_at timestamptz NOT NULL DEFAULT now(),
  heartbeat_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lammah_sync_runs_source_id_id_key UNIQUE (source_id, id),
  CONSTRAINT lammah_sync_runs_mode_chk CHECK (mode IN ('full','incremental','retry','revalidation','retention')),
  CONSTRAINT lammah_sync_runs_status_chk CHECK (status IN ('running','succeeded','succeeded_partial','failed_partial','skipped')),
  CONSTRAINT lammah_sync_runs_counts_chk CHECK (
    retrieved_count >= 0 AND accepted_count >= 0 AND replayed_count >= 0
    AND review_count >= 0 AND published_count >= 0 AND rejected_count >= 0
    AND dead_letter_count >= 0 AND page_count >= 0 AND retry_count >= 0
  ),
  CONSTRAINT lammah_sync_runs_completion_chk CHECK ((status = 'running') = (completed_at IS NULL))
);

CREATE UNIQUE INDEX lammah_sync_runs_one_running_source
  ON public.lammah_sync_runs (source_id) WHERE status = 'running';

CREATE TABLE public.lammah_raw_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES public.lammah_sources(id) ON DELETE RESTRICT,
  run_id uuid NOT NULL,
  source_record_id text NOT NULL,
  request_identity text NOT NULL,
  source_url text NOT NULL,
  private_locator text,
  payload_body text,
  sanitized_projection jsonb NOT NULL DEFAULT '{}'::jsonb,
  content_type text NOT NULL,
  content_size_bytes integer NOT NULL,
  checksum_sha256 text NOT NULL,
  redirect_chain jsonb NOT NULL DEFAULT '[]'::jsonb,
  final_destination text,
  parser_version text NOT NULL,
  retention_state text NOT NULL DEFAULT 'active',
  deletion_eligible_at timestamptz,
  legal_hold boolean NOT NULL DEFAULT false,
  legal_hold_reason text,
  personal_data_dominated boolean NOT NULL DEFAULT false,
  payload_deleted_at timestamptz,
  payload_deletion_reason text,
  retrieved_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lammah_raw_evidence_run_source_fkey FOREIGN KEY (source_id, run_id)
    REFERENCES public.lammah_sync_runs(source_id, id) ON DELETE RESTRICT,
  CONSTRAINT lammah_raw_evidence_content_type_chk CHECK (content_type IN ('text/html','application/json','application/xml','text/csv')),
  CONSTRAINT lammah_raw_evidence_size_chk CHECK (content_size_bytes BETWEEN 1 AND 10485760),
  CONSTRAINT lammah_raw_evidence_checksum_chk CHECK (checksum_sha256 ~ '^[0-9a-f]{64}$'),
  CONSTRAINT lammah_raw_evidence_redirect_chk CHECK (jsonb_typeof(redirect_chain) = 'array' AND jsonb_array_length(redirect_chain) <= 4),
  CONSTRAINT lammah_raw_evidence_retention_chk CHECK (retention_state IN ('active','superseded','quarantined','payload_deleted')),
  CONSTRAINT lammah_raw_evidence_legal_hold_chk CHECK (
    (NOT legal_hold AND legal_hold_reason IS NULL)
    OR (legal_hold AND NULLIF(btrim(legal_hold_reason), '') IS NOT NULL)
  ),
  CONSTRAINT lammah_raw_evidence_deletion_chk CHECK (
    (retention_state <> 'payload_deleted' AND payload_deleted_at IS NULL)
    OR (retention_state = 'payload_deleted' AND payload_deleted_at IS NOT NULL AND payload_body IS NULL)
  )
);

CREATE UNIQUE INDEX lammah_raw_evidence_version_key
  ON public.lammah_raw_evidence (source_id, source_record_id, checksum_sha256);

CREATE TABLE public.lammah_import_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES public.lammah_sources(id) ON DELETE RESTRICT,
  run_id uuid NOT NULL REFERENCES public.lammah_sync_runs(id) ON DELETE RESTRICT,
  evidence_id uuid NOT NULL REFERENCES public.lammah_raw_evidence(id) ON DELETE RESTRICT,
  source_record_id text NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  checksum_sha256 text NOT NULL,
  state text NOT NULL DEFAULT 'pending_review',
  opportunity_type public.lammah_opportunity_type_enum NOT NULL,
  title_original text NOT NULL,
  title_ar text,
  title_en text,
  organization_raw_name text NOT NULL,
  resolved_company_id uuid REFERENCES public.companies(id) ON DELETE RESTRICT,
  location_country text,
  location_region text,
  location_city text,
  work_mode text,
  experience_level public.experience_level_enum,
  sector text,
  ownership_type public.ownership_enum,
  eligibility_summary text,
  description_excerpt text,
  source_published_at timestamptz,
  source_opening_at timestamptz,
  source_deadline_at timestamptz,
  source_page_url text NOT NULL,
  apply_url text NOT NULL,
  final_apply_url text,
  apply_url_validated_at timestamptz,
  url_validation_evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  match_outcome text NOT NULL DEFAULT 'independent',
  match_reasons jsonb NOT NULL DEFAULT '[]'::jsonb,
  review_flags text[] NOT NULL DEFAULT '{}',
  normalized_title text,
  normalized_organization text,
  assigned_to uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  assigned_at timestamptz,
  decision_by uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  decision_notes text,
  decided_at timestamptz,
  published_opportunity_id uuid REFERENCES public.lammah_opportunities(id) ON DELETE RESTRICT,
  predecessor_candidate_id uuid REFERENCES public.lammah_import_candidates(id) ON DELETE RESTRICT,
  auto_gate_checklist jsonb,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lammah_import_candidates_source_record_chk CHECK (char_length(btrim(source_record_id)) BETWEEN 1 AND 200),
  CONSTRAINT lammah_import_candidates_checksum_chk CHECK (checksum_sha256 ~ '^[0-9a-f]{64}$'),
  CONSTRAINT lammah_import_candidates_state_chk CHECK (state IN (
    'pending_review','assigned','quarantined','returned_for_correction','approved',
    'auto_publish_eligible','published','rejected','superseded_by_replay','suppressed_by_native'
  )),
  CONSTRAINT lammah_import_candidates_title_chk CHECK (
    char_length(btrim(title_original)) BETWEEN 1 AND 300
    AND (title_ar IS NOT NULL OR title_en IS NOT NULL)
  ),
  CONSTRAINT lammah_import_candidates_work_mode_chk CHECK (work_mode IS NULL OR work_mode IN ('remote','onsite','hybrid')),
  CONSTRAINT lammah_import_candidates_excerpt_chk CHECK (description_excerpt IS NULL OR char_length(description_excerpt) <= 1000),
  CONSTRAINT lammah_import_candidates_deadline_chk CHECK (source_deadline_at IS NULL OR source_deadline_at >= first_seen_at),
  CONSTRAINT lammah_import_candidates_match_chk CHECK (match_outcome IN (
    'independent','duplicate_external','probable_duplicate','suppressed_by_native','ambiguous','new_cycle'
  )),
  CONSTRAINT lammah_import_candidates_flags_chk CHECK (
    review_flags <@ ARRAY[
      'hostile_content','personal_data_review','unresolved_organization','organization_conflict',
      'ambiguous_type','url_validation_failure','duplicate_external','suppressed_by_native',
      'unsupported_ai_localization','source_stale','report_problem'
    ]::text[]
  ),
  CONSTRAINT lammah_import_candidates_assignment_chk CHECK (
    (state = 'assigned') = (assigned_to IS NOT NULL AND assigned_at IS NOT NULL)
    OR state IN ('approved','published','rejected','returned_for_correction')
  )
);

ALTER TABLE public.lammah_opportunities
  ADD CONSTRAINT lammah_opportunities_publication_candidate_fkey
  FOREIGN KEY (publication_candidate_id)
  REFERENCES public.lammah_import_candidates(id) ON DELETE RESTRICT;

CREATE INDEX lammah_import_candidates_review_idx
  ON public.lammah_import_candidates (state, created_at, source_id);
CREATE INDEX lammah_import_candidates_search_idx
  ON public.lammah_import_candidates (normalized_title, normalized_organization);
CREATE INDEX lammah_import_candidates_apply_idx
  ON public.lammah_import_candidates (final_apply_url) WHERE final_apply_url IS NOT NULL;

CREATE TABLE public.lammah_candidate_facts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES public.lammah_import_candidates(id) ON DELETE RESTRICT,
  evidence_id uuid NOT NULL REFERENCES public.lammah_raw_evidence(id) ON DELETE RESTRICT,
  source_id uuid NOT NULL REFERENCES public.lammah_sources(id) ON DELETE RESTRICT,
  source_record_id text NOT NULL,
  fact_key text NOT NULL,
  original_value jsonb NOT NULL,
  normalized_value jsonb,
  extraction_method text NOT NULL,
  source_url text NOT NULL,
  parser_model_version text NOT NULL,
  transformation_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  confidence numeric(4,3) NOT NULL,
  confidence_reason_ar text NOT NULL,
  confidence_reason_en text NOT NULL,
  review_state text NOT NULL DEFAULT 'proposed',
  reviewer_id uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  reviewer_edit jsonb,
  reviewed_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  retrieved_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lammah_candidate_facts_unique UNIQUE (candidate_id, fact_key),
  CONSTRAINT lammah_candidate_facts_key_chk CHECK (fact_key = ANY(ARRAY[
    'source_record_id','title.original','title.ar','title.en','organization.raw_name',
    'organization.resolved_company_id','opportunity.type','location.country',
    'location.region','location.city','work_mode','experience_level','sector',
    'ownership_type','eligibility.summary','description.excerpt','dates.published',
    'dates.opening','dates.deadline','url.apply','url.source_page'
  ]::text[])),
  CONSTRAINT lammah_candidate_facts_method_chk CHECK (extraction_method IN (
    'source_structured','parser','ai_extraction','ai_localization','staff_entry'
  )),
  CONSTRAINT lammah_candidate_facts_confidence_chk CHECK (confidence BETWEEN 0 AND 1),
  CONSTRAINT lammah_candidate_facts_review_chk CHECK (review_state IN ('proposed','accepted','rejected','edited')),
  CONSTRAINT lammah_candidate_facts_terminal_ai_chk CHECK (
    extraction_method NOT IN ('ai_extraction','ai_localization')
    OR fact_key IN ('title.ar','title.en','eligibility.summary')
  )
);

CREATE TABLE public.lammah_opportunity_facts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES public.lammah_opportunities(id) ON DELETE RESTRICT,
  candidate_id uuid NOT NULL REFERENCES public.lammah_import_candidates(id) ON DELETE RESTRICT,
  candidate_fact_id uuid NOT NULL REFERENCES public.lammah_candidate_facts(id) ON DELETE RESTRICT,
  fact_key text NOT NULL,
  published_value jsonb NOT NULL,
  provenance_snapshot jsonb NOT NULL,
  active boolean NOT NULL DEFAULT true,
  superseded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lammah_opportunity_facts_state_chk CHECK ((active AND superseded_at IS NULL) OR (NOT active AND superseded_at IS NOT NULL))
);

CREATE UNIQUE INDEX lammah_opportunity_facts_active_unique
  ON public.lammah_opportunity_facts (opportunity_id, fact_key)
  WHERE active;

CREATE TABLE public.lammah_source_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES public.lammah_opportunities(id) ON DELETE RESTRICT,
  source_id uuid NOT NULL REFERENCES public.lammah_sources(id) ON DELETE RESTRICT,
  candidate_id uuid NOT NULL REFERENCES public.lammah_import_candidates(id) ON DELETE RESTRICT,
  source_record_id text NOT NULL,
  source_page_url text NOT NULL,
  final_apply_url text NOT NULL,
  first_seen_at timestamptz NOT NULL,
  last_seen_at timestamptz NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lammah_source_links_unique UNIQUE (source_id, source_record_id, candidate_id)
);

CREATE TABLE public.lammah_duplicate_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES public.lammah_import_candidates(id) ON DELETE RESTRICT,
  possible_candidate_id uuid REFERENCES public.lammah_import_candidates(id) ON DELETE RESTRICT,
  possible_opportunity_id uuid REFERENCES public.lammah_opportunities(id) ON DELETE RESTRICT,
  outcome text NOT NULL,
  reasons jsonb NOT NULL,
  deterministic boolean NOT NULL DEFAULT false,
  resolved_by uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lammah_duplicate_candidates_target_chk CHECK (num_nonnulls(possible_candidate_id, possible_opportunity_id) = 1),
  CONSTRAINT lammah_duplicate_candidates_outcome_chk CHECK (outcome IN ('duplicate','probable','independent','new_cycle'))
);

CREATE TABLE public.lammah_native_match_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES public.lammah_import_candidates(id) ON DELETE RESTRICT,
  opportunity_id uuid REFERENCES public.lammah_opportunities(id) ON DELETE RESTRICT,
  native_job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE RESTRICT,
  outcome text NOT NULL,
  reasons jsonb NOT NULL,
  deterministic boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lammah_native_match_events_subject_chk CHECK (num_nonnulls(candidate_id, opportunity_id) = 1),
  CONSTRAINT lammah_native_match_events_outcome_chk CHECK (outcome IN ('suppressed','superseded','ambiguous','cleared'))
);

CREATE TABLE public.lammah_lifecycle_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES public.lammah_sources(id) ON DELETE RESTRICT,
  candidate_id uuid REFERENCES public.lammah_import_candidates(id) ON DELETE RESTRICT,
  opportunity_id uuid REFERENCES public.lammah_opportunities(id) ON DELETE RESTRICT,
  run_id uuid REFERENCES public.lammah_sync_runs(id) ON DELETE RESTRICT,
  event_type text NOT NULL,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  actor_kind text NOT NULL,
  reason text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lammah_lifecycle_events_subject_chk CHECK (num_nonnulls(source_id,candidate_id,opportunity_id,run_id) >= 1),
  CONSTRAINT lammah_lifecycle_events_actor_chk CHECK (actor_kind IN ('worker','staff','super_admin','system'))
);

CREATE INDEX lammah_lifecycle_events_candidate_idx ON public.lammah_lifecycle_events (candidate_id, created_at);
CREATE INDEX lammah_lifecycle_events_opportunity_idx ON public.lammah_lifecycle_events (opportunity_id, created_at);

CREATE TABLE public.lammah_review_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL UNIQUE REFERENCES public.lammah_import_candidates(id) ON DELETE RESTRICT,
  queue_state text NOT NULL DEFAULT 'open',
  priority smallint NOT NULL DEFAULT 50,
  assigned_to uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  decision text,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lammah_review_queue_state_chk CHECK (queue_state IN ('open','closed')),
  CONSTRAINT lammah_review_queue_priority_chk CHECK (priority BETWEEN 0 AND 100),
  CONSTRAINT lammah_review_queue_decision_chk CHECK (decision IS NULL OR decision IN ('approved','published','rejected','returned','quarantined','suppressed')),
  CONSTRAINT lammah_review_queue_close_chk CHECK ((queue_state = 'closed') = (closed_at IS NOT NULL))
);

CREATE TABLE public.lammah_org_mapping_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL UNIQUE REFERENCES public.lammah_import_candidates(id) ON DELETE RESTRICT,
  raw_name text NOT NULL,
  locality text,
  suggested_company_id uuid REFERENCES public.companies(id) ON DELETE RESTRICT,
  suggestion_basis jsonb NOT NULL DEFAULT '{}'::jsonb,
  state text NOT NULL DEFAULT 'open',
  resolved_company_id uuid REFERENCES public.companies(id) ON DELETE RESTRICT,
  resolved_by uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lammah_org_mapping_queue_state_chk CHECK (state IN ('open','mapped','publish_raw','dismissed')),
  CONSTRAINT lammah_org_mapping_queue_resolution_chk CHECK (
    state <> 'mapped' OR (resolved_company_id IS NOT NULL AND resolved_by IS NOT NULL AND resolved_at IS NOT NULL)
  )
);

CREATE TABLE public.lammah_dead_letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES public.lammah_sources(id) ON DELETE RESTRICT,
  run_id uuid REFERENCES public.lammah_sync_runs(id) ON DELETE RESTRICT,
  evidence_id uuid REFERENCES public.lammah_raw_evidence(id) ON DELETE RESTRICT,
  source_record_id text,
  idempotency_key text,
  error_class text NOT NULL,
  sanitized_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  attempts smallint NOT NULL DEFAULT 0,
  retry_state text NOT NULL DEFAULT 'open',
  next_retry_at timestamptz,
  closed_reason text,
  attributed_worker_identity text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lammah_dead_letters_attempts_chk CHECK (attempts BETWEEN 0 AND 3),
  CONSTRAINT lammah_dead_letters_state_chk CHECK (retry_state IN ('open','redriven','closed','not_retryable')),
  CONSTRAINT lammah_dead_letters_close_chk CHECK (retry_state <> 'closed' OR NULLIF(btrim(closed_reason), '') IS NOT NULL)
);

-- ---------------------------------------------------------------------------
-- Immutable audit integration and default-deny RLS
-- ---------------------------------------------------------------------------

GRANT EXECUTE ON FUNCTION public._write_audit_log(
  uuid, text, text, uuid, jsonb, jsonb, jsonb, inet, text
) TO lammah_function_owner;

CREATE FUNCTION public._lammah_audit_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_old jsonb := CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END;
  v_new jsonb := CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END;
  v_id uuid := COALESCE(NULLIF(v_new->>'id','')::uuid, NULLIF(v_old->>'id','')::uuid);
BEGIN
  PERFORM public._write_audit_log(
    NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid,
    'lammah.' || TG_TABLE_NAME || '.' || lower(TG_OP),
    TG_TABLE_NAME,
    v_id,
    CASE WHEN v_old IS NULL THEN NULL ELSE jsonb_strip_nulls(jsonb_build_object(
      'state',v_old->'state','status',v_old->'status','approval_state',v_old->'approval_state',
      'queue_state',v_old->'queue_state','retry_state',v_old->'retry_state',
      'assigned_to',v_old->'assigned_to','legal_hold',v_old->'legal_hold'
    )) END,
    CASE WHEN v_new IS NULL THEN NULL ELSE jsonb_strip_nulls(jsonb_build_object(
      'state',v_new->'state','status',v_new->'status','approval_state',v_new->'approval_state',
      'queue_state',v_new->'queue_state','retry_state',v_new->'retry_state',
      'assigned_to',v_new->'assigned_to','legal_hold',v_new->'legal_hold'
    )) END,
    jsonb_build_object('database_role', session_user)
  );
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$function$;

CREATE FUNCTION public._lammah_immutable_event_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
  IF TG_TABLE_NAME = 'lammah_opportunity_facts'
     AND TG_OP = 'UPDATE'
     AND OLD.active
     AND NOT NEW.active
     AND OLD.superseded_at IS NULL
     AND NEW.superseded_at IS NOT NULL
     AND (to_jsonb(NEW) - ARRAY['active','superseded_at']::text[])
         = (to_jsonb(OLD) - ARRAY['active','superseded_at']::text[]) THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'lammah_append_only';
END
$function$;

CREATE TRIGGER lammah_lifecycle_events_immutable
  BEFORE UPDATE OR DELETE ON public.lammah_lifecycle_events
  FOR EACH ROW EXECUTE FUNCTION public._lammah_immutable_event_guard();
CREATE TRIGGER lammah_native_match_events_immutable
  BEFORE UPDATE OR DELETE ON public.lammah_native_match_events
  FOR EACH ROW EXECUTE FUNCTION public._lammah_immutable_event_guard();
CREATE TRIGGER lammah_opportunity_facts_immutable
  BEFORE UPDATE OR DELETE ON public.lammah_opportunity_facts
  FOR EACH ROW EXECUTE FUNCTION public._lammah_immutable_event_guard();

DO $audit_triggers$
DECLARE
  v_table text;
BEGIN
  FOREACH v_table IN ARRAY ARRAY[
    'lammah_sources','lammah_sync_runs','lammah_raw_evidence','lammah_import_candidates',
    'lammah_candidate_facts','lammah_opportunity_facts','lammah_source_links',
    'lammah_duplicate_candidates','lammah_native_match_events','lammah_lifecycle_events',
    'lammah_review_queue','lammah_org_mapping_queue','lammah_dead_letters'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', v_table || '_audit', v_table);
    EXECUTE format(
      'CREATE TRIGGER %I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public._lammah_audit_transition()',
      v_table || '_audit', v_table
    );
  END LOOP;
END
$audit_triggers$;

DO $rls$
DECLARE
  v_table text;
BEGIN
  FOREACH v_table IN ARRAY ARRAY[
    'lammah_sync_runs','lammah_raw_evidence','lammah_import_candidates',
    'lammah_candidate_facts','lammah_opportunity_facts','lammah_source_links',
    'lammah_duplicate_candidates','lammah_native_match_events','lammah_lifecycle_events',
    'lammah_review_queue','lammah_org_mapping_queue','lammah_dead_letters'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', v_table);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', v_table);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC, anon, authenticated, service_role, lammah_worker', v_table);
    EXECUTE format('GRANT SELECT ON TABLE public.%I TO authenticated', v_table);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING ((SELECT role FROM public.profiles WHERE id=auth.uid()) IN (''staff'',''super_admin''))',
      v_table || '_lammah_staff_read', v_table
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO lammah_function_owner USING (true) WITH CHECK (true)',
      v_table || '_function_boundary', v_table
    );
  END LOOP;
END
$rls$;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.lammah_sync_runs,
  public.lammah_raw_evidence,
  public.lammah_import_candidates,
  public.lammah_candidate_facts,
  public.lammah_opportunity_facts,
  public.lammah_source_links,
  public.lammah_duplicate_candidates,
  public.lammah_native_match_events,
  public.lammah_lifecycle_events,
  public.lammah_review_queue,
  public.lammah_org_mapping_queue,
  public.lammah_dead_letters
TO lammah_function_owner;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.lammah_sources, public.lammah_opportunities
TO lammah_function_owner;
GRANT SELECT, UPDATE ON TABLE public.feature_flags TO lammah_function_owner;
GRANT SELECT ON TABLE public.profiles,
  public.companies, public.jobs
TO lammah_function_owner;

CREATE POLICY lammah_sources_function_boundary
  ON public.lammah_sources FOR ALL TO lammah_function_owner
  USING (true) WITH CHECK (true);
CREATE POLICY lammah_opportunities_function_boundary
  ON public.lammah_opportunities FOR ALL TO lammah_function_owner
  USING (true) WITH CHECK (true);
CREATE POLICY lammah_companies_function_read
  ON public.companies FOR SELECT TO lammah_function_owner USING (true);
CREATE POLICY lammah_jobs_function_read
  ON public.jobs FOR SELECT TO lammah_function_owner USING (true);
CREATE POLICY lammah_profiles_function_read
  ON public.profiles FOR SELECT TO lammah_function_owner USING (true);
CREATE POLICY lammah_regions_function_read
  ON public.regions FOR SELECT TO lammah_function_owner USING (true);
CREATE POLICY lammah_flags_function_read
  ON public.feature_flags FOR SELECT TO lammah_function_owner
  USING (key LIKE 'lammah.%');
CREATE POLICY lammah_flags_function_update
  ON public.feature_flags FOR UPDATE TO lammah_function_owner
  USING (key LIKE 'lammah.%') WITH CHECK (key LIKE 'lammah.%');

GRANT EXECUTE ON FUNCTION public.normalize_opportunity_title(text) TO lammah_function_owner;
GRANT EXECUTE ON FUNCTION public.normalize_opportunity_url(text) TO lammah_function_owner;
GRANT EXECUTE ON FUNCTION public.find_native_job_conflict(
  public.lammah_opportunity_type_enum, uuid, text, text, text, text, public.experience_level_enum
) TO lammah_function_owner;
GRANT EXECUTE ON FUNCTION public.lock_lammah_native_conflict(uuid, text, text)
  TO lammah_function_owner;
GRANT EXECUTE ON FUNCTION public.lammah_native_opportunity_matches(
  public.lammah_opportunity_type_enum,
  uuid,
  text,
  text,
  text,
  text,
  public.experience_level_enum,
  uuid,
  text,
  text,
  text,
  text,
  public.experience_level_enum
) TO lammah_function_owner;
GRANT EXECUTE ON FUNCTION public.opportunity_titles_match_exactly(text, text, text, text)
  TO lammah_function_owner;
GRANT EXECUTE ON FUNCTION public.opportunity_title_similarity(text, text, text, text)
  TO lammah_function_owner;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO lammah_function_owner;
GRANT EXECUTE ON FUNCTION public.has_entitlement(text) TO lammah_function_owner;
GRANT EXECUTE ON FUNCTION extensions.digest(text, text) TO lammah_function_owner;
GRANT SELECT ON TABLE public.regions TO lammah_function_owner;

-- Client roles never mutate shipped sources or published opportunities.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.lammah_sources,
  public.lammah_opportunities FROM PUBLIC, anon, authenticated, service_role, lammah_worker;
REVOKE SELECT ON TABLE public.lammah_sources, public.lammah_opportunities
  FROM PUBLIC, anon, service_role, lammah_worker;
GRANT SELECT ON TABLE public.lammah_sources, public.lammah_opportunities
  TO authenticated;

DROP POLICY IF EXISTS lammah_sources_staff_all ON public.lammah_sources;
CREATE POLICY lammah_sources_staff_read
  ON public.lammah_sources FOR SELECT TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id=auth.uid()) IN ('staff','super_admin'));

DROP POLICY IF EXISTS lammah_opportunities_staff_update ON public.lammah_opportunities;
DROP POLICY IF EXISTS lammah_opportunities_staff_delete ON public.lammah_opportunities;
DROP POLICY IF EXISTS lammah_opportunities_plus_read ON public.lammah_opportunities;
CREATE POLICY lammah_opportunities_entitled_read
  ON public.lammah_opportunities FOR SELECT TO authenticated
  USING (
    (
      status = 'active'
      AND (expires_at IS NULL OR expires_at > now())
      AND last_confirmed_at > now() - interval '14 days'
      AND public.has_entitlement('lammah_feed')
    )
    OR (SELECT role FROM public.profiles WHERE id=auth.uid()) IN ('staff','super_admin')
  );

ALTER TABLE public.lammah_sources FORCE ROW LEVEL SECURITY;
ALTER TABLE public.lammah_opportunities FORCE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Default-off operational flags
-- ---------------------------------------------------------------------------

INSERT INTO public.feature_flags (
  key,is_enabled,description,label_ar,label_en,description_ar,description_en,category,min_role
)
VALUES
  ('lammah.phase1_ingestion',false,'Lammah Phase-1 master ingestion gate.','إدخال لمّاح — المرحلة الأولى','Lammah Phase 1 ingestion','بوابة الإدخال الرئيسية، معطلة افتراضياً.','Master ingestion gate, disabled by default.','lammah','super_admin'),
  ('lammah.connector_enabled',false,'Lammah EU Careers connector kill switch.','موصل مصدر لمّاح','Lammah connector','مفتاح إيقاف جلب المصدر.','Source retrieval kill switch.','lammah','super_admin'),
  ('lammah.auto_publication_enabled',false,'Lammah global auto-publication gate.','النشر الآلي في لمّاح','Lammah auto-publication','يتطلب أيضاً موافقة المصدر واجتياز جميع البوابات.','Also requires source approval and every eligibility gate.','lammah','super_admin'),
  ('lammah.catalog_bridge_enabled',false,'Optional Catalog candidate bridge.','جسر دليل الجهات','Catalog candidate bridge','معطل افتراضياً ولا يؤثر على نشر الفرص.','Optional and disabled by default.','lammah','super_admin')
ON CONFLICT (key) DO UPDATE SET
  is_enabled=false,
  description=EXCLUDED.description,
  label_ar=EXCLUDED.label_ar,
  label_en=EXCLUDED.label_en,
  description_ar=EXCLUDED.description_ar,
  description_en=EXCLUDED.description_en,
  category=EXCLUDED.category,
  min_role=EXCLUDED.min_role,
  updated_at=now();

REVOKE ALL ON FUNCTION public._lammah_audit_transition()
  FROM PUBLIC, anon, authenticated, service_role, lammah_worker;
REVOKE ALL ON FUNCTION public._lammah_immutable_event_guard()
  FROM PUBLIC, anon, authenticated, service_role, lammah_worker;

GRANT lammah_function_owner TO postgres;
GRANT CREATE ON SCHEMA public TO lammah_function_owner;
ALTER FUNCTION public._lammah_audit_transition() OWNER TO lammah_function_owner;
ALTER FUNCTION public._lammah_immutable_event_guard() OWNER TO lammah_function_owner;
REVOKE CREATE ON SCHEMA public FROM lammah_function_owner;
REVOKE lammah_function_owner FROM postgres;

NOTIFY pgrst, 'reload schema';

COMMIT;
