-- Close the anonymous application-data exposure through radar_cards without
-- changing applications RLS or the view projection.
ALTER VIEW public.radar_cards SET (security_invoker = true);

REVOKE ALL PRIVILEGES ON TABLE public.radar_cards FROM PUBLIC;
REVOKE ALL PRIVILEGES ON TABLE public.radar_cards FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.radar_cards FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.radar_cards FROM service_role;

GRANT SELECT ON TABLE public.radar_cards TO authenticated;
GRANT SELECT ON TABLE public.radar_cards TO service_role;