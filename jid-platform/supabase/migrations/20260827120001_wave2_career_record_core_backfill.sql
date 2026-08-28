-- =============================================================================
-- JID Wave 2 / Front 2A — Deterministic legacy backfill  (Stage 2 of EXPAND)
-- =============================================================================
-- Idempotent, restart-safe, deterministic. Re-running produces identical output
-- and creates no duplicate roots, revisions, ledger rows or projection items.
--
-- Idempotency key    : career_evidence_legacy_sources UNIQUE (source_table, source_locator)
-- Determinism (P1-A) : projection order derives from (legacy sort_order ASC, stable
--                      legacy row id ASC) then dense re-rank; raw legacy sort_order
--                      is NEVER copied into the uniqueness-constrained item row.
--                      Exactly one projection item per (cv_id, evidence_id).
-- Coverage  (P1-C)   : cv_education, cv_experience, cv_skills, cv_additional,
--                      cvs.technical_skills[], cvs.languages[], profile_skills,
--                      profiles.education (university/college/major/graduation),
--                      profiles.presentation. A silently skipped source fails the
--                      DATA_LOSS=0 evidence queries.
-- Normalisation (P2-A): private.jid_normalize_identity() — deterministic vectors.
-- State  (P2-C)      : every backfilled revision is SELF_DECLARED / DECLARED.
-- Policy             : one immutable private-by-default policy per root; zero
--                      disclosure_authorizations created.
-- =============================================================================

DO $backfill$
DECLARE
  v_batch uuid := gen_random_uuid();
  v_cand  bigint;
  v_roots bigint;
BEGIN
RAISE NOTICE 'wave2 backfill batch %', v_batch;

CREATE TEMP TABLE _cand (
  seq               bigint GENERATED ALWAYS AS IDENTITY,
  subject_id        uuid NOT NULL,
  category          public.career_evidence_category_enum,
  source_table      text NOT NULL,
  source_locator    text NOT NULL,
  source_cv_id      uuid,
  legacy_sort_order integer NOT NULL DEFAULT 0,
  legacy_tiebreak   text NOT NULL,
  section_key       text,
  identity_key      text,
  fact_payload      jsonb,
  source_snapshot   jsonb NOT NULL,
  source_sha256     text NOT NULL,
  precedence_rank   smallint NOT NULL,
  disposition       text NOT NULL DEFAULT 'FACT'   -- FACT | EMPTY | INVALID | DEFERRED
) ON COMMIT DROP;

-- 1a. cv_education -> EDUCATION
INSERT INTO _cand (subject_id, category, source_table, source_locator, source_cv_id,
  legacy_sort_order, legacy_tiebreak, section_key, identity_key, fact_payload,
  source_snapshot, source_sha256, precedence_rank, disposition)
SELECT c.user_id, 'EDUCATION', 'cv_education', e.id::text, c.id,
  coalesce(e.sort_order, 0), e.id::text, 'EDUCATION',
  nullif(concat_ws('|',
    coalesce(private.jid_normalize_identity(e.institution_name), ''),
    coalesce(private.jid_normalize_identity(e.degree), ''),
    coalesce(private.jid_normalize_identity(e.field_of_study), '')), '||'),
  jsonb_strip_nulls(jsonb_build_object(
    'institution_name', e.institution_name, 'degree', e.degree, 'field_of_study', e.field_of_study,
    'graduation_year', e.graduation_year, 'gpa_value', e.gpa_value, 'gpa_scale', e.gpa_scale,
    'start_month', e.start_month, 'start_year', e.start_year, 'end_month', e.end_month,
    'end_year', e.end_year, 'is_current', e.is_current, 'institution_city', e.institution_city,
    'institution_country', e.institution_country, 'honors', e.honors, 'relevant_coursework', e.relevant_coursework)),
  to_jsonb(e.*),
  encode(extensions.digest(convert_to(to_jsonb(e.*)::text, 'UTF8'), 'sha256'), 'hex'),
  20,
  CASE WHEN coalesce(btrim(e.institution_name), '') = '' THEN 'EMPTY' ELSE 'FACT' END
