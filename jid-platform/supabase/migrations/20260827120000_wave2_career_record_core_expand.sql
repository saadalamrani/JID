-- =============================================================================
-- JID Wave 2 / Front 2A — Canonical Career Record + CV Projection Core (EXPAND)
-- =============================================================================
-- Forward-only. Additive. Creates the canonical Career Record persistence,
-- purpose-bound disclosure authorization records, the legacy reconciliation
-- ledger, and CV projection selection/order/snapshot storage.
--
-- Base commit : 2bc4bc394fb63794355052e5ceae35e43ffc520b
-- Packet      : docs/command-center/wave-2/WAVE_2_CAREER_RECORD_MIGRATION_SUBPACKET.md
--
-- NON-DESTRUCTIVE: no legacy CV/Profile table, column, policy or grant is
-- dropped or narrowed here. Legacy tables remain authoritative compatibility
-- inputs until a separately authorized CONTRACT migration.
--
-- Remediations baked in:
--   P1-B  Account-deletion fail-closed guard: an accidental hard delete of a
--         subject that owns canonical evidence now raises an *explained*,
--         intentional error instead of a cryptic FK cascade failure. Named
--         future dependency: JID-WAVE2-ERASURE-DEP (governed erasure/anonymisation).
--   P2-B  CORRECTED is derived from successor lineage; it is never persisted as
--         an ordinary revision verification_state (CHECK forbids it).
--   P2-C  Legacy backfill is structurally constrained to SELF_DECLARED/DECLARED;
--         VERIFIED/CONFIRMED/SOURCED/DERIVED require matching source_class + ref.
--   P2-D  Artifact immutability: a revision's primary_artifact_id may be set
--         exactly once (NULL -> value) through the governed attach function
--         (safe deferred reference); every other UPDATE/DELETE is rejected.
--   P2-A  Deterministic normalisation lives in private.jid_normalize_identity().
--   P1-A  Projection-order determinism + one item per (cv_id, evidence_id) are
--         enforced by the companion backfill migration and the unique indexes
--         declared here.
--   P1-C  profile_skills + Profile education-candidate coverage is enforced by
--         the companion backfill migration and DATA_LOSS=0 evidence queries.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. Extensions / schema
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 1. Enumerations (values match the frozen TypeScript contracts exactly)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.career_evidence_category_enum AS ENUM
    ('EDUCATION','EXPERIENCE','SKILL','PROJECT','CREDENTIAL','AWARD','LANGUAGE','VOLUNTEERING','PUBLICATION','OTHER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.career_evidence_source_class_enum AS ENUM
    ('SELF_DECLARED','ISSUER_VERIFIED','ORGANIZATION_CONFIRMED','SYSTEM_OBSERVED','THIRD_PARTY_SOURCED','DERIVED_EXPLAINABLE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.career_evidence_state_enum AS ENUM
    ('DECLARED','VERIFIED','CONFIRMED','SOURCED','DERIVED','DISPUTED','CORRECTED','REVOKED','EXPIRED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.career_evidence_lifecycle_enum AS ENUM
    ('ACTIVE','DISPUTED','REVOKED','EXPIRED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.career_reconciliation_state_enum AS ENUM
    ('LINKED','DEDUPLICATED','CONFLICT_NEEDS_REVIEW','INVALID_PRESERVED','DEFERRED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.disclosure_recipient_type_enum AS ENUM
    ('PUBLIC','BUSINESS','UNIVERSITY','MENTOR','VENDOR','SYSTEM','OTHER_APPROVED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.authorization_basis_type_enum AS ENUM
    ('CONSENT','CONTRACT','LEGAL_OBLIGATION','LEGITIMATE_AUTHORITY','PUBLIC_TASK','OTHER_REVIEWED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.disclosure_authorization_state_enum AS ENUM
    ('ACTIVE','REVOKED','EXPIRED','SUPERSEDED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.cv_snapshot_purpose_enum AS ENUM
    ('EXPORT','APPLICATION','PUBLIC_SHARE','PROFILE_PREVIEW','RECIPIENT_DISCLOSURE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- 2. Shared immutable helpers
-- ---------------------------------------------------------------------------

-- Reference JSON: null OR object with non-blank string `id`; optional `version` string.
CREATE OR REPLACE FUNCTION private.jid_is_reference_json(p jsonb)
RETURNS boolean
LANGUAGE sql IMMUTABLE PARALLEL SAFE
SET search_path = pg_catalog
AS $$
  SELECT p IS NULL OR (
    jsonb_typeof(p) = 'object'
    AND jsonb_typeof(p -> 'id') = 'string'
    AND length(btrim(p ->> 'id')) > 0
    AND (NOT (p ? 'version') OR jsonb_typeof(p -> 'version') = 'string')
  );
$$;

-- P2-A: deterministic normalisation for legacy dedupe identity keys.
--  * trim outer whitespace
--  * collapse internal whitespace runs to a single ASCII space
--  * strip Arabic tatweel (U+0640)
--  * strip Arabic diacritics / harakat (U+064B..U+0652, U+0670)
--  * Unicode NFKC normalise
--  * casefold (lower) for case-insensitive identity
--  * empty / null -> NULL (never an invented value)
CREATE OR REPLACE FUNCTION private.jid_normalize_identity(p text)
RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE
SET search_path = pg_catalog
AS $$
  SELECT CASE
    WHEN p IS NULL THEN NULL
    ELSE NULLIF(
      lower(
        normalize(
          btrim(
            regexp_replace(
              regexp_replace(
                translate(p, E'ـ', ''),                 -- tatweel
                E'[ً-ْٰ]', '', 'g'             -- harakat
              ),
              '\s+', ' ', 'g'                                  -- collapse whitespace
            )
          ),
          NFKC
        )
      ),
      ''
    )
  END;
$$;

-- Canonical payload hash used for exact-duplicate detection (order-stable).
CREATE OR REPLACE FUNCTION private.jid_canonical_payload_hash(p jsonb)
RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE
SET search_path = pg_catalog, extensions
AS $$
  SELECT encode(extensions.digest(convert_to(coalesce(p, '{}'::jsonb)::text, 'UTF8'), 'sha256'), 'hex');
$$;

-- ---------------------------------------------------------------------------
-- 3. career_evidence_disclosure_policies  (immutable C2 policy records)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.career_evidence_disclosure_policies (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id           uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  contract_version     text NOT NULL DEFAULT '1.0' CHECK (contract_version = '1.0'),
  default_visibility   text NOT NULL DEFAULT 'PRIVATE' CHECK (default_visibility = 'PRIVATE'),
  supersedes_policy_id uuid REFERENCES public.career_evidence_disclosure_policies (id) ON DELETE RESTRICT,
  created_by           uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_career_disclosure_policies_supersedes
  ON public.career_evidence_disclosure_policies (supersedes_policy_id)
  WHERE supersedes_policy_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_career_disclosure_policies_subject
  ON public.career_evidence_disclosure_policies (subject_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- 4. career_evidence  (stable root identity for one subject-owned fact lineage)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.career_evidence (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id           uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  category             public.career_evidence_category_enum NOT NULL,
  disclosure_policy_id uuid NOT NULL REFERENCES public.career_evidence_disclosure_policies (id) ON DELETE RESTRICT,
  current_revision_id  uuid,  -- deferred FK added after revisions table exists
  lifecycle_state      public.career_evidence_lifecycle_enum NOT NULL DEFAULT 'ACTIVE',
  archived_at          timestamptz,
  archived_by          uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_career_evidence_id_subject UNIQUE (id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_career_evidence_subject_cat
  ON public.career_evidence (subject_id, category, lifecycle_state, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_career_evidence_subject_active
  ON public.career_evidence (subject_id, archived_at) WHERE archived_at IS NULL;

-- ---------------------------------------------------------------------------
-- 5. career_evidence_revisions  (immutable fact / provenance revisions)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.career_evidence_revisions (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id              uuid NOT NULL,
  subject_id               uuid NOT NULL,
  revision_no              integer NOT NULL CHECK (revision_no >= 1),
  contract_version         text NOT NULL DEFAULT '1.0' CHECK (contract_version = '1.0'),
  fact_payload             jsonb NOT NULL CHECK (jsonb_typeof(fact_payload) = 'object'),
  source_class             public.career_evidence_source_class_enum NOT NULL,
  source_ref               jsonb CHECK (private.jid_is_reference_json(source_ref)),
  verification_state       public.career_evidence_state_enum NOT NULL,
  effective_from           timestamptz,
  effective_to             timestamptz,
  observed_at              timestamptz,
  supersedes_revision_id   uuid REFERENCES public.career_evidence_revisions (id) ON DELETE RESTRICT,
  dispute_ref              jsonb CHECK (private.jid_is_reference_json(dispute_ref)),
  revocation_or_expiry_ref jsonb CHECK (private.jid_is_reference_json(revocation_or_expiry_ref)),
  primary_artifact_id      uuid,  -- deferred FK added after artifacts table exists
  market_context_ref       jsonb CHECK (private.jid_is_reference_json(market_context_ref)),
  created_by               uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  created_at               timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_revision_evidence
    FOREIGN KEY (evidence_id, subject_id)
    REFERENCES public.career_evidence (id, subject_id) ON DELETE RESTRICT,
  CONSTRAINT uq_revision_evidence_no UNIQUE (evidence_id, revision_no),
  CONSTRAINT chk_revision_effective_range
    CHECK (effective_to IS NULL OR effective_from IS NULL OR effective_to >= effective_from),
  -- P2-B: CORRECTED is a derived history state, never a stored ordinary revision state.
  CONSTRAINT chk_revision_state_not_derived_label
    CHECK (verification_state <> 'CORRECTED'),
  -- Stronger states require the matching source_class + a non-null source_ref.
  CONSTRAINT chk_revision_verified
    CHECK (verification_state <> 'VERIFIED'
           OR (source_class = 'ISSUER_VERIFIED' AND source_ref IS NOT NULL)),
  CONSTRAINT chk_revision_confirmed
    CHECK (verification_state <> 'CONFIRMED'
           OR (source_class = 'ORGANIZATION_CONFIRMED' AND source_ref IS NOT NULL)),
  CONSTRAINT chk_revision_sourced
    CHECK (verification_state <> 'SOURCED'
           OR (source_class = 'THIRD_PARTY_SOURCED' AND source_ref IS NOT NULL)),
  CONSTRAINT chk_revision_derived
    CHECK (verification_state <> 'DERIVED'
           OR (source_class = 'DERIVED_EXPLAINABLE' AND source_ref IS NOT NULL)),
  CONSTRAINT chk_revision_disputed
    CHECK (verification_state <> 'DISPUTED' OR dispute_ref IS NOT NULL),
  CONSTRAINT chk_revision_revoked_expired
    CHECK (verification_state NOT IN ('REVOKED','EXPIRED') OR revocation_or_expiry_ref IS NOT NULL),
  CONSTRAINT uq_revision_supersedes UNIQUE (supersedes_revision_id)
);

CREATE INDEX IF NOT EXISTS idx_career_revisions_subject_created
  ON public.career_evidence_revisions (subject_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_career_revisions_evidence_no
  ON public.career_evidence_revisions (evidence_id, revision_no DESC);

-- ---------------------------------------------------------------------------
-- 6. career_evidence_artifacts  (private evidence/proof metadata; no public URLs)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.career_evidence_artifacts (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id           uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  evidence_id          uuid NOT NULL REFERENCES public.career_evidence (id) ON DELETE RESTRICT,
  revision_id          uuid NOT NULL REFERENCES public.career_evidence_revisions (id) ON DELETE RESTRICT,
  bucket_id            text NOT NULL CHECK (bucket_id = 'career-evidence'),
  object_path          text NOT NULL,
  media_type           text NOT NULL,
  byte_size            bigint NOT NULL CHECK (byte_size > 0),
  sha256               text NOT NULL CHECK (sha256 ~ '^[0-9a-f]{64}$'),
  retention_policy_ref jsonb NOT NULL CHECK (private.jid_is_reference_json(retention_policy_ref) AND retention_policy_ref IS NOT NULL),
  uploaded_by          uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  created_at           timestamptz NOT NULL DEFAULT now(),
  revoked_at           timestamptz,
  deleted_at           timestamptz,
  CONSTRAINT uq_artifact_bucket_object UNIQUE (bucket_id, object_path)
);
CREATE INDEX IF NOT EXISTS idx_career_artifacts_subject_evidence
  ON public.career_evidence_artifacts (subject_id, evidence_id);

-- ---------------------------------------------------------------------------
-- 7. Deferred / circular foreign keys
-- ---------------------------------------------------------------------------
ALTER TABLE public.career_evidence
  ADD CONSTRAINT fk_career_evidence_current_revision
  FOREIGN KEY (current_revision_id)
  REFERENCES public.career_evidence_revisions (id) ON DELETE RESTRICT
  DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE public.career_evidence_revisions
  ADD CONSTRAINT fk_revision_primary_artifact
  FOREIGN KEY (primary_artifact_id)
  REFERENCES public.career_evidence_artifacts (id) ON DELETE RESTRICT
  DEFERRABLE INITIALLY DEFERRED;

-- ---------------------------------------------------------------------------
-- 8. disclosure_authorizations  (purpose-bound C5 records)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.disclosure_authorizations (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_version            text NOT NULL DEFAULT '1.0' CHECK (contract_version = '1.0'),
  subject_id                  uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  object_ref                  jsonb CHECK (private.jid_is_reference_json(object_ref)),
  data_category               text CHECK (data_category IS NULL OR length(btrim(data_category)) > 0),
  recipient_type              public.disclosure_recipient_type_enum NOT NULL,
  recipient_ref               jsonb CHECK (private.jid_is_reference_json(recipient_ref)),
  purpose_code                text NOT NULL CHECK (length(btrim(purpose_code)) > 0),
  basis_type                  public.authorization_basis_type_enum NOT NULL,
  basis_ref                   jsonb NOT NULL CHECK (private.jid_is_reference_json(basis_ref) AND basis_ref IS NOT NULL),
  state                       public.disclosure_authorization_state_enum NOT NULL DEFAULT 'ACTIVE',
  effective_at                timestamptz NOT NULL,
  expires_at                  timestamptz,
  revoked_at                  timestamptz,
  retention_policy_ref        jsonb NOT NULL CHECK (private.jid_is_reference_json(retention_policy_ref) AND retention_policy_ref IS NOT NULL),
  created_by                  uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  supersedes_authorization_id uuid REFERENCES public.disclosure_authorizations (id) ON DELETE RESTRICT,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_disclosure_object_xor
    CHECK ((object_ref IS NOT NULL) <> (data_category IS NOT NULL)),
  CONSTRAINT chk_disclosure_recipient_ref
    CHECK (recipient_type IN ('PUBLIC','SYSTEM') OR recipient_ref IS NOT NULL),
  CONSTRAINT chk_disclosure_expiry
    CHECK (expires_at IS NULL OR expires_at >= effective_at),
  CONSTRAINT chk_disclosure_revoked
    CHECK (state <> 'REVOKED' OR revoked_at IS NOT NULL),
  CONSTRAINT uq_disclosure_supersedes UNIQUE (supersedes_authorization_id)
);
CREATE INDEX IF NOT EXISTS idx_disclosure_auth_active_lookup
  ON public.disclosure_authorizations (subject_id, purpose_code, recipient_type)
  WHERE state = 'ACTIVE';

-- ---------------------------------------------------------------------------
-- 9. career_evidence_legacy_sources  (append-only reconciliation ledger)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.career_evidence_legacy_sources (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id              uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  source_table            text NOT NULL CHECK (source_table IN (
                            'cv_education','cv_experience','cv_skills','cv_additional',
                            'cvs.technical_skills','cvs.languages',
                            'profiles.education','profiles.presentation','profile_skills')),
  source_locator          text NOT NULL,
  source_cv_id            uuid REFERENCES public.cvs (id) ON DELETE RESTRICT,
  evidence_id             uuid REFERENCES public.career_evidence (id) ON DELETE RESTRICT,
  revision_id             uuid REFERENCES public.career_evidence_revisions (id) ON DELETE RESTRICT,
  source_snapshot         jsonb NOT NULL,
  source_sha256           text NOT NULL CHECK (source_sha256 ~ '^[0-9a-f]{64}$'),
  normalized_identity_key text,
  reconciliation_state    public.career_reconciliation_state_enum NOT NULL,
  precedence_rank         smallint NOT NULL CHECK (precedence_rank BETWEEN 1 AND 99),
  conflict_group_id       uuid,
  migration_batch_id      uuid NOT NULL,
  notes                   text,
  created_at              timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_legacy_source_locator UNIQUE (source_table, source_locator)
);
CREATE INDEX IF NOT EXISTS idx_legacy_sources_subject
  ON public.career_evidence_legacy_sources (subject_id, source_table);
CREATE INDEX IF NOT EXISTS idx_legacy_sources_evidence
  ON public.career_evidence_legacy_sources (evidence_id) WHERE evidence_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_legacy_sources_conflict_group
  ON public.career_evidence_legacy_sources (conflict_group_id) WHERE conflict_group_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_legacy_sources_batch
  ON public.career_evidence_legacy_sources (migration_batch_id);

-- ---------------------------------------------------------------------------
-- 10. cv_projection_sections  (presentation-only section state on cvs)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cv_projection_sections (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cv_id                 uuid NOT NULL REFERENCES public.cvs (id) ON DELETE CASCADE,
  section_key           text NOT NULL CHECK (section_key IN (
                          'HEADER','SUMMARY','EXPERIENCE','EDUCATION','SKILLS','CREDENTIALS',
                          'PROJECTS','AWARDS','LANGUAGES','VOLUNTEERING','PUBLICATIONS','OTHER')),
  heading_override      text,
  sort_order            integer NOT NULL CHECK (sort_order >= 0),
  is_visible            boolean NOT NULL DEFAULT true,
  presentation_settings jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(presentation_settings) = 'object'),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_cv_section_key UNIQUE (cv_id, section_key)
);
ALTER TABLE public.cv_projection_sections
  ADD CONSTRAINT uq_cv_section_order UNIQUE (cv_id, sort_order) DEFERRABLE INITIALLY DEFERRED;

-- ---------------------------------------------------------------------------
-- 11. cv_projection_items  (selection + ordering of canonical evidence)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cv_projection_items (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cv_id                uuid NOT NULL REFERENCES public.cvs (id) ON DELETE CASCADE,
  section_id           uuid NOT NULL REFERENCES public.cv_projection_sections (id) ON DELETE CASCADE,
  evidence_id          uuid NOT NULL REFERENCES public.career_evidence (id) ON DELETE RESTRICT,
  sort_order           integer NOT NULL CHECK (sort_order >= 0),
  is_selected          boolean NOT NULL DEFAULT true,
  presentation_payload jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(presentation_payload) = 'object'),
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  -- P1-A: exactly one projection item per (cv_id, evidence_id).
  CONSTRAINT uq_cv_item_evidence UNIQUE (cv_id, evidence_id)
);
ALTER TABLE public.cv_projection_items
  ADD CONSTRAINT uq_cv_item_section_order UNIQUE (section_id, sort_order) DEFERRABLE INITIALLY DEFERRED;

-- presentation_payload is whitelisted to presentation keys only; canonical fact keys rejected.
CREATE OR REPLACE FUNCTION private.jid_projection_payload_is_valid(p jsonb)
RETURNS boolean
LANGUAGE sql IMMUTABLE PARALLEL SAFE
SET search_path = pg_catalog
AS $$
  SELECT p IS NOT NULL
     AND jsonb_typeof(p) = 'object'
     AND NOT EXISTS (
       SELECT 1 FROM jsonb_object_keys(p) k
       WHERE k NOT IN ('display_title','summary','selected_bullets','section_label','locale_variant','notes')
     );
$$;
ALTER TABLE public.cv_projection_items
  ADD CONSTRAINT chk_cv_item_presentation_payload
  CHECK (private.jid_projection_payload_is_valid(presentation_payload));

-- ---------------------------------------------------------------------------
-- 12. cv_projection_snapshots  (immutable historical expression)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cv_projection_snapshots (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cv_id                       uuid NOT NULL REFERENCES public.cvs (id) ON DELETE RESTRICT,
  subject_id                  uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  purpose                     public.cv_snapshot_purpose_enum NOT NULL,
  application_id              uuid REFERENCES public.applications (id) ON DELETE RESTRICT,
  disclosure_authorization_id uuid REFERENCES public.disclosure_authorizations (id) ON DELETE RESTRICT,
  projection_version          integer NOT NULL CHECK (projection_version >= 1),
  locale                      text NOT NULL CHECK (locale IN ('ar','en')),
  template_key                text NOT NULL CHECK (length(btrim(template_key)) > 0),
  snapshot_payload            jsonb NOT NULL CHECK (jsonb_typeof(snapshot_payload) = 'object'),
  evidence_revision_manifest  jsonb NOT NULL CHECK (jsonb_typeof(evidence_revision_manifest) = 'array'),
  content_sha256              text NOT NULL CHECK (content_sha256 ~ '^[0-9a-f]{64}$'),
  retention_policy_ref        jsonb NOT NULL CHECK (private.jid_is_reference_json(retention_policy_ref) AND retention_policy_ref IS NOT NULL),
  created_by                  uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  expires_at                  timestamptz,
  revoked_at                  timestamptz,
  CONSTRAINT chk_snapshot_authorization_shape CHECK (
    (purpose IN ('APPLICATION','PUBLIC_SHARE','RECIPIENT_DISCLOSURE') AND disclosure_authorization_id IS NOT NULL)
    OR (purpose IN ('EXPORT','PROFILE_PREVIEW') AND disclosure_authorization_id IS NULL)
  ),
  CONSTRAINT chk_snapshot_application_shape CHECK (
    (purpose = 'APPLICATION' AND application_id IS NOT NULL)
    OR (purpose <> 'APPLICATION' AND application_id IS NULL)
  )
);
CREATE INDEX IF NOT EXISTS idx_cv_snapshots_subject
  ON public.cv_projection_snapshots (subject_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cv_snapshots_application
  ON public.cv_projection_snapshots (application_id) WHERE application_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cv_snapshots_authorization
  ON public.cv_projection_snapshots (disclosure_authorization_id) WHERE disclosure_authorization_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 13. applications compatibility column
-- ---------------------------------------------------------------------------
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS cv_snapshot_id uuid REFERENCES public.cv_projection_snapshots (id) ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS idx_applications_cv_snapshot
  ON public.applications (cv_snapshot_id) WHERE cv_snapshot_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 14. Immutability + integrity triggers
-- ---------------------------------------------------------------------------

-- 14a. disclosure policies: fully immutable.
CREATE OR REPLACE FUNCTION private.jid_block_row_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
BEGIN
  RAISE EXCEPTION '% rows are immutable (id=%)', TG_TABLE_NAME,
    coalesce((to_jsonb(OLD) ->> 'id'), '?')
    USING ERRCODE = 'restrict_violation';
END;
$$;

DROP TRIGGER IF EXISTS trg_disclosure_policies_immutable ON public.career_evidence_disclosure_policies;
CREATE TRIGGER trg_disclosure_policies_immutable
  BEFORE UPDATE OR DELETE ON public.career_evidence_disclosure_policies
  FOR EACH ROW EXECUTE FUNCTION private.jid_block_row_mutation();

DROP TRIGGER IF EXISTS trg_cv_snapshots_immutable ON public.cv_projection_snapshots;
CREATE TRIGGER trg_cv_snapshots_immutable
  BEFORE UPDATE OR DELETE ON public.cv_projection_snapshots
  FOR EACH ROW EXECUTE FUNCTION private.jid_block_row_mutation();

DROP TRIGGER IF EXISTS trg_legacy_sources_append_only ON public.career_evidence_legacy_sources;
CREATE TRIGGER trg_legacy_sources_append_only
  BEFORE UPDATE OR DELETE ON public.career_evidence_legacy_sources
  FOR EACH ROW EXECUTE FUNCTION private.jid_block_row_mutation();

-- 14b. revisions: immutable EXCEPT the one-time governed primary_artifact_id link (P2-D).
CREATE OR REPLACE FUNCTION private.jid_revisions_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'career_evidence_revisions rows are immutable (id=%)', OLD.id
      USING ERRCODE = 'restrict_violation';
  END IF;

  -- Permit only: NULL -> non-NULL primary_artifact_id, nothing else changed,
  -- and only inside the governed attach operation.
  IF OLD.primary_artifact_id IS NULL
     AND NEW.primary_artifact_id IS NOT NULL
     AND current_setting('jid.allow_artifact_link', true) = 'on'
     AND ROW(
           NEW.id, NEW.evidence_id, NEW.subject_id, NEW.revision_no, NEW.contract_version,
           NEW.fact_payload, NEW.source_class, NEW.source_ref, NEW.verification_state,
           NEW.effective_from, NEW.effective_to, NEW.observed_at, NEW.supersedes_revision_id,
           NEW.dispute_ref, NEW.revocation_or_expiry_ref, NEW.market_context_ref,
           NEW.created_by, NEW.created_at
         ) IS NOT DISTINCT FROM ROW(
           OLD.id, OLD.evidence_id, OLD.subject_id, OLD.revision_no, OLD.contract_version,
           OLD.fact_payload, OLD.source_class, OLD.source_ref, OLD.verification_state,
           OLD.effective_from, OLD.effective_to, OLD.observed_at, OLD.supersedes_revision_id,
           OLD.dispute_ref, OLD.revocation_or_expiry_ref, OLD.market_context_ref,
           OLD.created_by, OLD.created_at
         )
  THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'career_evidence_revisions rows are immutable (id=%); attach artifacts through attach_career_evidence_artifact()', OLD.id
    USING ERRCODE = 'restrict_violation';
END;
$$;

DROP TRIGGER IF EXISTS trg_revisions_guard ON public.career_evidence_revisions;
CREATE TRIGGER trg_revisions_guard
  BEFORE UPDATE OR DELETE ON public.career_evidence_revisions
  FOR EACH ROW EXECUTE FUNCTION private.jid_revisions_guard();

-- 14c. revision lineage: revision 1 has no predecessor; N supersedes N-1 of same root.
CREATE OR REPLACE FUNCTION private.jid_revision_lineage_check()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
DECLARE
  pred public.career_evidence_revisions%ROWTYPE;
BEGIN
  IF NEW.revision_no = 1 THEN
    IF NEW.supersedes_revision_id IS NOT NULL THEN
      RAISE EXCEPTION 'revision 1 of evidence % cannot supersede another revision', NEW.evidence_id;
    END IF;
  ELSE
    IF NEW.supersedes_revision_id IS NULL THEN
      RAISE EXCEPTION 'revision % of evidence % must supersede revision %', NEW.revision_no, NEW.evidence_id, NEW.revision_no - 1;
    END IF;
    SELECT * INTO pred FROM public.career_evidence_revisions WHERE id = NEW.supersedes_revision_id;
    IF NOT FOUND OR pred.evidence_id <> NEW.evidence_id OR pred.revision_no <> NEW.revision_no - 1 THEN
      RAISE EXCEPTION 'revision % of evidence % must supersede revision % of the same root', NEW.revision_no, NEW.evidence_id, NEW.revision_no - 1;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_revision_lineage ON public.career_evidence_revisions;
CREATE TRIGGER trg_revision_lineage
  BEFORE INSERT ON public.career_evidence_revisions
  FOR EACH ROW EXECUTE FUNCTION private.jid_revision_lineage_check();

-- 14d. deferred cross-table integrity (constraint triggers).
CREATE OR REPLACE FUNCTION private.jid_evidence_integrity_check()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
DECLARE
  pol public.career_evidence_disclosure_policies%ROWTYPE;
  rev public.career_evidence_revisions%ROWTYPE;
BEGIN
  SELECT * INTO pol FROM public.career_evidence_disclosure_policies WHERE id = NEW.disclosure_policy_id;
  IF NOT FOUND OR pol.subject_id <> NEW.subject_id OR pol.default_visibility <> 'PRIVATE' THEN
    RAISE EXCEPTION 'career_evidence % has an invalid or foreign disclosure policy', NEW.id;
  END IF;

  IF NEW.current_revision_id IS NOT NULL THEN
    SELECT * INTO rev FROM public.career_evidence_revisions WHERE id = NEW.current_revision_id;
    IF NOT FOUND OR rev.evidence_id <> NEW.id OR rev.subject_id <> NEW.subject_id THEN
      RAISE EXCEPTION 'career_evidence % current_revision_id % is inconsistent', NEW.id, NEW.current_revision_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$;
DROP TRIGGER IF EXISTS trg_evidence_integrity ON public.career_evidence;
CREATE CONSTRAINT TRIGGER trg_evidence_integrity
  AFTER INSERT OR UPDATE ON public.career_evidence
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION private.jid_evidence_integrity_check();

CREATE OR REPLACE FUNCTION private.jid_artifact_integrity_check()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
DECLARE
  ev public.career_evidence%ROWTYPE;
  rev public.career_evidence_revisions%ROWTYPE;
BEGIN
  SELECT * INTO ev FROM public.career_evidence WHERE id = NEW.evidence_id;
  IF NOT FOUND OR ev.subject_id <> NEW.subject_id THEN
    RAISE EXCEPTION 'artifact % subject/evidence mismatch', NEW.id;
  END IF;
  SELECT * INTO rev FROM public.career_evidence_revisions WHERE id = NEW.revision_id;
  IF NOT FOUND OR rev.evidence_id <> NEW.evidence_id OR rev.subject_id <> NEW.subject_id THEN
    RAISE EXCEPTION 'artifact % revision mismatch', NEW.id;
  END IF;
  IF split_part(NEW.object_path, '/', 1) <> NEW.subject_id::text THEN
    RAISE EXCEPTION 'artifact % object_path must be prefixed by subject_id', NEW.id;
  END IF;
  RETURN NULL;
END;
$$;
DROP TRIGGER IF EXISTS trg_artifact_integrity ON public.career_evidence_artifacts;
CREATE CONSTRAINT TRIGGER trg_artifact_integrity
  AFTER INSERT OR UPDATE ON public.career_evidence_artifacts
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION private.jid_artifact_integrity_check();

CREATE OR REPLACE FUNCTION private.jid_projection_item_integrity_check()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
DECLARE
  cv_owner uuid;
  ev_subject uuid;
  sec_cv uuid;
BEGIN
  SELECT user_id INTO cv_owner FROM public.cvs WHERE id = NEW.cv_id;
  SELECT subject_id INTO ev_subject FROM public.career_evidence WHERE id = NEW.evidence_id;
  SELECT cv_id INTO sec_cv FROM public.cv_projection_sections WHERE id = NEW.section_id;
  IF cv_owner IS NULL OR ev_subject IS NULL OR cv_owner <> ev_subject THEN
    RAISE EXCEPTION 'cv_projection_items %: CV owner must equal evidence subject', NEW.id;
  END IF;
  IF sec_cv IS DISTINCT FROM NEW.cv_id THEN
    RAISE EXCEPTION 'cv_projection_items %: section must belong to the same CV', NEW.id;
  END IF;
  RETURN NULL;
END;
$$;
DROP TRIGGER IF EXISTS trg_projection_item_integrity ON public.cv_projection_items;
CREATE CONSTRAINT TRIGGER trg_projection_item_integrity
  AFTER INSERT OR UPDATE ON public.cv_projection_items
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION private.jid_projection_item_integrity_check();

-- touch updated_at
CREATE OR REPLACE FUNCTION private.jid_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_career_evidence_touch ON public.career_evidence;
CREATE TRIGGER trg_career_evidence_touch BEFORE UPDATE ON public.career_evidence
  FOR EACH ROW EXECUTE FUNCTION private.jid_touch_updated_at();
DROP TRIGGER IF EXISTS trg_cv_sections_touch ON public.cv_projection_sections;
CREATE TRIGGER trg_cv_sections_touch BEFORE UPDATE ON public.cv_projection_sections
  FOR EACH ROW EXECUTE FUNCTION private.jid_touch_updated_at();
DROP TRIGGER IF EXISTS trg_cv_items_touch ON public.cv_projection_items;
CREATE TRIGGER trg_cv_items_touch BEFORE UPDATE ON public.cv_projection_items
  FOR EACH ROW EXECUTE FUNCTION private.jid_touch_updated_at();

-- ---------------------------------------------------------------------------
-- 15. P1-B — account-deletion fail-closed guard
-- ---------------------------------------------------------------------------
-- Canonical evidence FKs use ON DELETE RESTRICT to protect immutable history,
-- lineage, audit integrity and snapshots. Without this guard, an attempt to
-- hard-delete a subject that owns any canonical evidence would surface as an
-- opaque foreign-key error from whichever child table PostgreSQL checked first.
--
-- This guard makes the outcome intentional and explained. Account
-- deletion / erasure for subjects with canonical Career Record data is NOT
-- supported in Wave 2 and fails closed here.
--
-- FUTURE DEPENDENCY (named): JID-WAVE2-ERASURE-DEP — "Governed Account Erasure /
-- Anonymisation". A later, separately-authorized workstream must reconcile
-- applicable deletion rights, retained legal/audit obligations, immutable
-- hiring/application history legitimately retained, personal-data minimisation,
-- and anonymisation where appropriate. This migration invents no legal basis
-- and asserts no approved production erasure model.
CREATE OR REPLACE FUNCTION public.guard_career_record_account_deletion()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
DECLARE
  has_canonical boolean;
BEGIN
  SELECT
    EXISTS (SELECT 1 FROM public.career_evidence WHERE subject_id = OLD.id)
    OR EXISTS (SELECT 1 FROM public.career_evidence_disclosure_policies WHERE subject_id = OLD.id OR created_by = OLD.id)
    OR EXISTS (SELECT 1 FROM public.career_evidence_revisions WHERE subject_id = OLD.id OR created_by = OLD.id)
    OR EXISTS (SELECT 1 FROM public.career_evidence_artifacts WHERE subject_id = OLD.id OR uploaded_by = OLD.id)
    OR EXISTS (SELECT 1 FROM public.disclosure_authorizations WHERE subject_id = OLD.id OR created_by = OLD.id)
    OR EXISTS (SELECT 1 FROM public.career_evidence_legacy_sources WHERE subject_id = OLD.id)
    OR EXISTS (SELECT 1 FROM public.cv_projection_snapshots WHERE subject_id = OLD.id OR created_by = OLD.id)
  INTO has_canonical;

  IF has_canonical THEN
    RAISE EXCEPTION
      'Account deletion blocked for subject %: canonical Career Record evidence is retained under RESTRICT semantics and cannot be cascade-deleted.', OLD.id
      USING
        ERRCODE = 'restrict_violation',
        HINT = 'Governed account erasure/anonymisation (JID-WAVE2-ERASURE-DEP) is a required future dependency and is not implemented in Wave 2. Perform this removal through the governed erasure path once available.';
  END IF;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_guard_career_record_deletion ON public.profiles;
CREATE TRIGGER trg_profiles_guard_career_record_deletion
  BEFORE DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_career_record_account_deletion();

REVOKE ALL ON FUNCTION public.guard_career_record_account_deletion() FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 16. Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE public.career_evidence_disclosure_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_evidence_disclosure_policies FORCE ROW LEVEL SECURITY;
ALTER TABLE public.career_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_evidence FORCE ROW LEVEL SECURITY;
ALTER TABLE public.career_evidence_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_evidence_revisions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.career_evidence_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_evidence_artifacts FORCE ROW LEVEL SECURITY;
ALTER TABLE public.disclosure_authorizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disclosure_authorizations FORCE ROW LEVEL SECURITY;
ALTER TABLE public.career_evidence_legacy_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_evidence_legacy_sources FORCE ROW LEVEL SECURITY;
ALTER TABLE public.cv_projection_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cv_projection_sections FORCE ROW LEVEL SECURITY;
ALTER TABLE public.cv_projection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cv_projection_items FORCE ROW LEVEL SECURITY;
ALTER TABLE public.cv_projection_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cv_projection_snapshots FORCE ROW LEVEL SECURITY;

-- Owner-only SELECT on canonical roots/revisions/policies/artifacts/authorizations/ledger.
-- No base-table anon grant. No blanket staff role access. Non-owner disclosure is
-- server-authorized through SECURITY DEFINER resolve functions only.
CREATE POLICY cedp_select_own ON public.career_evidence_disclosure_policies
  FOR SELECT TO authenticated USING (subject_id = (SELECT auth.uid()));
CREATE POLICY ce_select_own ON public.career_evidence
  FOR SELECT TO authenticated USING (subject_id = (SELECT auth.uid()));
CREATE POLICY cer_select_own ON public.career_evidence_revisions
  FOR SELECT TO authenticated USING (subject_id = (SELECT auth.uid()));
CREATE POLICY cea_select_own ON public.career_evidence_artifacts
  FOR SELECT TO authenticated USING (subject_id = (SELECT auth.uid()));
CREATE POLICY da_select_own ON public.disclosure_authorizations
  FOR SELECT TO authenticated USING (subject_id = (SELECT auth.uid()));
CREATE POLICY cels_select_own ON public.career_evidence_legacy_sources
  FOR SELECT TO authenticated USING (subject_id = (SELECT auth.uid()));

-- CV projection sections/items: owner CRUD (owner = cvs.user_id). Integrity triggers
-- additionally enforce subject == owner and section/CV consistency.
CREATE POLICY cvps_all_own ON public.cv_projection_sections
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.cvs c WHERE c.id = cv_projection_sections.cv_id AND c.user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.cvs c WHERE c.id = cv_projection_sections.cv_id AND c.user_id = (SELECT auth.uid())));
CREATE POLICY cvpi_all_own ON public.cv_projection_items
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.cvs c WHERE c.id = cv_projection_items.cv_id AND c.user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.cvs c WHERE c.id = cv_projection_items.cv_id AND c.user_id = (SELECT auth.uid())));

-- CV snapshots: owner SELECT only; creation is via create_cv_projection_snapshot() (SECURITY DEFINER).
CREATE POLICY cvsnap_select_own ON public.cv_projection_snapshots
  FOR SELECT TO authenticated USING (subject_id = (SELECT auth.uid()));

-- ---------------------------------------------------------------------------
-- 17. Governed write functions (SECURITY DEFINER)
-- ---------------------------------------------------------------------------
-- All functions: fixed search_path, execute revoked from PUBLIC/anon, granted to
-- authenticated + service_role, check auth.uid() internally, never trust a
-- caller-supplied subject/actor id without an equality check.

-- 17.1 create_career_evidence — declared self-authored evidence + private policy.
CREATE OR REPLACE FUNCTION public.create_career_evidence(
  p_category           public.career_evidence_category_enum,
  p_fact_payload       jsonb,
  p_effective_from     timestamptz DEFAULT NULL,
  p_effective_to       timestamptz DEFAULT NULL,
  p_observed_at        timestamptz DEFAULT NULL,
  p_source_ref         jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_policy_id uuid;
  v_evidence_id uuid;
  v_revision_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF p_fact_payload IS NULL OR jsonb_typeof(p_fact_payload) <> 'object' THEN
    RAISE EXCEPTION 'fact_payload must be a JSON object';
  END IF;

  INSERT INTO public.career_evidence_disclosure_policies (subject_id, created_by)
  VALUES (v_uid, v_uid)
  RETURNING id INTO v_policy_id;

  INSERT INTO public.career_evidence (subject_id, category, disclosure_policy_id)
  VALUES (v_uid, p_category, v_policy_id)
  RETURNING id INTO v_evidence_id;

  INSERT INTO public.career_evidence_revisions (
    evidence_id, subject_id, revision_no, fact_payload,
    source_class, source_ref, verification_state,
    effective_from, effective_to, observed_at, created_by
  ) VALUES (
    v_evidence_id, v_uid, 1, p_fact_payload,
    'SELF_DECLARED', NULL, 'DECLARED',
    p_effective_from, p_effective_to, p_observed_at, v_uid
  ) RETURNING id INTO v_revision_id;

  UPDATE public.career_evidence
    SET current_revision_id = v_revision_id, updated_at = now()
    WHERE id = v_evidence_id;

  PERFORM public._write_audit_log(
    v_uid, 'career_evidence.created', 'career_evidence', v_evidence_id,
    NULL, jsonb_build_object('category', p_category, 'revision_no', 1),
    jsonb_build_object('source_class', 'SELF_DECLARED', 'verification_state', 'DECLARED')
  );

  RETURN v_evidence_id;
END;
$$;

-- 17.2 revise_career_evidence — optimistic-concurrency correction, appends N+1.
CREATE OR REPLACE FUNCTION public.revise_career_evidence(
  p_evidence_id          uuid,
  p_expected_revision_no integer,
  p_fact_payload         jsonb,
  p_effective_from       timestamptz DEFAULT NULL,
  p_effective_to         timestamptz DEFAULT NULL,
  p_observed_at          timestamptz DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_ev public.career_evidence%ROWTYPE;
  v_cur public.career_evidence_revisions%ROWTYPE;
  v_new_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF p_fact_payload IS NULL OR jsonb_typeof(p_fact_payload) <> 'object' THEN
    RAISE EXCEPTION 'fact_payload must be a JSON object';
  END IF;

  SELECT * INTO v_ev FROM public.career_evidence WHERE id = p_evidence_id FOR UPDATE;
  IF NOT FOUND OR v_ev.subject_id <> v_uid THEN
    RAISE EXCEPTION 'evidence % not found for current subject', p_evidence_id USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT * INTO v_cur FROM public.career_evidence_revisions WHERE id = v_ev.current_revision_id;
  IF v_cur.revision_no <> p_expected_revision_no THEN
    RAISE EXCEPTION 'stale revision: expected %, current %', p_expected_revision_no, v_cur.revision_no
      USING ERRCODE = 'serialization_failure';
  END IF;

  INSERT INTO public.career_evidence_revisions (
    evidence_id, subject_id, revision_no, fact_payload,
    source_class, source_ref, verification_state,
    effective_from, effective_to, observed_at, supersedes_revision_id, created_by
  ) VALUES (
    p_evidence_id, v_uid, v_cur.revision_no + 1, p_fact_payload,
    'SELF_DECLARED', NULL, 'DECLARED',            -- never carry VERIFIED forward on owner correction
    p_effective_from, p_effective_to, p_observed_at, v_cur.id, v_uid
  ) RETURNING id INTO v_new_id;

  UPDATE public.career_evidence
    SET current_revision_id = v_new_id, updated_at = now()
    WHERE id = p_evidence_id;

  PERFORM public._write_audit_log(
    v_uid, 'career_evidence.revised', 'career_evidence', p_evidence_id,
    jsonb_build_object('revision_no', v_cur.revision_no),
    jsonb_build_object('revision_no', v_cur.revision_no + 1)
  );

  RETURN v_new_id;
END;
$$;

-- 17.3 set_career_evidence_lifecycle — owner archive/dispute; authorized revoke/expire.
CREATE OR REPLACE FUNCTION public.set_career_evidence_lifecycle(
  p_evidence_id uuid,
  p_action      text,      -- 'archive' | 'unarchive' | 'dispute' | 'revoke' | 'expire'
  p_reason_ref  jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_ev public.career_evidence%ROWTYPE;
  v_cur public.career_evidence_revisions%ROWTYPE;
  v_new_id uuid;
  v_state public.career_evidence_state_enum;
  v_lifecycle public.career_evidence_lifecycle_enum;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE = 'insufficient_privilege';
  END IF;
  SELECT * INTO v_ev FROM public.career_evidence WHERE id = p_evidence_id FOR UPDATE;
  IF NOT FOUND OR v_ev.subject_id <> v_uid THEN
    RAISE EXCEPTION 'evidence % not found for current subject', p_evidence_id USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_action = 'archive' THEN
    UPDATE public.career_evidence SET archived_at = now(), archived_by = v_uid, updated_at = now() WHERE id = p_evidence_id;
    PERFORM public._write_audit_log(v_uid, 'career_evidence.lifecycle_changed', 'career_evidence', p_evidence_id,
      jsonb_build_object('archived', false), jsonb_build_object('archived', true));
    RETURN;
  ELSIF p_action = 'unarchive' THEN
    UPDATE public.career_evidence SET archived_at = NULL, archived_by = NULL, updated_at = now() WHERE id = p_evidence_id;
    PERFORM public._write_audit_log(v_uid, 'career_evidence.lifecycle_changed', 'career_evidence', p_evidence_id,
      jsonb_build_object('archived', true), jsonb_build_object('archived', false));
    RETURN;
  ELSIF p_action = 'dispute' THEN
    IF p_reason_ref IS NULL THEN RAISE EXCEPTION 'dispute requires p_reason_ref'; END IF;
    v_state := 'DISPUTED'; v_lifecycle := 'DISPUTED';
  ELSIF p_action = 'revoke' THEN
    IF p_reason_ref IS NULL THEN RAISE EXCEPTION 'revoke requires p_reason_ref'; END IF;
    v_state := 'REVOKED'; v_lifecycle := 'REVOKED';
  ELSIF p_action = 'expire' THEN
    IF p_reason_ref IS NULL THEN RAISE EXCEPTION 'expire requires p_reason_ref'; END IF;
    v_state := 'EXPIRED'; v_lifecycle := 'EXPIRED';
  ELSE
    RAISE EXCEPTION 'unknown lifecycle action %', p_action;
  END IF;

  SELECT * INTO v_cur FROM public.career_evidence_revisions WHERE id = v_ev.current_revision_id;

  INSERT INTO public.career_evidence_revisions (
    evidence_id, subject_id, revision_no, fact_payload,
    source_class, source_ref, verification_state,
    dispute_ref, revocation_or_expiry_ref, supersedes_revision_id, created_by
  ) VALUES (
    p_evidence_id, v_uid, v_cur.revision_no + 1, v_cur.fact_payload,
    v_cur.source_class, v_cur.source_ref, v_state,
    CASE WHEN v_state = 'DISPUTED' THEN p_reason_ref END,
    CASE WHEN v_state IN ('REVOKED','EXPIRED') THEN p_reason_ref END,
    v_cur.id, v_uid
  ) RETURNING id INTO v_new_id;

  UPDATE public.career_evidence
    SET current_revision_id = v_new_id, lifecycle_state = v_lifecycle, updated_at = now()
    WHERE id = p_evidence_id;

  PERFORM public._write_audit_log(v_uid, 'career_evidence.lifecycle_changed', 'career_evidence', p_evidence_id,
    jsonb_build_object('lifecycle_state', v_ev.lifecycle_state),
    jsonb_build_object('lifecycle_state', v_lifecycle));
END;
$$;

-- 17.4 attach_career_evidence_artifact — governed one-time primary_artifact link (P2-D).
CREATE OR REPLACE FUNCTION public.attach_career_evidence_artifact(
  p_revision_id         uuid,
  p_object_path         text,
  p_media_type          text,
  p_byte_size           bigint,
  p_sha256              text,
  p_retention_policy_ref jsonb,
  p_set_primary         boolean DEFAULT true
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_rev public.career_evidence_revisions%ROWTYPE;
  v_artifact_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE = 'insufficient_privilege';
  END IF;
  SELECT * INTO v_rev FROM public.career_evidence_revisions WHERE id = p_revision_id;
  IF NOT FOUND OR v_rev.subject_id <> v_uid THEN
    RAISE EXCEPTION 'revision % not found for current subject', p_revision_id USING ERRCODE = 'insufficient_privilege';
  END IF;

  INSERT INTO public.career_evidence_artifacts (
    subject_id, evidence_id, revision_id, bucket_id, object_path,
    media_type, byte_size, sha256, retention_policy_ref, uploaded_by
  ) VALUES (
    v_uid, v_rev.evidence_id, p_revision_id, 'career-evidence', p_object_path,
    p_media_type, p_byte_size, lower(p_sha256), p_retention_policy_ref, v_uid
  ) RETURNING id INTO v_artifact_id;

  IF p_set_primary AND v_rev.primary_artifact_id IS NULL THEN
    PERFORM set_config('jid.allow_artifact_link', 'on', true);
    UPDATE public.career_evidence_revisions SET primary_artifact_id = v_artifact_id WHERE id = p_revision_id;
    PERFORM set_config('jid.allow_artifact_link', 'off', true);
  END IF;

  PERFORM public._write_audit_log(
    v_uid, 'career_evidence.artifact_attached', 'career_evidence', v_rev.evidence_id,
    NULL, jsonb_build_object('artifact_id', v_artifact_id, 'revision_id', p_revision_id));

  RETURN v_artifact_id;
END;
$$;

-- 17.5 set_cv_projection_items — owner select/reorder without touching facts.
CREATE OR REPLACE FUNCTION public.set_cv_projection_items(
  p_cv_id                uuid,
  p_section_key          text,
  p_ordered_evidence_ids uuid[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_owner uuid;
  v_section_id uuid;
  v_ev uuid;
  v_idx integer := 0;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE = 'insufficient_privilege';
  END IF;
  SELECT user_id INTO v_owner FROM public.cvs WHERE id = p_cv_id;
  IF v_owner IS NULL OR v_owner <> v_uid THEN
    RAISE EXCEPTION 'cv % not found for current subject', p_cv_id USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT id INTO v_section_id FROM public.cv_projection_sections
    WHERE cv_id = p_cv_id AND section_key = p_section_key;
  IF v_section_id IS NULL THEN
    INSERT INTO public.cv_projection_sections (cv_id, section_key, sort_order)
    VALUES (p_cv_id, p_section_key,
            coalesce((SELECT max(sort_order) + 1 FROM public.cv_projection_sections WHERE cv_id = p_cv_id), 0))
    RETURNING id INTO v_section_id;
  END IF;

  SET CONSTRAINTS ALL DEFERRED;

  -- unselect everything currently in this section, then re-apply order.
  UPDATE public.cv_projection_items SET is_selected = false, updated_at = now()
    WHERE cv_id = p_cv_id AND section_id = v_section_id;

  FOREACH v_ev IN ARRAY coalesce(p_ordered_evidence_ids, ARRAY[]::uuid[])
  LOOP
    -- reject revoked/expired evidence from new selection
    IF EXISTS (SELECT 1 FROM public.career_evidence
               WHERE id = v_ev AND subject_id = v_uid
                 AND lifecycle_state = 'ACTIVE' AND archived_at IS NULL) THEN
      INSERT INTO public.cv_projection_items (cv_id, section_id, evidence_id, sort_order, is_selected)
      VALUES (p_cv_id, v_section_id, v_ev, v_idx, true)
      ON CONFLICT (cv_id, evidence_id) DO UPDATE
        SET section_id = EXCLUDED.section_id, sort_order = EXCLUDED.sort_order,
            is_selected = true, updated_at = now();
      v_idx := v_idx + 1;
    END IF;
  END LOOP;

  PERFORM public._write_audit_log(
    v_uid, 'cv_projection.selection_changed', 'cvs', p_cv_id,
    NULL, jsonb_build_object('section_key', p_section_key, 'count', v_idx));
END;
$$;

-- 17.6 create_cv_projection_snapshot — immutable purpose-bound snapshot.
CREATE OR REPLACE FUNCTION public.create_cv_projection_snapshot(
  p_cv_id              uuid,
  p_purpose            public.cv_snapshot_purpose_enum,
  p_locale             text,
  p_template_key       text,
  p_snapshot_payload   jsonb,
  p_manifest           jsonb,
  p_retention_policy_ref jsonb,
  p_application_id     uuid DEFAULT NULL,
  p_authorization_id   uuid DEFAULT NULL,
  p_expires_at         timestamptz DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog, extensions
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_owner uuid;
  v_version integer;
  v_auth public.disclosure_authorizations%ROWTYPE;
  v_snapshot_id uuid;
  v_hash text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE = 'insufficient_privilege';
  END IF;
  SELECT user_id INTO v_owner FROM public.cvs WHERE id = p_cv_id;
  IF v_owner IS NULL OR v_owner <> v_uid THEN
    RAISE EXCEPTION 'cv % not found for current subject', p_cv_id USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF jsonb_typeof(p_manifest) <> 'array' THEN
    RAISE EXCEPTION 'manifest must be a JSON array';
  END IF;

  IF p_purpose IN ('EXPORT','PROFILE_PREVIEW') THEN
    IF p_authorization_id IS NOT NULL THEN
      RAISE EXCEPTION 'owner-only % snapshot must not carry a disclosure authorization', p_purpose;
    END IF;
  ELSE
    IF p_authorization_id IS NULL THEN
      RAISE EXCEPTION '% snapshot requires an active disclosure authorization', p_purpose USING ERRCODE = 'insufficient_privilege';
    END IF;
    SELECT * INTO v_auth FROM public.disclosure_authorizations WHERE id = p_authorization_id;
    IF NOT FOUND
       OR v_auth.subject_id <> v_uid
       OR v_auth.state <> 'ACTIVE'
       OR v_auth.effective_at > now()
       OR (v_auth.expires_at IS NOT NULL AND v_auth.expires_at < now()) THEN
      RAISE EXCEPTION 'disclosure authorization % is not active for this subject', p_authorization_id USING ERRCODE = 'insufficient_privilege';
    END IF;
    IF p_purpose = 'APPLICATION' AND v_auth.recipient_type <> 'BUSINESS' THEN
      RAISE EXCEPTION 'APPLICATION snapshot requires a BUSINESS recipient authorization';
    END IF;
    IF p_purpose = 'PUBLIC_SHARE' AND v_auth.recipient_type <> 'PUBLIC' THEN
      RAISE EXCEPTION 'PUBLIC_SHARE snapshot requires a PUBLIC authorization';
    END IF;
  END IF;

  IF p_purpose = 'APPLICATION' AND p_application_id IS NULL THEN
    RAISE EXCEPTION 'APPLICATION snapshot requires p_application_id';
  END IF;
  IF p_purpose <> 'APPLICATION' AND p_application_id IS NOT NULL THEN
    RAISE EXCEPTION 'non-APPLICATION snapshot must not carry an application id';
  END IF;

  SELECT coalesce(max(projection_version) + 1, 1) INTO v_version
    FROM public.cv_projection_snapshots WHERE cv_id = p_cv_id;

  v_hash := encode(extensions.digest(convert_to(
              coalesce(p_snapshot_payload, '{}'::jsonb)::text || '|' || coalesce(p_manifest, '[]'::jsonb)::text, 'UTF8'),
              'sha256'), 'hex');

  INSERT INTO public.cv_projection_snapshots (
    cv_id, subject_id, purpose, application_id, disclosure_authorization_id,
    projection_version, locale, template_key, snapshot_payload,
    evidence_revision_manifest, content_sha256, retention_policy_ref, created_by, expires_at
  ) VALUES (
    p_cv_id, v_uid, p_purpose, p_application_id, p_authorization_id,
    v_version, p_locale, p_template_key, p_snapshot_payload,
    p_manifest, v_hash, p_retention_policy_ref, v_uid, p_expires_at
  ) RETURNING id INTO v_snapshot_id;

  PERFORM public._write_audit_log(
    v_uid, 'cv_projection.snapshot_created', 'cv_projection_snapshots', v_snapshot_id,
    NULL, jsonb_build_object('purpose', p_purpose, 'projection_version', v_version));

  IF p_purpose IN ('APPLICATION','PUBLIC_SHARE','RECIPIENT_DISCLOSURE') THEN
    PERFORM public._write_audit_log(
      v_uid, 'career_evidence.disclosure_allowed', 'cv_projection_snapshots', v_snapshot_id,
      NULL, jsonb_build_object('purpose', p_purpose, 'authorization_id', p_authorization_id, 'result', 'ALLOWED'));
  END IF;

  RETURN v_snapshot_id;
END;
$$;

-- 17.7 grants
REVOKE ALL ON FUNCTION public.create_career_evidence(public.career_evidence_category_enum, jsonb, timestamptz, timestamptz, timestamptz, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.revise_career_evidence(uuid, integer, jsonb, timestamptz, timestamptz, timestamptz) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_career_evidence_lifecycle(uuid, text, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.attach_career_evidence_artifact(uuid, text, text, bigint, text, jsonb, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_cv_projection_items(uuid, text, uuid[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_cv_projection_snapshot(uuid, public.cv_snapshot_purpose_enum, text, text, jsonb, jsonb, jsonb, uuid, uuid, timestamptz) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.create_career_evidence(public.career_evidence_category_enum, jsonb, timestamptz, timestamptz, timestamptz, jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.revise_career_evidence(uuid, integer, jsonb, timestamptz, timestamptz, timestamptz) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.set_career_evidence_lifecycle(uuid, text, jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.attach_career_evidence_artifact(uuid, text, text, bigint, text, jsonb, boolean) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.set_cv_projection_items(uuid, text, uuid[]) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_cv_projection_snapshot(uuid, public.cv_snapshot_purpose_enum, text, text, jsonb, jsonb, jsonb, uuid, uuid, timestamptz) TO authenticated, service_role;

-- No table privileges for anon anywhere in this migration.
REVOKE ALL ON public.career_evidence, public.career_evidence_disclosure_policies,
  public.career_evidence_revisions, public.career_evidence_artifacts,
  public.disclosure_authorizations, public.career_evidence_legacy_sources,
  public.cv_projection_sections, public.cv_projection_items, public.cv_projection_snapshots
  FROM anon;

COMMENT ON TABLE public.career_evidence IS 'Wave 2A: stable canonical root identity for one subject-owned career fact lineage.';
COMMENT ON TABLE public.career_evidence_legacy_sources IS 'Wave 2A: append-only legacy reconciliation ledger; every legacy source row/array element gets exactly one locator.';
COMMENT ON FUNCTION public.guard_career_record_account_deletion() IS 'P1-B: fail-closed account deletion guard. Future dependency JID-WAVE2-ERASURE-DEP.';
