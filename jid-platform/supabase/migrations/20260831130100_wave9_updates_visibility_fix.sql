-- Wave 9 P1 privacy fix: disabling update visibility also withdraws prior shared updates.
CREATE FUNCTION public.wave9_withdraw_updates_on_privacy_change() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_catalog AS $$
BEGIN
  IF NEW.updates_enabled IS FALSE AND (TG_OP='INSERT' OR OLD.updates_enabled IS DISTINCT FROM FALSE) THEN
    UPDATE public.professional_updates SET audience='private'
    WHERE author_id=NEW.profile_id AND deleted_at IS NULL AND audience='connections';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER wave9_withdraw_updates_on_privacy_change
AFTER INSERT OR UPDATE OF updates_enabled ON public.professional_network_preferences
FOR EACH ROW EXECUTE FUNCTION public.wave9_withdraw_updates_on_privacy_change();
REVOKE ALL ON FUNCTION public.wave9_withdraw_updates_on_privacy_change() FROM PUBLIC,anon,authenticated;