FROM public.cv_education e JOIN public.cvs c ON c.id = e.cv_id
WHERE NOT EXISTS (SELECT 1 FROM public.career_evidence_legacy_sources l
  WHERE l.source_table = 'cv_education' AND l.source_locator = e.id::text);

-- 1b. cv_experience -> EXPERIENCE
INSERT INTO _cand (subject_id, category, source_table, source_locator, source_cv_id,
  legacy_sort_order, legacy_tiebreak, section_key, identity_key, fact_payload,
  source_snapshot, source_sha256, precedence_rank, disposition)
SELECT c.user_id, 'EXPERIENCE', 'cv_experience', x.id::text, c.id,
  coalesce(x.sort_order, 0), x.id::text, 'EXPERIENCE',
  nullif(concat_ws('|',
    coalesce(private.jid_normalize_identity(x.company_name), ''),
    coalesce(private.jid_normalize_identity(x.job_title), ''),
    coalesce(x.start_year::text, '')), '||'),
  jsonb_strip_nulls(jsonb_build_object(
    'company_name', x.company_name, 'job_title', x.job_title, 'location', x.location,
    'employment_type', x.employment_type, 'start_month', x.start_month, 'start_year', x.start_year,
    'end_month', x.end_month, 'end_year', x.end_year, 'is_current', x.is_current,
    'company_city', x.company_city, 'company_country', x.company_country,
    'bullets', CASE WHEN x.bullets = '{}' THEN NULL ELSE to_jsonb(x.bullets) END)),
  to_jsonb(x.*),
  encode(extensions.digest(convert_to(to_jsonb(x.*)::text, 'UTF8'), 'sha256'), 'hex'),
  20,
  CASE WHEN coalesce(btrim(x.company_name), '') = '' AND coalesce(btrim(x.job_title), '') = ''
       THEN 'EMPTY' ELSE 'FACT' END
FROM public.cv_experience x JOIN public.cvs c ON c.id = x.cv_id
WHERE NOT EXISTS (SELECT 1 FROM public.career_evidence_legacy_sources l
  WHERE l.source_table = 'cv_experience' AND l.source_locator = x.id::text);

-- 1c. cv_skills -> SKILL
INSERT INTO _cand (subject_id, category, source_table, source_locator, source_cv_id,
  legacy_sort_order, legacy_tiebreak, section_key, identity_key, fact_payload,
  source_snapshot, source_sha256, precedence_rank, disposition)
SELECT c.user_id, 'SKILL', 'cv_skills', s.id::text, c.id,
  coalesce(s.sort_order, 0), s.id::text, 'SKILLS',
  private.jid_normalize_identity(s.skill_name),
  jsonb_strip_nulls(jsonb_build_object('skill_name', s.skill_name, 'proficiency', s.proficiency)),
  to_jsonb(s.*),
  encode(extensions.digest(convert_to(to_jsonb(s.*)::text, 'UTF8'), 'sha256'), 'hex'),
  20,
  CASE WHEN private.jid_normalize_identity(s.skill_name) IS NULL THEN 'EMPTY' ELSE 'FACT' END
FROM public.cv_skills s JOIN public.cvs c ON c.id = s.cv_id
WHERE NOT EXISTS (SELECT 1 FROM public.career_evidence_legacy_sources l
  WHERE l.source_table = 'cv_skills' AND l.source_locator = s.id::text);

-- 1d. cv_additional -> category-mapped
INSERT INTO _cand (subject_id, category, source_table, source_locator, source_cv_id,
  legacy_sort_order, legacy_tiebreak, section_key, identity_key, fact_payload,
  source_snapshot, source_sha256, precedence_rank, disposition)
