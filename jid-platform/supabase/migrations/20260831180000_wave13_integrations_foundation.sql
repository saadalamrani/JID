-- Wave 13: tenant-scoped, revocable integration and webhook foundation.
-- Forward-only. Provider secrets are references to a secret manager, never plaintext values.

CREATE TYPE public.integration_org_type AS ENUM ('business', 'university');
CREATE TYPE public.integration_state AS ENUM ('active', 'revoked');
CREATE TYPE public.webhook_delivery_state AS ENUM ('pending', 'delivering', 'succeeded', 'retry_scheduled', 'terminal_failure');
CREATE TYPE public.external_mapping_state AS ENUM ('mapped', 'conflict', 'detached');

CREATE TABLE public.integration_connectors (
  connector_key text PRIMARY KEY,
  display_name text NOT NULL,
  contract_version text NOT NULL DEFAULT '1.0',
  enabled boolean NOT NULL DEFAULT false,
  supported_scopes text[] NOT NULL,
  supported_inbound_events text[] NOT NULL DEFAULT '{}',
  supported_outbound_events text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT connector_key_format CHECK (connector_key ~ '^[a-z0-9_]+$')
);

INSERT INTO public.integration_connectors (
  connector_key, display_name, enabled, supported_scopes,
  supported_inbound_events, supported_outbound_events
) VALUES (
  'jid_fixture_v1', 'JID controlled fixture', true,
  ARRAY['opportunities:read','opportunities:write','applications:read','applications:write','organizations:read'],
  ARRAY['external.opportunity.changed.v1','external.application.changed.v1'],
  ARRAY['opportunity.published.v1','application.submitted.v1','application.status_changed.v1']
);

CREATE TABLE public.organization_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_type public.integration_org_type NOT NULL,
  organization_id uuid NOT NULL,
  connector_key text NOT NULL REFERENCES public.integration_connectors(connector_key),
  state public.integration_state NOT NULL DEFAULT 'active',
  scopes text[] NOT NULL,
  provider_tenant_key text NOT NULL,
  secret_reference text NOT NULL,
  authorized_by uuid NOT NULL REFERENCES public.profiles(id),
  authorized_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  revoked_by uuid REFERENCES public.profiles(id),
  revoked_at timestamptz,
  UNIQUE (connector_key, provider_tenant_key),
  CONSTRAINT integration_secret_reference_only CHECK (secret_reference ~ '^(vault|env|kms)://'),
  CONSTRAINT integration_revocation_consistent CHECK (
    (state = 'active' AND revoked_at IS NULL AND revoked_by IS NULL)
    OR (state = 'revoked' AND revoked_at IS NOT NULL AND revoked_by IS NOT NULL)
  )
);

CREATE TABLE public.integration_inbound_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id uuid NOT NULL REFERENCES public.organization_integrations(id) ON DELETE RESTRICT,
  provider_event_id text NOT NULL,
  event_type text NOT NULL,
  occurred_at timestamptz NOT NULL,
  received_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  payload_version text NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL CHECK (status IN ('accepted','processed','rejected')),
  rejection_code text,
  UNIQUE (integration_id, provider_event_id),
  CONSTRAINT inbound_payload_object CHECK (jsonb_typeof(payload) = 'object')
);

CREATE TABLE public.integration_webhook_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id uuid NOT NULL REFERENCES public.organization_integrations(id) ON DELETE RESTRICT,
  destination_url text NOT NULL,
  event_types text[] NOT NULL,
  signing_secret_reference text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT destination_https_only CHECK (destination_url ~ '^https://'),
  CONSTRAINT subscription_secret_reference_only CHECK (signing_secret_reference ~ '^(vault|env|kms)://')
);

CREATE TABLE public.integration_webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES public.integration_webhook_subscriptions(id) ON DELETE RESTRICT,
  idempotency_key text NOT NULL,
  event_type text NOT NULL,
  envelope_version text NOT NULL DEFAULT '1.0',
  payload jsonb NOT NULL,
  state public.webhook_delivery_state NOT NULL DEFAULT 'pending',
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count BETWEEN 0 AND 5),
  next_attempt_at timestamptz,
  last_http_status integer,
  last_error_code text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  completed_at timestamptz,
  UNIQUE (subscription_id, idempotency_key),
  CONSTRAINT delivery_payload_object CHECK (jsonb_typeof(payload) = 'object')
);

CREATE TABLE public.integration_delivery_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id uuid NOT NULL REFERENCES public.integration_webhook_deliveries(id) ON DELETE RESTRICT,
  attempt_number integer NOT NULL CHECK (attempt_number BETWEEN 1 AND 5),
  started_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  finished_at timestamptz,
  http_status integer,
  outcome text NOT NULL CHECK (outcome IN ('started','succeeded','retryable_failure','terminal_failure')),
  error_code text,
  UNIQUE (delivery_id, attempt_number)
);

CREATE TABLE public.integration_external_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id uuid NOT NULL REFERENCES public.organization_integrations(id) ON DELETE RESTRICT,
  object_type text NOT NULL CHECK (object_type IN ('opportunity','application','organization')),
  jid_object_id uuid NOT NULL,
  external_object_id text NOT NULL,
  external_version text,
  provenance jsonb NOT NULL,
  state public.external_mapping_state NOT NULL DEFAULT 'mapped',
  conflict_detail jsonb,
  last_reconciled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (integration_id, object_type, jid_object_id),
  UNIQUE (integration_id, object_type, external_object_id),
  CONSTRAINT mapping_conflict_detail CHECK (
    (state = 'conflict' AND conflict_detail IS NOT NULL) OR state <> 'conflict'
  )
);

