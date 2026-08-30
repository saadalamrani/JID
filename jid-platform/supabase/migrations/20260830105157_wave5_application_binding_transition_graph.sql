-- Wave 5 closure repair: canonical Application binding and configured transition graph.
CREATE TABLE public.hiring_stage_edges(
 hiring_role_id uuid NOT NULL REFERENCES public.hiring_roles(id) ON DELETE CASCADE,
 from_stage_id uuid NOT NULL REFERENCES public.hiring_stages(id) ON DELETE CASCADE,
 to_stage_id uuid NOT NULL REFERENCES public.hiring_stages(id) ON DELETE CASCADE,
 PRIMARY KEY(from_stage_id,to_stage_id),CHECK(from_stage_id<>to_stage_id));
ALTER TABLE public.hiring_stage_edges ENABLE ROW LEVEL SECURITY;
CREATE POLICY hiring_stage_edges_read ON public.hiring_stage_edges FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.hiring_roles r WHERE r.id=hiring_role_id AND public.can_access_hiring_workspace(r.business_profile_id,false)));
CREATE POLICY hiring_stage_edges_write ON public.hiring_stage_edges FOR ALL TO authenticated USING(EXISTS(SELECT 1 FROM public.hiring_roles r WHERE r.id=hiring_role_id AND public.can_access_hiring_workspace(r.business_profile_id,true)))WITH CHECK(EXISTS(SELECT 1 FROM public.hiring_roles r WHERE r.id=hiring_role_id AND public.can_access_hiring_workspace(r.business_profile_id,true)));
GRANT SELECT,INSERT,UPDATE,DELETE ON public.hiring_stage_edges TO authenticated;
REVOKE ALL ON public.hiring_stage_edges FROM anon;

CREATE FUNCTION public.bind_application_to_hiring_role()RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_catalog AS $$
DECLARE role_id uuid;stage_id uuid;BEGIN
 IF NEW.hiring_role_id IS NOT NULL THEN RETURN NEW;END IF;
 SELECT id INTO role_id FROM public.hiring_roles WHERE job_id=NEW.job_id;
 IF role_id IS NULL THEN RETURN NEW;END IF;
 SELECT id INTO stage_id FROM public.hiring_stages WHERE hiring_role_id=role_id AND kind='applied' ORDER BY sort_order LIMIT 1;
 NEW.hiring_role_id:=role_id;NEW.current_hiring_stage_id:=stage_id;NEW.candidate_visible_status:='submitted';RETURN NEW;END$$;
REVOKE ALL ON FUNCTION public.bind_application_to_hiring_role()FROM PUBLIC,anon,authenticated;
CREATE TRIGGER bind_application_to_hiring_role_trigger BEFORE INSERT ON public.applications FOR EACH ROW EXECUTE FUNCTION public.bind_application_to_hiring_role();

ALTER FUNCTION public.initialize_hiring_role(uuid,text,text)RENAME TO initialize_hiring_role_unbound;
CREATE FUNCTION public.initialize_hiring_role(p_job_id uuid,p_title_ar text,p_title_en text)RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_catalog AS $$
DECLARE role_id uuid;applied_id uuid;BEGIN
 role_id:=public.initialize_hiring_role_unbound(p_job_id,p_title_ar,p_title_en);
 INSERT INTO public.hiring_stage_edges(hiring_role_id,from_stage_id,to_stage_id)
 SELECT role_id,s.id,t.id FROM public.hiring_stages s JOIN public.hiring_stages t ON t.hiring_role_id=s.hiring_role_id
 WHERE s.hiring_role_id=role_id AND((NOT s.terminal AND NOT t.terminal AND abs(s.sort_order-t.sort_order)IN(10,20))OR(NOT s.terminal AND t.terminal))ON CONFLICT DO NOTHING;
 SELECT id INTO applied_id FROM public.hiring_stages WHERE hiring_role_id=role_id AND kind='applied' ORDER BY sort_order LIMIT 1;
 UPDATE public.applications SET hiring_role_id=role_id,current_hiring_stage_id=applied_id,candidate_visible_status='submitted',updated_at=now()
 WHERE job_id=p_job_id AND hiring_role_id IS NULL AND outcome IS NULL;
 RETURN role_id;END$$;
