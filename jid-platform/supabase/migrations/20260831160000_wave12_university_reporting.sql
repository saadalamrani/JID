-- Wave 12: University reporting snapshots, methodology, exports, benchmarking foundation.
-- Forward-only and additive. Production execution is not authorized by this file.
-- Builds on Wave 10 foundation aggregates. Adopts Wave 11 metric/intelligence contracts
-- when present. Does not invent KPIs, national benchmarks, or accreditation claims.

CREATE TYPE public.university_report_type_enum AS ENUM (
  'cohort_outcome_summary',
  'program_employability_evidence',
  'employer_alignment_summary',
  'career_readiness_activity',
  'data_coverage_methodology'
);

CREATE TYPE public.university_report_status_enum AS ENUM (
  'preview',
  'generated',
  'insufficient',
  'suppressed'
);

CREATE TYPE public.university_benchmark_status_enum AS ENUM (
  'UNAVAILABLE',
  'AVAILABLE'
);

-- Canonical small-n. Wave 11 owns this contract. Wave 12 reuses it and must not
-- replace an existing Wave 11 definition after reconciliation.
DO $$
BEGIN
  IF to_regprocedure('public.university_suppression_min_n()') IS NULL THEN
    EXECUTE $fn$
      CREATE FUNCTION public.university_suppression_min_n()
      RETURNS integer
      LANGUAGE sql
      IMMUTABLE
      SET search_path = public, pg_catalog
      AS $body$ SELECT 5 $body$
    $fn$;
    COMMENT ON FUNCTION public.university_suppression_min_n() IS
      'Canonical institutional small-n suppression threshold. Wave 11 owns this contract; Wave 12 reuses it.';
  END IF;
END $$;

REVOKE ALL ON FUNCTION public.university_suppression_min_n() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.university_suppression_min_n() TO authenticated;