CREATE TABLE public.integration_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id uuid REFERENCES public.organization_integrations(id) ON DELETE RESTRICT,
  organization_type public.integration_org_type NOT NULL,
  organization_id uuid NOT NULL,
  actor_id uuid REFERENCES public.profiles(id),
  action text NOT NULL,
  target_type text NOT NULL,
  target_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX integration_inbound_received_idx ON public.integration_inbound_events (integration_id, received_at DESC);
CREATE INDEX integration_delivery_due_idx ON public.integration_webhook_deliveries (state, next_attempt_at) WHERE state IN ('pending','retry_scheduled');
CREATE INDEX integration_audit_org_idx ON public.integration_audit_events (organization_type, organization_id, created_at DESC);

CREATE FUNCTION public.owns_integration_organization(p_type public.integration_org_type, p_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_catalog AS $$
  SELECT auth.uid() IS NOT NULL AND CASE p_type
    WHEN 'business' THEN EXISTS (SELECT 1 FROM public.business_profiles b WHERE b.id = p_id AND b.owner_user_id = auth.uid())
    WHEN 'university' THEN EXISTS (SELECT 1 FROM public.university_profiles u WHERE u.id = p_id AND u.owner_user_id = auth.uid())
  END
$$;

CREATE FUNCTION public.owns_integration(p_integration_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_catalog AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_integrations i
    WHERE i.id = p_integration_id
      AND public.owns_integration_organization(i.organization_type, i.organization_id)
  )
$$;

CREATE FUNCTION public.redeliver_integration_webhook(p_delivery_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog AS $$
DECLARE v_delivery public.integration_webhook_deliveries%ROWTYPE;
BEGIN
  SELECT d.* INTO v_delivery
  FROM public.integration_webhook_deliveries d
  JOIN public.integration_webhook_subscriptions s ON s.id = d.subscription_id
  WHERE d.id = p_delivery_id AND public.owns_integration(s.integration_id);
  IF v_delivery.id IS NULL THEN RETURN false; END IF;
  UPDATE public.integration_webhook_deliveries
  SET state = 'pending', attempt_count = 0, next_attempt_at = timezone('utc', now()),
      completed_at = NULL, last_http_status = NULL, last_error_code = NULL
  WHERE id = p_delivery_id;
  INSERT INTO public.integration_audit_events (
    integration_id, organization_type, organization_id, actor_id, action, target_type, target_id
  ) SELECT i.id, i.organization_type, i.organization_id, auth.uid(), 'webhook.redelivered', 'delivery', p_delivery_id
    FROM public.integration_webhook_subscriptions s
    JOIN public.organization_integrations i ON i.id = s.integration_id
    WHERE s.id = v_delivery.subscription_id;
  RETURN true;
END $$;

ALTER TABLE public.integration_connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_inbound_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_webhook_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_delivery_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_external_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY connectors_authenticated_read ON public.integration_connectors FOR SELECT TO authenticated USING (enabled);
CREATE POLICY integrations_owner_read ON public.organization_integrations FOR SELECT TO authenticated
  USING (public.owns_integration_organization(organization_type, organization_id));
CREATE POLICY subscriptions_owner_all ON public.integration_webhook_subscriptions FOR ALL TO authenticated
  USING (public.owns_integration(integration_id)) WITH CHECK (public.owns_integration(integration_id));
CREATE POLICY inbound_owner_read ON public.integration_inbound_events FOR SELECT TO authenticated USING (public.owns_integration(integration_id));
CREATE POLICY mappings_owner_read ON public.integration_external_mappings FOR SELECT TO authenticated USING (public.owns_integration(integration_id));
CREATE POLICY audit_owner_read ON public.integration_audit_events FOR SELECT TO authenticated
  USING (public.owns_integration_organization(organization_type, organization_id));
CREATE POLICY deliveries_owner_read ON public.integration_webhook_deliveries FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.integration_webhook_subscriptions s WHERE s.id = subscription_id AND public.owns_integration(s.integration_id))
);
CREATE POLICY attempts_owner_read ON public.integration_delivery_attempts FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.integration_webhook_deliveries d JOIN public.integration_webhook_subscriptions s ON s.id = d.subscription_id
          WHERE d.id = delivery_id AND public.owns_integration(s.integration_id))
);

REVOKE ALL ON public.integration_connectors, public.organization_integrations,
  public.integration_inbound_events, public.integration_webhook_subscriptions,
  public.integration_webhook_deliveries, public.integration_delivery_attempts,
  public.integration_external_mappings, public.integration_audit_events FROM anon;
REVOKE ALL ON FUNCTION public.owns_integration_organization(public.integration_org_type, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.owns_integration(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.redeliver_integration_webhook(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeliver_integration_webhook(uuid) TO authenticated;
GRANT SELECT ON public.integration_connectors, public.organization_integrations,
  public.integration_inbound_events, public.integration_webhook_subscriptions,
  public.integration_webhook_deliveries, public.integration_delivery_attempts,
  public.integration_external_mappings, public.integration_audit_events TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.integration_webhook_subscriptions TO authenticated;
