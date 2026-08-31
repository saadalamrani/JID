REVOKE ALL ON FUNCTION public.plan_price_is_adopted(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.plan_price_is_adopted(text) TO authenticated, service_role;

REVOKE ALL ON public.commercial_packages FROM anon;
GRANT SELECT ON public.commercial_packages TO authenticated;
