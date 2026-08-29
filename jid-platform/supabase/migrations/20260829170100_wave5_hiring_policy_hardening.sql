-- Wave 5 policy hardening: separate read from write/delete authority.
-- This follows the additive workspace migration immediately and ships with it.

DROP POLICY hiring_criteria_workspace ON public.hiring_criteria;
DROP POLICY hiring_stages_workspace ON public.hiring_stages;
DROP POLICY hiring_notes_workspace ON public.hiring_notes;
DROP POLICY hiring_evidence_employer ON public.hiring_evidence_attachments;

CREATE POLICY hiring_criteria_read ON public.hiring_criteria FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.hiring_roles r WHERE r.id = hiring_role_id
    AND public.can_access_hiring_workspace(r.business_profile_id, false)));
CREATE POLICY hiring_criteria_write ON public.hiring_criteria FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.hiring_roles r WHERE r.id = hiring_role_id
    AND public.can_access_hiring_workspace(r.business_profile_id, true)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.hiring_roles r WHERE r.id = hiring_role_id
    AND public.can_access_hiring_workspace(r.business_profile_id, true)));

CREATE POLICY hiring_stages_read ON public.hiring_stages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.hiring_roles r WHERE r.id = hiring_role_id
    AND public.can_access_hiring_workspace(r.business_profile_id, false)));
CREATE POLICY hiring_stages_write ON public.hiring_stages FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.hiring_roles r WHERE r.id = hiring_role_id
    AND public.can_access_hiring_workspace(r.business_profile_id, true)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.hiring_roles r WHERE r.id = hiring_role_id
    AND public.can_access_hiring_workspace(r.business_profile_id, true)));

CREATE POLICY hiring_notes_read ON public.hiring_notes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.applications a JOIN public.hiring_roles r ON r.id = a.hiring_role_id
    WHERE a.id = application_id AND public.can_access_hiring_workspace(r.business_profile_id, false)));
CREATE POLICY hiring_notes_insert ON public.hiring_notes FOR INSERT TO authenticated
  WITH CHECK (author_user_id = auth.uid() AND EXISTS
    (SELECT 1 FROM public.applications a JOIN public.hiring_roles r ON r.id = a.hiring_role_id
     WHERE a.id = application_id AND public.can_access_hiring_workspace(r.business_profile_id, true)));

CREATE POLICY hiring_evidence_employer_read ON public.hiring_evidence_attachments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.applications a JOIN public.hiring_roles r ON r.id = a.hiring_role_id
    WHERE a.id = application_id AND public.can_access_hiring_workspace(r.business_profile_id, false)));
CREATE POLICY hiring_evidence_employer_insert ON public.hiring_evidence_attachments FOR INSERT TO authenticated
  WITH CHECK (recorded_by = auth.uid() AND EXISTS
    (SELECT 1 FROM public.applications a JOIN public.hiring_roles r ON r.id = a.hiring_role_id
     WHERE a.id = application_id AND public.can_access_hiring_workspace(r.business_profile_id, true)));