CREATE TABLE public.university_report_methodology_versions (
  version_key text PRIMARY KEY,
  title_ar text NOT NULL,
  title_en text NOT NULL,
  body_ar text NOT NULL,
  body_en text NOT NULL,
  accreditation_boundary_ar text NOT NULL,
  accreditation_boundary_en text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

INSERT INTO public.university_report_methodology_versions (
  version_key, title_ar, title_en, body_ar, body_en,
  accreditation_boundary_ar, accreditation_boundary_en
) VALUES (
  'wave12.1.0',
  'ملخص منهجية القياس — الإصدار wave12.1.0',
  'Measurement methodology summary — wave12.1.0',
  'تُحسب التقارير من انتماءات موثّقة وأدلة مخرجات ذات مصدر ضمن الجامعة المربوطة. المجتمع هو الانتماءات ذات الحالة VERIFIED غير الملغاة، ويمكن تقييده بفوج أو برنامج. النافذة الزمنية هي الصفوف النشطة حتى لحظة data_as_of. المصدر هو عقود مؤشرات جِد (الموجة 10) وذكاء الموجة 11 عند وجوده. التغطية تتطلب عدداً كافياً فوق عتبة الإخفاء. البيانات الناقصة تبقى مجهولة ولا تُفسَّر كبطالة أو فشل.',
  'Reports are computed from verified affiliations and provenance-bound outcome evidence for the mapped university. Population is active VERIFIED affiliations, optionally scoped to a cohort or program. The time window is currently active rows as of data_as_of. Source is JID metric contracts (Wave 10) plus Wave 11 intelligence when present. Coverage requires counts at or above the suppression threshold. Missing data remains unknown and is never inferred as unemployment or failure.',
  'أدلة مساندة وبيانات داعمة للمراجعة ومخرجات قابلة للاستخدام ضمن ملف المراجعة. جِد لا تعتمد الامتثال للاعتماد ولا تصدر شهادة من هيئة.',
  'Supporting evidence and review-ready methodology outputs. JID does not certify accreditation compliance and does not issue an authority certificate.'
);

CREATE TABLE public.university_benchmark_reference_sets (
  set_key text PRIMARY KEY,
  status public.university_benchmark_status_enum NOT NULL DEFAULT 'UNAVAILABLE',
  comparability_rule text NOT NULL,
  coverage_requirement text NOT NULL,
  notes_ar text NOT NULL,
  notes_en text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT university_benchmark_no_live_rank_chk CHECK (status = 'UNAVAILABLE')
);

INSERT INTO public.university_benchmark_reference_sets (
  set_key, status, comparability_rule, coverage_requirement, notes_ar, notes_en
) VALUES (
  'governed_peer_reference',
  'UNAVAILABLE',
  'Comparable metric definitions, overlapping observation windows, and lawful publication rights across institutions',
  'Each compared cell must meet the canonical suppression threshold and documented coverage rules',
  'لا يمكن إجراء مقارنة موثوقة لهذه المجموعة حالياً. لا يوجد ترتيب جامعي أو متوسط وطني في هذه الموجة.',
  'A reliable comparison is not available for this group yet. This wave does not publish university rankings or a national average.'
);

CREATE TABLE public.university_report_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_university_id uuid NOT NULL REFERENCES public.universities_catalog (id) ON DELETE RESTRICT,
  directory_id uuid NOT NULL REFERENCES public.companies (id) ON DELETE RESTRICT,
  report_type public.university_report_type_enum NOT NULL,
  status public.university_report_status_enum NOT NULL,
  methodology_version text NOT NULL REFERENCES public.university_report_methodology_versions (version_key),
  cohort_id uuid REFERENCES public.university_cohorts (id) ON DELETE RESTRICT,
  population jsonb NOT NULL,
  time_window jsonb NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  generated_by uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  data_as_of timestamptz NOT NULL,
  coverage jsonb NOT NULL,
  missingness_notes_ar text NOT NULL,
  missingness_notes_en text NOT NULL,
  privacy_rules jsonb NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT university_report_snapshots_payload_object_chk CHECK (jsonb_typeof(payload) = 'object'),
  CONSTRAINT university_report_snapshots_no_named_payload_chk CHECK (
    NOT (payload ? 'email')
    AND NOT (payload ? 'phone')
    AND NOT (payload ? 'full_name')
    AND NOT (payload ? 'cv')
    AND NOT (payload ? 'career_record')
    AND NOT (payload ? 'individual_id')
  )
);

CREATE INDEX university_report_snapshots_catalog_idx
  ON public.university_report_snapshots (catalog_university_id, generated_at DESC);

CREATE INDEX university_report_snapshots_generated_by_idx
  ON public.university_report_snapshots (generated_by, generated_at DESC);

COMMENT ON TABLE public.university_report_snapshots IS
  'Purpose-bound aggregate University report snapshots. No named graduate private fields.';
COMMENT ON TABLE public.university_benchmark_reference_sets IS
  'Benchmarking foundation only. Live rankings and national averages are unavailable until governed comparable data exists.';

INSERT INTO public.university_metric_definitions (
  metric_key, name_ar, name_en, source_definition, population_definition,
  window_definition, coverage_rule, missingness_rule, privacy_rule, computability
)
VALUES
  (
    'employer_alignment_coverage',
    'تغطية محاذاة جهات التوظيف',
    'Employer alignment coverage',
    'university_outcome_evidence where source=VERIFIED_EMPLOYER and revoked_at is null, plus Wave 11 intelligence overlay when present',
    'Verified affiliations of the mapped catalog university, optionally scoped to a cohort or program',
    'Currently active evidence as of report data_as_of',
    'Report is insufficient unless observed known verified-employer evidence meets the canonical suppression threshold',
    'Absence of employer evidence is unknown, not misalignment',
    'Aggregate only. No employer-identifying private hiring notes or named graduates',
    'CONTRACT_ONLY'
  ),
  (
    'career_readiness_coverage',
    'تغطية نشاط الجاهزية المهنية',
    'Career readiness activity coverage',
    'Wave 11 career-readiness intelligence when present; otherwise not computable',
    'Verified affiliations of the mapped catalog university',
    'Currently active readiness evidence as of report data_as_of',
    'Report is insufficient until Wave 11 readiness evidence exists at or above the suppression threshold',
    'Missing readiness activity is unknown, not unreadiness',
    'Aggregate only. No named Individual, CV, or assessment evidence',
    'CONTRACT_ONLY'
  )