SELECT c.user_id,
  (CASE a.category
     WHEN 'certification' THEN 'CREDENTIAL' WHEN 'language' THEN 'LANGUAGE'
     WHEN 'project' THEN 'PROJECT' WHEN 'award' THEN 'AWARD'
     WHEN 'volunteer' THEN 'VOLUNTEERING' WHEN 'publication' THEN 'PUBLICATION'
     ELSE 'OTHER' END)::public.career_evidence_category_enum,
  'cv_additional', a.id::text, c.id,
  coalesce(a.sort_order, 0), a.id::text,
  (CASE a.category
     WHEN 'certification' THEN 'CREDENTIALS' WHEN 'language' THEN 'LANGUAGES'
     WHEN 'project' THEN 'PROJECTS' WHEN 'award' THEN 'AWARDS'
     WHEN 'volunteer' THEN 'VOLUNTEERING' WHEN 'publication' THEN 'PUBLICATIONS'
     ELSE 'OTHER' END),
  nullif(concat_ws('|',
    coalesce(private.jid_normalize_identity(a.title), ''),
    coalesce(private.jid_normalize_identity(a.issuer), ''),
    a.category::text), '||'),
  jsonb_strip_nulls(jsonb_build_object(
    'legacy_category', a.category, 'title', a.title, 'issuer', a.issuer, 'description', a.description,
    'start_date', a.start_date, 'end_date', a.end_date, 'url', a.url,
    'subtype', CASE WHEN a.category = 'leadership' THEN 'LEADERSHIP'
                    WHEN a.category = 'other' THEN 'OTHER' END)),
  to_jsonb(a.*),
  encode(extensions.digest(convert_to(to_jsonb(a.*)::text, 'UTF8'), 'sha256'), 'hex'),
  20,
  CASE WHEN coalesce(btrim(a.title), '') = '' THEN 'EMPTY' ELSE 'FACT' END
FROM public.cv_additional a JOIN public.cvs c ON c.id = a.cv_id
WHERE NOT EXISTS (SELECT 1 FROM public.career_evidence_legacy_sources l
  WHERE l.source_table = 'cv_additional' AND l.source_locator = a.id::text);

-- 1e. cvs.technical_skills[] -> SKILL
INSERT INTO _cand (subject_id, category, source_table, source_locator, source_cv_id,
  legacy_sort_order, legacy_tiebreak, section_key, identity_key, fact_payload,
  source_snapshot, source_sha256, precedence_rank, disposition)
