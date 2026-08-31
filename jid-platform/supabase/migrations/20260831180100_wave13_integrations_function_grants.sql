-- Wave 13 follow-up: RLS ownership predicates require authenticated callers to execute
-- the two fail-closed ownership helpers. PUBLIC and anon remain denied.

REVOKE ALL ON FUNCTION public.owns_integration_organization(public.integration_org_type, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.owns_integration(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owns_integration_organization(public.integration_org_type, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.owns_integration(uuid) TO authenticated;
