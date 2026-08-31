-- Rebind the public, owner-authorized redelivery RPC to the private ownership predicate.

CREATE OR REPLACE FUNCTION public.redeliver_integration_webhook(p_delivery_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog AS $$
DECLARE v_delivery public.integration_webhook_deliveries%ROWTYPE;
BEGIN
  SELECT d.* INTO v_delivery
  FROM public.integration_webhook_deliveries d
  JOIN public.integration_webhook_subscriptions s ON s.id = d.subscription_id
  WHERE d.id = p_delivery_id AND jid_private.owns_integration(s.integration_id);
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

REVOKE ALL ON FUNCTION public.redeliver_integration_webhook(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeliver_integration_webhook(uuid) TO authenticated;