SELECT c.user_id, 'SKILL', 'cvs.technical_skills',
  format('cvs:%s:technical_skills:%s', c.id, item.ordinality), c.id,
  (item.ordinality - 1)::int, lpad(item.ordinality::text, 6, '0'), 'SKILLS',
  private.jid_normalize_identity(
    CASE WHEN jsonb_typeof(item.value) = 'string' THEN item.value #>> '{}' END),
  CASE WHEN jsonb_typeof(item.value) = 'string' AND coalesce(btrim(item.value #>> '{}'), '') <> ''
       THEN jsonb_build_object('skill_name', item.value #>> '{}') END,
  jsonb_build_object('ordinality', item.ordinality, 'value', item.value),
  encode(extensions.digest(convert_to(jsonb_build_object('ordinality', item.ordinality, 'value', item.value)::text, 'UTF8'), 'sha256'), 'hex'),
  20,
  CASE WHEN jsonb_typeof(item.value) <> 'string' THEN 'INVALID'
       WHEN private.jid_normalize_identity(item.value #>> '{}') IS NULL THEN 'EMPTY'
       ELSE 'FACT' END
FROM public.cvs c
CROSS JOIN LATERAL jsonb_array_elements(c.technical_skills) WITH ORDINALITY AS item(value, ordinality)
WHERE NOT EXISTS (SELECT 1 FROM public.career_evidence_legacy_sources l
  WHERE l.source_table = 'cvs.technical_skills'
    AND l.source_locator = format('cvs:%s:technical_skills:%s', c.id, item.ordinality));

-- 1f. cvs.languages[] -> LANGUAGE
INSERT INTO _cand (subject_id, category, source_table, source_locator, source_cv_id,
  legacy_sort_order, legacy_tiebreak, section_key, identity_key, fact_payload,
  source_snapshot, source_sha256, precedence_rank, disposition)
SELECT c.user_id, 'LANGUAGE', 'cvs.languages',
  format('cvs:%s:languages:%s', c.id, item.ordinality), c.id,
  (item.ordinality - 1)::int, lpad(item.ordinality::text, 6, '0'), 'LANGUAGES',
  private.jid_normalize_identity(
    CASE WHEN jsonb_typeof(item.value) = 'object' THEN item.value ->> 'name'
         WHEN jsonb_typeof(item.value) = 'string' THEN item.value #>> '{}' END),
  CASE
    WHEN jsonb_typeof(item.value) = 'object' AND coalesce(btrim(item.value ->> 'name'), '') <> ''
      THEN jsonb_strip_nulls(jsonb_build_object('name', item.value ->> 'name',
             'level', coalesce(item.value ->> 'level', item.value ->> 'proficiency')))
    WHEN jsonb_typeof(item.value) = 'string' AND coalesce(btrim(item.value #>> '{}'), '') <> ''
      THEN jsonb_build_object('name', item.value #>> '{}')
    END,
  jsonb_build_object('ordinality', item.ordinality, 'value', item.value),
  encode(extensions.digest(convert_to(jsonb_build_object('ordinality', item.ordinality, 'value', item.value)::text, 'UTF8'), 'sha256'), 'hex'),
  20,
  CASE
    WHEN jsonb_typeof(item.value) NOT IN ('object', 'string') THEN 'INVALID'
    WHEN jsonb_typeof(item.value) = 'object' AND coalesce(btrim(item.value ->> 'name'), '') = '' THEN 'INVALID'
    WHEN jsonb_typeof(item.value) = 'string' AND coalesce(btrim(item.value #>> '{}'), '') = '' THEN 'EMPTY'
    ELSE 'FACT' END
FROM public.cvs c
CROSS JOIN LATERAL jsonb_array_elements(c.languages) WITH ORDINALITY AS item(value, ordinality)
WHERE NOT EXISTS (SELECT 1 FROM public.career_evidence_legacy_sources l
  WHERE l.source_table = 'cvs.languages'
    AND l.source_locator = format('cvs:%s:languages:%s', c.id, item.ordinality));

-- 1g. profile_skills -> SKILL (rank 30)
INSERT INTO _cand (subject_id, category, source_table, source_locator, source_cv_id,
  legacy_sort_order, legacy_tiebreak, section_key, identity_key, fact_payload,
  source_snapshot, source_sha256, precedence_rank, disposition)
SELECT ps.profile_id, 'SKILL', 'profile_skills',
  format('%s:%s', ps.profile_id, ps.skill_id), NULL,
  0, format('%s:%s', ps.profile_id, ps.skill_id), NULL,
  private.jid_normalize_identity(sk.name),
  jsonb_strip_nulls(jsonb_build_object('skill_name', sk.name, 'skill_name_ar', sk.name_ar)),
  jsonb_build_object('profile_id', ps.profile_id, 'skill_id', ps.skill_id,
    'skill_name', sk.name, 'skill_name_ar', sk.name_ar, 'created_at', ps.created_at),
  encode(extensions.digest(convert_to(jsonb_build_object('profile_id', ps.profile_id, 'skill_id', ps.skill_id)::text, 'UTF8'), 'sha256'), 'hex'),
  30,
  CASE WHEN private.jid_normalize_identity(sk.name) IS NULL THEN 'EMPTY' ELSE 'FACT' END
FROM public.profile_skills ps
JOIN public.skills sk ON sk.id = ps.skill_id
JOIN public.profiles p ON p.id = ps.profile_id
WHERE NOT EXISTS (SELECT 1 FROM public.career_evidence_legacy_sources l
  WHERE l.source_table = 'profile_skills' AND l.source_locator = format('%s:%s', ps.profile_id, ps.skill_id));

-- 1h. profiles.education candidate -> EDUCATION candidate (rank 30)
INSERT INTO _cand (subject_id, category, source_table, source_locator, source_cv_id,
  legacy_sort_order, legacy_tiebreak, section_key, identity_key, fact_payload,
  source_snapshot, source_sha256, precedence_rank, disposition)
SELECT p.id, 'EDUCATION', 'profiles.education', p.id::text, NULL,
  0, p.id::text, 'EDUCATION',
  nullif(concat_ws('|',
    coalesce(private.jid_normalize_identity(u.name_en), ''),
    coalesce(private.jid_normalize_identity(col.name_en), ''),
    coalesce(private.jid_normalize_identity(m.name_en), '')), '||'),
  jsonb_strip_nulls(jsonb_build_object(
    'institution_name', u.name_en, 'institution_name_ar', u.name_ar,
    'college_name', col.name_en, 'major_name', m.name_en, 'field_of_study', m.name_en,
    'graduation_year', p.graduation_year,
    'university_id', p.university_id, 'college_id', p.college_id, 'major_id', p.major_id,
    'source', 'PROFILE_EDUCATION_CANDIDATE')),
  jsonb_build_object('profile_id', p.id, 'university_id', p.university_id, 'college_id', p.college_id,
    'major_id', p.major_id, 'graduation_year', p.graduation_year),
  encode(extensions.digest(convert_to(jsonb_build_object('profile_id', p.id, 'university_id', p.university_id,
    'college_id', p.college_id, 'major_id', p.major_id, 'graduation_year', p.graduation_year)::text, 'UTF8'), 'sha256'), 'hex'),
  30,
  CASE WHEN nullif(concat_ws('|',
         coalesce(private.jid_normalize_identity(u.name_en), ''),
         coalesce(private.jid_normalize_identity(col.name_en), ''),
         coalesce(private.jid_normalize_identity(m.name_en), '')), '||') IS NULL
       THEN 'EMPTY' ELSE 'FACT' END
FROM public.profiles p
LEFT JOIN public.universities_catalog u ON u.id = p.university_id
LEFT JOIN public.colleges_catalog col ON col.id = p.college_id
LEFT JOIN public.majors_catalog m ON m.id = p.major_id
WHERE (p.university_id IS NOT NULL OR p.college_id IS NOT NULL
       OR p.major_id IS NOT NULL OR p.graduation_year IS NOT NULL)
  AND NOT EXISTS (SELECT 1 FROM public.career_evidence_legacy_sources l
    WHERE l.source_table = 'profiles.education' AND l.source_locator = p.id::text);

-- 1i. profiles.presentation -> preserved snapshot only (DEFERRED, no evidence)
INSERT INTO _cand (subject_id, category, source_table, source_locator, source_cv_id,
  legacy_sort_order, legacy_tiebreak, section_key, identity_key, fact_payload,
  source_snapshot, source_sha256, precedence_rank, disposition)
SELECT p.id, NULL, 'profiles.presentation', p.id::text, NULL,
  0, p.id::text, NULL, NULL, NULL,
  jsonb_strip_nulls(jsonb_build_object(
    'headline', p.headline, 'about_me', p.about_me,
    'target_sectors', CASE WHEN p.target_sectors = '{}' THEN NULL ELSE to_jsonb(p.target_sectors) END,
    'target_regions', CASE WHEN p.target_regions = '{}' THEN NULL ELSE to_jsonb(p.target_regions) END,
    'smart_links', nullif(p.smart_links, '{}'::jsonb))),
  encode(extensions.digest(convert_to(p.id::text, 'UTF8'), 'sha256'), 'hex'),
  30, 'DEFERRED'
FROM public.profiles p
WHERE (coalesce(btrim(p.headline), '') <> '' OR coalesce(btrim(p.about_me), '') <> ''
       OR p.target_sectors <> '{}' OR p.target_regions <> '{}' OR nullif(p.smart_links, '{}'::jsonb) IS NOT NULL)
  AND NOT EXISTS (SELECT 1 FROM public.career_evidence_legacy_sources l
    WHERE l.source_table = 'profiles.presentation' AND l.source_locator = p.id::text);

SELECT count(*) INTO v_cand FROM _cand;
IF v_cand = 0 THEN
  RAISE NOTICE 'wave2 backfill: nothing to reconcile';
  RETURN;
END IF;

-- ---------------------------------------------------------------------------
-- 2. Classify. Prior-batch dedupe + this-batch grouping.
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE _plan ON COMMIT DROP AS
WITH base AS (
  SELECT c.*,
    CASE WHEN c.disposition = 'FACT' THEN private.jid_canonical_payload_hash(c.fact_payload) END AS payload_hash
  FROM _cand c
),
withexisting AS (
  SELECT b.*,
    (SELECT l.evidence_id
     FROM public.career_evidence_legacy_sources l
     JOIN public.career_evidence ce ON ce.id = l.evidence_id AND ce.category = b.category
     JOIN public.career_evidence_revisions r ON r.id = ce.current_revision_id
     WHERE l.subject_id = b.subject_id
       AND l.normalized_identity_key = b.identity_key
       AND l.migration_batch_id <> v_batch
       AND private.jid_canonical_payload_hash(r.fact_payload) = b.payload_hash
     LIMIT 1) AS existing_root_id
  FROM base b
),
grp AS (
  SELECT subject_id, category, identity_key, count(DISTINCT payload_hash) AS distinct_payloads
  FROM withexisting
  WHERE disposition = 'FACT' AND identity_key IS NOT NULL AND existing_root_id IS NULL
  GROUP BY subject_id, category, identity_key
),
ranked AS (
  SELECT w.*,
    coalesce(g.distinct_payloads, 0) AS distinct_payloads,
    CASE WHEN w.disposition = 'FACT' AND w.existing_root_id IS NULL THEN
      row_number() OVER (PARTITION BY w.subject_id, w.category, w.payload_hash
                         ORDER BY w.precedence_rank ASC, w.seq ASC)
    END AS payload_rank,
    first_value(w.seq) OVER (PARTITION BY w.subject_id, w.category, w.identity_key
                             ORDER BY w.precedence_rank ASC, w.seq ASC
                             ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS group_anchor_seq
  FROM withexisting w
  LEFT JOIN grp g ON g.subject_id = w.subject_id AND g.category = w.category AND g.identity_key = w.identity_key
)
SELECT r.*,
  CASE
    WHEN r.disposition = 'INVALID'  THEN 'INVALID_PRESERVED'
    WHEN r.disposition IN ('DEFERRED', 'EMPTY') THEN 'DEFERRED'
    WHEN r.identity_key IS NULL     THEN 'DEFERRED'
    WHEN r.existing_root_id IS NOT NULL THEN 'DEDUPLICATED'
    WHEN r.distinct_payloads > 1    THEN 'CONFLICT_NEEDS_REVIEW'
    WHEN r.payload_rank = 1         THEN 'LINKED'
    ELSE 'DEDUPLICATED'
  END AS reconciliation_state,
  (r.disposition = 'FACT' AND r.identity_key IS NOT NULL
   AND r.existing_root_id IS NULL AND r.payload_rank = 1) AS creates_root
FROM ranked r;

-- ---------------------------------------------------------------------------
-- 3. Create policies + roots + revision 1.
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE _new_root ON COMMIT DROP AS
SELECT seq, subject_id, category, fact_payload,
  private.jid_canonical_payload_hash(fact_payload) AS payload_hash,
  gen_random_uuid() AS policy_id, gen_random_uuid() AS evidence_id, gen_random_uuid() AS revision_id
FROM _plan WHERE creates_root;

INSERT INTO public.career_evidence_disclosure_policies (id, subject_id, created_by)
SELECT policy_id, subject_id, subject_id FROM _new_root;

INSERT INTO public.career_evidence (id, subject_id, category, disclosure_policy_id, current_revision_id)
SELECT evidence_id, subject_id, category, policy_id, NULL FROM _new_root;

INSERT INTO public.career_evidence_revisions
  (id, evidence_id, subject_id, revision_no, fact_payload, source_class, source_ref, verification_state, created_by)
SELECT revision_id, evidence_id, subject_id, 1, fact_payload, 'SELF_DECLARED', NULL, 'DECLARED', subject_id
FROM _new_root;

UPDATE public.career_evidence ce
SET current_revision_id = nr.revision_id, updated_at = now()
FROM _new_root nr WHERE nr.evidence_id = ce.id;

-- ---------------------------------------------------------------------------
-- 4. Resolve the evidence_id / revision_id each candidate links to.
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE _link ON COMMIT DROP AS
SELECT p.seq, p.subject_id, p.category, p.source_table, p.source_locator, p.source_cv_id,
  p.legacy_sort_order, p.legacy_tiebreak, p.section_key, p.identity_key,
  p.source_snapshot, p.source_sha256, p.precedence_rank, p.reconciliation_state,
  CASE WHEN p.reconciliation_state = 'CONFLICT_NEEDS_REVIEW'
       THEN md5(concat('cg|', p.subject_id, '|', p.category, '|', p.identity_key))::uuid END AS conflict_group_id,
  CASE
    WHEN p.existing_root_id IS NOT NULL THEN p.existing_root_id
    WHEN p.disposition = 'FACT' AND p.identity_key IS NOT NULL THEN (
      SELECT nr.evidence_id FROM _new_root nr
      WHERE nr.subject_id = p.subject_id AND nr.category = p.category
        AND nr.payload_hash = private.jid_canonical_payload_hash(p.fact_payload)
      ORDER BY nr.seq ASC LIMIT 1)
  END AS evidence_id
FROM _plan p;

ALTER TABLE _link ADD COLUMN revision_id_col uuid;
-- A backfilled root has exactly one revision (revision_no = 1), which is also its
-- current_revision_id. Dedup/conflict links resolve to that same revision.
UPDATE _link l SET revision_id_col = r.id
FROM public.career_evidence_revisions r
WHERE r.evidence_id = l.evidence_id AND r.revision_no = 1
  AND l.evidence_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 5. Append the reconciliation ledger.
-- ---------------------------------------------------------------------------
INSERT INTO public.career_evidence_legacy_sources
  (subject_id, source_table, source_locator, source_cv_id, evidence_id, revision_id,
   source_snapshot, source_sha256, normalized_identity_key, reconciliation_state,
   precedence_rank, conflict_group_id, migration_batch_id, notes)
SELECT l.subject_id, l.source_table, l.source_locator, l.source_cv_id, l.evidence_id, l.revision_id_col,
  l.source_snapshot, l.source_sha256, l.identity_key,
  l.reconciliation_state::public.career_reconciliation_state_enum,
  l.precedence_rank, l.conflict_group_id, v_batch,
  CASE
    WHEN l.reconciliation_state = 'DEFERRED' AND l.source_table = 'profiles.presentation'
      THEN 'presentation/preferences preserved; not a career fact'
    WHEN l.reconciliation_state = 'DEFERRED'
      THEN 'empty or non-identifying legacy value; snapshot preserved, no fact created'
    WHEN l.reconciliation_state = 'INVALID_PRESERVED'
      THEN 'malformed legacy value preserved verbatim; not normalised into a fact'
    WHEN l.reconciliation_state = 'CONFLICT_NEEDS_REVIEW'
      THEN 'same normalised identity, differing payload; separate declared roots pending owner review'
    WHEN l.reconciliation_state = 'DEDUPLICATED'
      THEN 'exact normalised identity + canonical payload match; linked to shared declared root'
    ELSE NULL
  END
FROM _link l;

-- ---------------------------------------------------------------------------
-- 6. Projection backfill (P1-A).
-- ---------------------------------------------------------------------------
-- 6a. sections in deterministic default order
INSERT INTO public.cv_projection_sections (cv_id, section_key, sort_order)
SELECT d.cv_id, d.section_key,
  CASE d.section_key
    WHEN 'HEADER' THEN 0 WHEN 'SUMMARY' THEN 1 WHEN 'EXPERIENCE' THEN 2 WHEN 'EDUCATION' THEN 3
    WHEN 'SKILLS' THEN 4 WHEN 'CREDENTIALS' THEN 5 WHEN 'PROJECTS' THEN 6 WHEN 'AWARDS' THEN 7
    WHEN 'LANGUAGES' THEN 8 WHEN 'VOLUNTEERING' THEN 9 WHEN 'PUBLICATIONS' THEN 10 ELSE 11 END
FROM (
  SELECT DISTINCT l.source_cv_id AS cv_id,
    (CASE ce.category
       WHEN 'EXPERIENCE' THEN 'EXPERIENCE' WHEN 'EDUCATION' THEN 'EDUCATION'
       WHEN 'SKILL' THEN 'SKILLS' WHEN 'CREDENTIAL' THEN 'CREDENTIALS'
       WHEN 'PROJECT' THEN 'PROJECTS' WHEN 'AWARD' THEN 'AWARDS'
       WHEN 'LANGUAGE' THEN 'LANGUAGES' WHEN 'VOLUNTEERING' THEN 'VOLUNTEERING'
       WHEN 'PUBLICATION' THEN 'PUBLICATIONS' ELSE 'OTHER' END) AS section_key
  FROM public.career_evidence_legacy_sources l
  JOIN public.career_evidence ce ON ce.id = l.evidence_id
  WHERE l.migration_batch_id = v_batch AND l.source_cv_id IS NOT NULL AND l.evidence_id IS NOT NULL
    AND l.reconciliation_state IN ('LINKED', 'DEDUPLICATED', 'CONFLICT_NEEDS_REVIEW')
) d
ON CONFLICT (cv_id, section_key) DO NOTHING;

-- 6b. one item per (cv_id, evidence_id); deterministic dense order
WITH linked AS (
  SELECT l.source_cv_id AS cv_id, l.evidence_id, ce.category,
    min(cand.legacy_sort_order) AS raw_sort,
    min(cand.legacy_tiebreak)   AS raw_tiebreak,
    min(cand.seq)               AS first_seq
  FROM public.career_evidence_legacy_sources l
  JOIN public.career_evidence ce ON ce.id = l.evidence_id
  JOIN _plan cand ON cand.source_table = l.source_table AND cand.source_locator = l.source_locator
  WHERE l.migration_batch_id = v_batch AND l.source_cv_id IS NOT NULL AND l.evidence_id IS NOT NULL
    AND l.reconciliation_state IN ('LINKED', 'DEDUPLICATED', 'CONFLICT_NEEDS_REVIEW')
  GROUP BY l.source_cv_id, l.evidence_id, ce.category
),
sectioned AS (
  SELECT ln.*,
    (CASE ln.category
       WHEN 'EXPERIENCE' THEN 'EXPERIENCE' WHEN 'EDUCATION' THEN 'EDUCATION'
       WHEN 'SKILL' THEN 'SKILLS' WHEN 'CREDENTIAL' THEN 'CREDENTIALS'
       WHEN 'PROJECT' THEN 'PROJECTS' WHEN 'AWARD' THEN 'AWARDS'
       WHEN 'LANGUAGE' THEN 'LANGUAGES' WHEN 'VOLUNTEERING' THEN 'VOLUNTEERING'
       WHEN 'PUBLICATION' THEN 'PUBLICATIONS' ELSE 'OTHER' END) AS section_key
  FROM linked ln
),
ordered AS (
  SELECT s.*,
    row_number() OVER (PARTITION BY s.cv_id, s.section_key
                       ORDER BY s.raw_sort ASC, s.raw_tiebreak ASC, s.first_seq ASC) - 1 AS dense_order
  FROM sectioned s
)
INSERT INTO public.cv_projection_items (cv_id, section_id, evidence_id, sort_order, is_selected)
SELECT o.cv_id, sec.id, o.evidence_id, o.dense_order, true
FROM ordered o
JOIN public.cv_projection_sections sec ON sec.cv_id = o.cv_id AND sec.section_key = o.section_key
ON CONFLICT (cv_id, evidence_id) DO NOTHING;

SELECT count(*) INTO v_roots FROM _new_root;
RAISE NOTICE 'wave2 backfill batch % complete: % candidates, % new roots', v_batch, v_cand, v_roots;

END
$backfill$;
