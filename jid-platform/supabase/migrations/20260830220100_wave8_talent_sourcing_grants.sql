-- Wave 8 corrective: table writes stay RPC-only. Default privileges had granted ALL
-- to authenticated on new public tables. Forward-only; DATA_LOSS=0.

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE public.talent_sourcing_invitations FROM PUBLIC, anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE public.talent_sourcing_events FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE public.talent_sourcing_invitations TO authenticated;
GRANT SELECT ON TABLE public.talent_sourcing_events TO authenticated;

REVOKE ALL ON TABLE public.talent_sourcing_invitations FROM anon;
REVOKE ALL ON TABLE public.talent_sourcing_events FROM anon;
