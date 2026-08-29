-- Explicit Data API grants (Supabase 2026 exposure defaults).
-- RLS remains the row-level boundary; anon receives no access.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hiring_team_memberships TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hiring_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hiring_criteria TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hiring_stages TO authenticated;
GRANT SELECT ON public.hiring_stage_transitions TO authenticated;
GRANT SELECT, INSERT ON public.hiring_notes TO authenticated;
GRANT SELECT, INSERT ON public.hiring_evidence_attachments TO authenticated;

REVOKE ALL ON public.hiring_team_memberships FROM anon;
REVOKE ALL ON public.hiring_roles FROM anon;
REVOKE ALL ON public.hiring_criteria FROM anon;
REVOKE ALL ON public.hiring_stages FROM anon;
REVOKE ALL ON public.hiring_stage_transitions FROM anon;
REVOKE ALL ON public.hiring_notes FROM anon;
REVOKE ALL ON public.hiring_evidence_attachments FROM anon;
