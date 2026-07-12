-- Create public.profiles automatically on auth.users insert.
-- Required when email confirmations are on: signUp returns a user with no session,
-- so client-side INSERT into profiles fails RLS (auth.uid() IS NULL).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_name text;
  v_locale text;
  v_role text;
BEGIN
  v_full_name := NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'full_name', '')), '');
  v_locale := COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'locale'), ''), 'ar');
  v_role := COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'role'), ''), 'individual');

  -- Signup may request individual or entity only; privileged roles never from client metadata.
  IF v_role NOT IN ('individual', 'entity') THEN
    v_role := 'individual';
  END IF;

  INSERT INTO public.profiles (id, full_name, role, locale, profile_state, visibility)
  VALUES (
    NEW.id,
    v_full_name,
    v_role::public.user_role_enum,
    v_locale,
    'incomplete',
    'private'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    locale = COALESCE(EXCLUDED.locale, public.profiles.locale),
    updated_at = now();

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