ON CONFLICT (metric_key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.university_report_safe_count(p_n integer)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_min integer := public.university_suppression_min_n();
BEGIN
  IF p_n IS NULL THEN
    RETURN jsonb_build_object('value', null, 'suppressed', true, 'status', 'unknown');
  END IF;
  IF p_n = 0 THEN
    RETURN jsonb_build_object('value', null, 'suppressed', false, 'status', 'insufficient');
  END IF;
  IF p_n < v_min THEN
    RETURN jsonb_build_object('value', null, 'suppressed', true, 'status', 'suppressed');
  END IF;
  RETURN jsonb_build_object('value', p_n, 'suppressed', false, 'status', 'available');
END;
$$;

CREATE OR REPLACE FUNCTION public.university_wave11_intelligence_overlay()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_out jsonb;
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE pronamespace = 'public'::regnamespace
      AND proname = 'university_owner_intelligence_snapshot'
      AND pronargs = 0
  ) THEN
    EXECUTE 'SELECT public.university_owner_intelligence_snapshot()' INTO v_out;
    RETURN jsonb_build_object(
      'intelligence_available', true,
      'employer_alignment_available', coalesce((v_out ->> 'employer_alignment_available')::boolean, false),
      'career_readiness_available', coalesce((v_out ->> 'career_readiness_available')::boolean, false),
      'coverage', coalesce(v_out -> 'coverage', '{}'::jsonb),
      'aggregates', coalesce(v_out -> 'privacy_safe_aggregates', '[]'::jsonb)
    );
  END IF;
  RETURN jsonb_build_object(
    'intelligence_available', false,
    'employer_alignment_available', false,
    'career_readiness_available', false,
    'coverage', '{}'::jsonb,
    'aggregates', '[]'::jsonb
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.university_report_compose(
  p_report_type public.university_report_type_enum,
  p_cohort_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_catalog uuid;
  v_directory uuid;
  v_cohort public.university_cohorts%ROWTYPE;
  v_eligible int := 0;
  v_observed int := 0;
  v_known int := 0;
  v_verified_employer int := 0;
  v_min int := public.university_suppression_min_n();
  v_now timestamptz := timezone('utc', now());
  v_method public.university_report_methodology_versions%ROWTYPE;
  v_intel jsonb;
  v_aggs jsonb := '[]'::jsonb;
  v_metrics jsonb := '[]'::jsonb;
  v_coverage jsonb;
  v_status public.university_report_status_enum := 'preview';
  v_pop jsonb;
  v_safe jsonb;
  v_row record;
  v_source text := 'wave10_foundation';
BEGIN
  IF v_actor IS NULL THEN
    RETURN jsonb_build_object(
      'ok', false, 'mapping_present', false, 'fail_closed_reason', 'unauthenticated',
      'report_id', null, 'university_id', null, 'report_type', p_report_type
    );
  END IF;

  v_directory := public.current_owned_university_directory_id();
  v_catalog := public.current_mapped_catalog_university_id();
  IF v_directory IS NULL THEN
    RETURN jsonb_build_object(
      'ok', false, 'mapping_present', false, 'fail_closed_reason', 'no_owned_profile',
      'report_id', null, 'university_id', null, 'report_type', p_report_type
    );
  END IF;
  IF v_catalog IS NULL THEN
    RETURN jsonb_build_object(
      'ok', false, 'mapping_present', false, 'fail_closed_reason', 'unmapped',
      'report_id', null, 'university_id', null, 'report_type', p_report_type,
      'directory_id', v_directory
    );
  END IF;

  IF p_cohort_id IS NOT NULL THEN
    SELECT * INTO v_cohort
    FROM public.university_cohorts c
    WHERE c.id = p_cohort_id AND c.catalog_university_id = v_catalog;
    IF v_cohort.id IS NULL THEN
      RETURN jsonb_build_object(
        'ok', false, 'mapping_present', true, 'fail_closed_reason', 'cohort_not_found',
        'report_id', null, 'university_id', v_catalog, 'report_type', p_report_type
      );
    END IF;
  END IF;

  SELECT * INTO v_method
  FROM public.university_report_methodology_versions
  WHERE version_key = 'wave12.1.0';

  SELECT count(*)::int INTO v_eligible
  FROM public.university_affiliations a
  WHERE a.catalog_university_id = v_catalog
    AND a.state = 'VERIFIED'
    AND a.revoked_at IS NULL
    AND (
      p_cohort_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.university_cohort_memberships m
        WHERE m.affiliation_id = a.id
          AND m.cohort_id = p_cohort_id
          AND m.state = 'ACTIVE'
      )
    );

  SELECT count(*)::int INTO v_observed
  FROM public.university_outcome_evidence o
  JOIN public.university_affiliations a ON a.id = o.affiliation_id
  WHERE o.catalog_university_id = v_catalog
    AND o.revoked_at IS NULL
    AND a.state = 'VERIFIED'
    AND a.revoked_at IS NULL
    AND (
      p_cohort_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.university_cohort_memberships m
        WHERE m.affiliation_id = a.id
          AND m.cohort_id = p_cohort_id
          AND m.state = 'ACTIVE'
      )
    );

  SELECT count(*)::int INTO v_known
  FROM public.university_outcome_evidence o
  JOIN public.university_affiliations a ON a.id = o.affiliation_id
  WHERE o.catalog_university_id = v_catalog
    AND o.revoked_at IS NULL
    AND o.presence = 'KNOWN'
    AND a.state = 'VERIFIED'
    AND a.revoked_at IS NULL
    AND (
      p_cohort_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.university_cohort_memberships m
        WHERE m.affiliation_id = a.id
          AND m.cohort_id = p_cohort_id
          AND m.state = 'ACTIVE'
      )
    );

  SELECT count(*)::int INTO v_verified_employer
  FROM public.university_outcome_evidence o
  JOIN public.university_affiliations a ON a.id = o.affiliation_id
  WHERE o.catalog_university_id = v_catalog
    AND o.revoked_at IS NULL
    AND o.source = 'VERIFIED_EMPLOYER'
    AND o.presence = 'KNOWN'
    AND a.state = 'VERIFIED'
    AND a.revoked_at IS NULL
    AND (
      p_cohort_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.university_cohort_memberships m
        WHERE m.affiliation_id = a.id
          AND m.cohort_id = p_cohort_id
          AND m.state = 'ACTIVE'
      )
    );

  v_intel := public.university_wave11_intelligence_overlay();
  IF coalesce((v_intel ->> 'intelligence_available')::boolean, false) THEN
    v_source := 'wave11_overlay';
  END IF;

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'metric_key', d.metric_key,
    'name_ar', d.name_ar,
    'name_en', d.name_en,
    'source_definition', d.source_definition,
    'population_definition', d.population_definition,
    'window_definition', d.window_definition,
    'coverage_rule', d.coverage_rule,
    'missingness_rule', d.missingness_rule,
    'privacy_rule', d.privacy_rule,
    'computability', d.computability
  ) ORDER BY d.metric_key), '[]'::jsonb)
  INTO v_metrics
  FROM public.university_metric_definitions d;

  v_pop := jsonb_build_object(
    'kind', CASE
      WHEN p_report_type = 'program_employability_evidence' THEN 'program'
      WHEN p_cohort_id IS NOT NULL THEN 'cohort'
      ELSE 'institution'
    END,
    'cohort_id', p_cohort_id,
    'graduation_year', v_cohort.graduation_year,
    'program_text', v_cohort.program_text,
    'major_id', v_cohort.major_id,
    'degree_level', v_cohort.degree_level,
    'label_ar', CASE
      WHEN p_cohort_id IS NULL THEN 'جميع الانتماءات الموثّقة للجامعة المربوطة'
      ELSE concat_ws(' · ', v_cohort.graduation_year::text, coalesce(v_cohort.program_text, 'برنامج'))
    END,
    'label_en', CASE
      WHEN p_cohort_id IS NULL THEN 'All verified affiliations of the mapped university'
      ELSE concat_ws(' · ', v_cohort.graduation_year::text, coalesce(v_cohort.program_text, 'program'))
    END
  );

  v_safe := public.university_report_safe_count(v_eligible);
  v_aggs := v_aggs || jsonb_build_array(jsonb_build_object(
    'key', 'eligible_verified_affiliations',
    'label_ar', 'الانتماءات الموثّقة المؤهلة',
    'label_en', 'Eligible verified affiliations',
    'value', v_safe -> 'value',
    'suppressed', v_safe -> 'suppressed',
    'status', v_safe ->> 'status'
  ));

  v_safe := public.university_report_safe_count(v_observed);
  v_aggs := v_aggs || jsonb_build_array(jsonb_build_object(
    'key', 'observed_outcome_evidence',
    'label_ar', 'أدلة المخرجات المرصودة',
    'label_en', 'Observed outcome evidence',
    'value', v_safe -> 'value',
    'suppressed', v_safe -> 'suppressed',
    'status', v_safe ->> 'status'
  ));

  v_safe := public.university_report_safe_count(v_known);
  v_aggs := v_aggs || jsonb_build_array(jsonb_build_object(
    'key', 'known_outcomes',
    'label_ar', 'مخرجات معروفة المصدر والحالة',
    'label_en', 'Known outcomes',
    'value', v_safe -> 'value',
    'suppressed', v_safe -> 'suppressed',
    'status', v_safe ->> 'status'
  ));

  IF p_report_type IN ('cohort_outcome_summary', 'program_employability_evidence', 'data_coverage_methodology') THEN
    FOR v_row IN
      SELECT o.source::text AS source, o.presence::text AS presence, o.category::text AS category, count(*)::int AS n
      FROM public.university_outcome_evidence o
      JOIN public.university_affiliations a ON a.id = o.affiliation_id
      WHERE o.catalog_university_id = v_catalog
        AND o.revoked_at IS NULL
        AND a.state = 'VERIFIED'
        AND a.revoked_at IS NULL
        AND (
          p_cohort_id IS NULL
          OR EXISTS (
            SELECT 1 FROM public.university_cohort_memberships m
            WHERE m.affiliation_id = a.id
              AND m.cohort_id = p_cohort_id
              AND m.state = 'ACTIVE'
          )
        )
      GROUP BY o.source, o.presence, o.category
    LOOP
      v_safe := public.university_report_safe_count(v_row.n);
      v_aggs := v_aggs || jsonb_build_array(jsonb_build_object(
        'key', concat_ws(':', v_row.source, v_row.presence, v_row.category),
        'label_ar', concat_ws(' · ', v_row.source, v_row.presence, v_row.category),
        'label_en', concat_ws(' · ', v_row.source, v_row.presence, v_row.category),
        'value', v_safe -> 'value',
        'suppressed', v_safe -> 'suppressed',
        'status', v_safe ->> 'status',
        'source', v_row.source,
        'presence', v_row.presence,
        'category', v_row.category
      ));
    END LOOP;
  END IF;

  IF p_report_type = 'employer_alignment_summary' THEN
    v_safe := public.university_report_safe_count(v_verified_employer);
    v_aggs := v_aggs || jsonb_build_array(jsonb_build_object(
      'key', 'verified_employer_known_outcomes',
      'label_ar', 'مخرجات معروفة من جهة توظيف موثّقة',
      'label_en', 'Known outcomes from a verified employer',
      'value', v_safe -> 'value',
      'suppressed', v_safe -> 'suppressed',
      'status', CASE
        WHEN coalesce((v_intel ->> 'employer_alignment_available')::boolean, false) THEN v_safe ->> 'status'
        WHEN v_verified_employer = 0 THEN 'insufficient'
        ELSE v_safe ->> 'status'
      END
    ));
  END IF;

  IF p_report_type = 'career_readiness_activity' THEN
    v_aggs := v_aggs || jsonb_build_array(jsonb_build_object(
      'key', 'career_readiness_activity',
      'label_ar', 'نشاط الجاهزية المهنية',
      'label_en', 'Career readiness activity',
      'value', null,
      'suppressed', false,
      'status', CASE
        WHEN coalesce((v_intel ->> 'career_readiness_available')::boolean, false) THEN 'available'
        ELSE 'insufficient'
      END
    ));
  END IF;

  v_aggs := v_aggs || jsonb_build_array(jsonb_build_object(
    'key', 'employment_rate',
    'label_ar', 'معدل التوظيف',
    'label_en', 'Employment rate',
    'value', null,
    'suppressed', false,
    'status', 'contract_only'
  ));

  v_coverage := jsonb_build_object(
    'eligible_n', CASE WHEN v_eligible = 0 OR v_eligible >= v_min THEN v_eligible ELSE null END,
    'observed_n', CASE WHEN v_observed = 0 OR v_observed >= v_min THEN v_observed ELSE null END,
    'known_n', CASE WHEN v_known = 0 OR v_known >= v_min THEN v_known ELSE null END,
    'sufficient', CASE
      WHEN p_report_type = 'data_coverage_methodology' THEN true
      WHEN p_report_type = 'career_readiness_activity' THEN coalesce((v_intel ->> 'career_readiness_available')::boolean, false)
      WHEN p_report_type = 'employer_alignment_summary' THEN
        coalesce((v_intel ->> 'employer_alignment_available')::boolean, false) OR v_verified_employer >= v_min
      ELSE v_eligible >= v_min
    END,
    'suppressed', (v_eligible > 0 AND v_eligible < v_min) OR (v_observed > 0 AND v_observed < v_min),
    'notes_ar', CASE
      WHEN p_report_type = 'career_readiness_activity' AND NOT coalesce((v_intel ->> 'career_readiness_available')::boolean, false)
        THEN 'لا تتوفر تغطية كافية لإصدار هذا التقرير.'
      WHEN p_report_type = 'employer_alignment_summary' AND v_verified_employer < v_min
        THEN 'لا تتوفر تغطية كافية لإصدار هذا التقرير.'
      WHEN v_eligible = 0 THEN 'لا تتوفر تغطية كافية لإصدار هذا التقرير.'
      WHEN v_eligible < v_min THEN 'المجموعة أصغر من عتبة الإخفاء؛ لا تُعرض قيم خام.'
      ELSE 'التغطية محسوبة من انتماءات موثّقة وأدلة ذات مصدر.'
    END,
    'notes_en', CASE
      WHEN p_report_type = 'career_readiness_activity' AND NOT coalesce((v_intel ->> 'career_readiness_available')::boolean, false)
        THEN 'Coverage is not sufficient to issue this report.'
      WHEN p_report_type = 'employer_alignment_summary' AND v_verified_employer < v_min
        THEN 'Coverage is not sufficient to issue this report.'
      WHEN v_eligible = 0 THEN 'Coverage is not sufficient to issue this report.'
      WHEN v_eligible < v_min THEN 'The group is below the suppression threshold; raw values are not shown.'
      ELSE 'Coverage is computed from verified affiliations and provenance-bound evidence.'
    END
  );

  IF NOT (v_coverage ->> 'sufficient')::boolean THEN
    v_status := 'insufficient';
  ELSIF (v_coverage ->> 'suppressed')::boolean THEN
    v_status := 'suppressed';
  ELSE
    v_status := 'preview';
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'mapping_present', true,
    'fail_closed_reason', null,
    'report_id', null,
    'university_id', v_catalog,
    'report_type', p_report_type,
    'population', v_pop,
    'time_window', jsonb_build_object(
      'label_ar', 'الصفوف النشطة حتى تاريخ البيانات',
      'label_en', 'Active rows as of the data-as-of timestamp'
    ),
    'generated_at', null,
    'generated_by', v_actor,
    'data_as_of', v_now,
    'methodology_version', v_method.version_key,
    'metric_definitions', v_metrics,
    'coverage', v_coverage,
    'missingness_notes_ar', 'البيانات الناقصة تبقى مجهولة. عدم الرد أو عدم التقديم على جِد لا يُعدّ بطالة.',
    'missingness_notes_en', 'Missing data remains unknown. No response and no JID application are never treated as unemployment.',
    'privacy_rules', jsonb_build_object(
      'aggregate_only', true,
      'named_graduate_fields', '[]'::jsonb,
      'suppression_min_n', v_min,
      'suppression_preserved_in_export', true
    ),
    'accreditation_boundary', jsonb_build_object(
      'role', 'supporting_evidence',
      'certifies_compliance', false,
      'label_ar', v_method.accreditation_boundary_ar,
      'label_en', v_method.accreditation_boundary_en
    ),
    'benchmark', jsonb_build_object(
      'status', 'UNAVAILABLE',
      'live', false,
      'ranking', null,
      'percentile', null,
      'national_average', null,
      'reason_ar', 'لا يمكن إجراء مقارنة موثوقة لهذه المجموعة حالياً.',
      'reason_en', 'A reliable comparison is not available for this group yet.'
    ),
    'status', v_status,
    'aggregates', v_aggs,
    'intelligence_source', v_source
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.university_report_preview(
  p_report_type public.university_report_type_enum,
  p_cohort_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT public.university_report_compose(p_report_type, p_cohort_id);
$$;

CREATE OR REPLACE FUNCTION public.university_report_generate(
  p_report_type public.university_report_type_enum,
  p_cohort_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_payload jsonb;
  v_id uuid;
  v_catalog uuid;
  v_directory uuid;
  v_actor uuid := auth.uid();
  v_status public.university_report_status_enum;
BEGIN
  v_payload := public.university_report_compose(p_report_type, p_cohort_id);
  IF coalesce((v_payload ->> 'ok')::boolean, false) IS NOT TRUE THEN
    RETURN v_payload;
  END IF;

  v_catalog := (v_payload ->> 'university_id')::uuid;
  v_directory := public.current_owned_university_directory_id();
  v_status := CASE
    WHEN (v_payload ->> 'status') = 'insufficient' THEN 'insufficient'::public.university_report_status_enum
    WHEN (v_payload ->> 'status') = 'suppressed' THEN 'suppressed'::public.university_report_status_enum
    ELSE 'generated'::public.university_report_status_enum
  END;

  INSERT INTO public.university_report_snapshots (
    catalog_university_id, directory_id, report_type, status, methodology_version,
    cohort_id, population, time_window, generated_by, data_as_of, coverage,
    missingness_notes_ar, missingness_notes_en, privacy_rules, payload
  ) VALUES (
    v_catalog,
    v_directory,
    p_report_type,
    v_status,
    v_payload ->> 'methodology_version',
    p_cohort_id,
    v_payload -> 'population',
    v_payload -> 'time_window',
    v_actor,
    (v_payload ->> 'data_as_of')::timestamptz,
    v_payload -> 'coverage',
    v_payload ->> 'missingness_notes_ar',
    v_payload ->> 'missingness_notes_en',
    v_payload -> 'privacy_rules',
    v_payload
  )
  RETURNING id INTO v_id;

  v_payload := jsonb_set(v_payload, '{report_id}', to_jsonb(v_id));
  v_payload := jsonb_set(v_payload, '{generated_at}', to_jsonb(timezone('utc', now())));
  v_payload := jsonb_set(v_payload, '{status}', to_jsonb(v_status::text));

  UPDATE public.university_report_snapshots
  SET payload = v_payload, generated_at = (v_payload ->> 'generated_at')::timestamptz
  WHERE id = v_id;

  PERFORM public._write_audit_log(
    v_actor,
    'university_report.generated',
    'university_report_snapshot',
    v_id,
    NULL,
    jsonb_build_object(
      'report_type', p_report_type,
      'catalog_university_id', v_catalog,
      'status', v_status
    )
  );

  RETURN v_payload;
END;
$$;

CREATE OR REPLACE FUNCTION public.university_report_get(p_report_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_row public.university_report_snapshots%ROWTYPE;
  v_catalog uuid := public.current_mapped_catalog_university_id();
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'fail_closed_reason', 'unauthenticated', 'mapping_present', false);
  END IF;

  SELECT * INTO v_row FROM public.university_report_snapshots WHERE id = p_report_id;
  IF v_row.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'fail_closed_reason', 'not_found', 'mapping_present', v_catalog IS NOT NULL);
  END IF;

  IF NOT public.is_privileged_staff() AND (v_catalog IS NULL OR v_row.catalog_university_id <> v_catalog) THEN
    RETURN jsonb_build_object('ok', false, 'fail_closed_reason', 'unauthorized', 'mapping_present', v_catalog IS NOT NULL);
  END IF;

  RETURN v_row.payload;
END;
$$;

CREATE OR REPLACE FUNCTION public.university_report_export_payload(p_report_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT public.university_report_get(p_report_id);
$$;

CREATE OR REPLACE FUNCTION public.university_report_list()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_catalog uuid := public.current_mapped_catalog_university_id();
  v_out jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;
  IF public.is_privileged_staff() THEN
    SELECT coalesce(jsonb_agg(jsonb_build_object(
      'report_id', s.id,
      'report_type', s.report_type,
      'status', s.status,
      'generated_at', s.generated_at,
      'data_as_of', s.data_as_of,
      'population_label_ar', s.population ->> 'label_ar',
      'population_label_en', s.population ->> 'label_en',
      'methodology_version', s.methodology_version
    ) ORDER BY s.generated_at DESC), '[]'::jsonb)
    INTO v_out
    FROM public.university_report_snapshots s;
    RETURN v_out;
  END IF;
  IF v_catalog IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'report_id', s.id,
    'report_type', s.report_type,
    'status', s.status,
    'generated_at', s.generated_at,
    'data_as_of', s.data_as_of,
    'population_label_ar', s.population ->> 'label_ar',
    'population_label_en', s.population ->> 'label_en',
    'methodology_version', s.methodology_version
  ) ORDER BY s.generated_at DESC), '[]'::jsonb)
  INTO v_out
  FROM public.university_report_snapshots s
  WHERE s.catalog_university_id = v_catalog;
  RETURN v_out;
END;
$$;

REVOKE ALL ON FUNCTION public.university_report_safe_count(integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.university_wave11_intelligence_overlay() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.university_report_compose(public.university_report_type_enum, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.university_report_preview(public.university_report_type_enum, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.university_report_generate(public.university_report_type_enum, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.university_report_get(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.university_report_export_payload(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.university_report_list() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.university_report_preview(public.university_report_type_enum, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.university_report_generate(public.university_report_type_enum, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.university_report_get(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.university_report_export_payload(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.university_report_list() TO authenticated;

ALTER TABLE public.university_report_methodology_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.university_benchmark_reference_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.university_report_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY university_report_methodology_authenticated_select
  ON public.university_report_methodology_versions
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY university_benchmark_reference_authenticated_select
  ON public.university_benchmark_reference_sets
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY university_report_snapshots_owner_select
  ON public.university_report_snapshots
  FOR SELECT TO authenticated
  USING (
    catalog_university_id = public.current_mapped_catalog_university_id()
  );

CREATE POLICY university_report_snapshots_staff_select
  ON public.university_report_snapshots
  FOR SELECT TO authenticated
  USING (public.is_privileged_staff());
