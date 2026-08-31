-- Wave 13 security-advisor follow-up: ownership predicates support RLS but are not API RPCs.

CREATE SCHEMA IF NOT EXISTS jid_private;
REVOKE ALL ON SCHEMA jid_private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA jid_private TO authenticated;

ALTER FUNCTION public.owns_integration_organization(public.integration_org_type, uuid)
  SET SCHEMA jid_private;
ALTER FUNCTION public.owns_integration(uuid)
  SET SCHEMA jid_private;

REVOKE ALL ON FUNCTION jid_private.owns_integration_organization(public.integration_org_type, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION jid_private.owns_integration(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION jid_private.owns_integration_organization(public.integration_org_type, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION jid_private.owns_integration(uuid) TO authenticated;
