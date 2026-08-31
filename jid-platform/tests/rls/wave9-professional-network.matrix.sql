BEGIN; DO $$ BEGIN
IF has_function_privilege('anon','public.get_professional_network()','EXECUTE') THEN RAISE EXCEPTION 'P0 anon network read'; END IF;
IF has_table_privilege('authenticated','public.professional_updates','SELECT') OR has_table_privilege('authenticated','public.professional_connections','SELECT') THEN RAISE EXCEPTION 'P0 direct network read'; END IF;
IF pg_get_functiondef('public.get_professional_network()'::regprocedure) NOT ILIKE '%wave9_connected(auth.uid(),u.author_id)%' THEN RAISE EXCEPTION 'P0 feed scope'; END IF;
IF pg_get_functiondef('public.get_professional_network()'::regprocedure) ~* '(career_operations|abhathli|applications|talent_sourcing|university_)' THEN RAISE EXCEPTION 'P0 private cross-domain read'; END IF;
END $$; ROLLBACK;