REVOKE ALL ON FUNCTION public.initialize_hiring_role_unbound(uuid,text,text)FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.initialize_hiring_role(uuid,text,text)FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.initialize_hiring_role(uuid,text,text)TO authenticated;

ALTER FUNCTION public.transition_hiring_application(uuid,uuid,public.hiring_outcome_enum,text)RENAME TO transition_hiring_application_unvalidated;
CREATE FUNCTION public.transition_hiring_application(p_application_id uuid,p_to_stage_id uuid,p_outcome public.hiring_outcome_enum DEFAULT NULL,p_reason text DEFAULT NULL)RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_catalog AS $$
DECLARE app public.applications%ROWTYPE;stage public.hiring_stages%ROWTYPE;BEGIN
 SELECT * INTO app FROM public.applications WHERE id=p_application_id;
 SELECT * INTO stage FROM public.hiring_stages WHERE id=p_to_stage_id AND hiring_role_id=app.hiring_role_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'stage does not belong to application role';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.hiring_stage_edges WHERE hiring_role_id=app.hiring_role_id AND from_stage_id=app.current_hiring_stage_id AND to_stage_id=p_to_stage_id)THEN RAISE EXCEPTION 'transition is not configured for this role';END IF;
 IF p_outcome='hired'AND stage.candidate_visible_status<>'hired'THEN RAISE EXCEPTION 'hired outcome requires the hired terminal stage';END IF;
 IF p_outcome='not_selected'AND stage.candidate_visible_status<>'not_selected'THEN RAISE EXCEPTION 'not selected outcome requires the not-selected terminal stage';END IF;
 RETURN public.transition_hiring_application_unvalidated(p_application_id,p_to_stage_id,p_outcome,p_reason);END$$;
REVOKE ALL ON FUNCTION public.transition_hiring_application_unvalidated(uuid,uuid,public.hiring_outcome_enum,text)FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.transition_hiring_application(uuid,uuid,public.hiring_outcome_enum,text)FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.transition_hiring_application(uuid,uuid,public.hiring_outcome_enum,text)TO authenticated;
NOTIFY pgrst,'reload schema';

CREATE OR REPLACE FUNCTION public.transition_hiring_application(p_application_id uuid,p_to_stage_id uuid,p_outcome public.hiring_outcome_enum DEFAULT NULL,p_reason text DEFAULT NULL)RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_catalog AS $$
DECLARE app public.applications%ROWTYPE;stage public.hiring_stages%ROWTYPE;role_row public.hiring_roles%ROWTYPE;event_id uuid;previous_visible public.candidate_visible_status_enum;BEGIN
 IF auth.uid()IS NULL THEN RAISE EXCEPTION 'authentication required';END IF;
 SELECT * INTO app FROM public.applications WHERE id=p_application_id;
 SELECT * INTO role_row FROM public.hiring_roles WHERE id=app.hiring_role_id;
 IF NOT FOUND OR NOT public.can_access_hiring_workspace(role_row.business_profile_id,true)THEN RAISE EXCEPTION 'application not found' USING ERRCODE='insufficient_privilege';END IF;
 SELECT * INTO stage FROM public.hiring_stages WHERE id=p_to_stage_id AND hiring_role_id=app.hiring_role_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'stage does not belong to application role';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.hiring_stage_edges WHERE hiring_role_id=app.hiring_role_id AND from_stage_id=app.current_hiring_stage_id AND to_stage_id=p_to_stage_id)THEN RAISE EXCEPTION 'transition is not configured for this role';END IF;
 IF p_outcome='hired'AND stage.candidate_visible_status<>'hired'THEN RAISE EXCEPTION 'hired outcome requires the hired terminal stage';END IF;
 IF p_outcome='not_selected'AND stage.candidate_visible_status<>'not_selected'THEN RAISE EXCEPTION 'not selected outcome requires the not-selected terminal stage';END IF;
 previous_visible:=app.candidate_visible_status;
 event_id:=public.transition_hiring_application_unvalidated(p_application_id,p_to_stage_id,p_outcome,p_reason);
 IF p_outcome='role_cancelled'THEN UPDATE public.applications SET candidate_visible_status=previous_visible WHERE id=p_application_id;END IF;
 RETURN event_id;END$$;
