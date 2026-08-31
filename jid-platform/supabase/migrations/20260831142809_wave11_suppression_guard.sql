-- Preserve direct small-cohort suppression while also blocking aggregate differencing.
CREATE OR REPLACE FUNCTION public.university_owner_intelligence_snapshot(p_cohort_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_catalog AS $$
DECLARE v_result jsonb; v_catalog uuid:=public.current_mapped_catalog_university_id(); v_threshold integer; v_has_small_child boolean:=false;
BEGIN
  v_result:=public.university_owner_intelligence_snapshot_raw(p_cohort_id);
  IF coalesce((v_result->>'mapping_present')::boolean,false) IS NOT TRUE THEN RETURN v_result; END IF;
  SELECT minimum_group_size INTO v_threshold FROM public.university_intelligence_privacy_config WHERE config_key='aggregate_default';
  IF p_cohort_id IS NULL THEN SELECT EXISTS(SELECT 1 FROM public.university_cohorts c JOIN public.university_cohort_memberships m ON m.cohort_id=c.id AND m.state='ACTIVE' JOIN public.university_affiliations a ON a.id=m.affiliation_id AND a.state='VERIFIED' AND a.revoked_at IS NULL WHERE c.catalog_university_id=v_catalog GROUP BY c.id HAVING count(DISTINCT m.individual_id) BETWEEN 1 AND v_threshold-1) INTO v_has_small_child; END IF;
  IF coalesce((v_result->>'suppressed')::boolean,false) OR v_has_small_child THEN v_result:=v_result||jsonb_build_object('suppressed',true,'eligible_population',NULL,'known_outcome_count',NULL,'known_outcome_coverage',NULL,'outcome_distribution','[]'::jsonb);
  ELSE v_result:=jsonb_set(v_result,'{outcome_distribution}',coalesce((SELECT jsonb_agg(jsonb_build_object('source',x.source,'category',x.category,'count',x.n)) FROM (SELECT o.source,o.category,count(DISTINCT o.id)::int n FROM public.university_outcome_evidence o JOIN public.university_cohort_memberships m ON m.affiliation_id=o.affiliation_id JOIN public.university_cohorts c ON c.id=m.cohort_id JOIN public.university_affiliations a ON a.id=m.affiliation_id WHERE c.catalog_university_id=v_catalog AND (p_cohort_id IS NULL OR c.id=p_cohort_id) AND m.state='ACTIVE' AND a.state='VERIFIED' AND a.revoked_at IS NULL AND o.presence='KNOWN' AND o.revoked_at IS NULL GROUP BY o.source,o.category)x),'[]'::jsonb)); END IF;
  v_result:=jsonb_set(v_result,'{alignment_evidence}',coalesce((SELECT jsonb_agg(e) FROM jsonb_array_elements(v_result->'alignment_evidence')e JOIN public.jobs j ON j.id=(e->>'job_id')::uuid WHERE j.status IN('published','closing_soon')),'[]'::jsonb));
  v_result:=jsonb_set(v_result,'{readiness_activities}',coalesce((SELECT jsonb_agg(CASE WHEN (v_result->>'suppressed')::boolean THEN e||jsonb_build_object('participation_count',NULL) ELSE e END) FROM jsonb_array_elements(v_result->'readiness_activities')e),'[]'::jsonb)); RETURN v_result;
END $$;
REVOKE ALL ON FUNCTION public.university_owner_intelligence_snapshot(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.university_owner_intelligence_snapshot(uuid) TO authenticated;
