-- JID Auth/RBAC foundation: roles, profile auth columns, role escalation guard
-- Section 11 Step 1

CREATE TYPE public.user_role_enum AS ENUM (
  'individual',
  'entity',
  'staff',
  'admin',
  'super_admin'
);

-- Base profiles table (catalog migrations may have created this already)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  locale text NOT NULL DEFAULT 'ar',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role public.user_role_enum NOT NULL DEFAULT 'individual',
  ADD COLUMN IF NOT EXISTS email_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS phone_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS mfa_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS mfa_enforced boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_login_ip inet,
  ADD COLUMN IF NOT EXISTS failed_login_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until timestamptz;

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);

CREATE OR REPLACE FUNCTION public.prevent_role_self_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  role_ranks constant jsonb := '{
    "individual": 1,
    "entity": 2,
    "staff": 3,
    "admin": 4,
    "super_admin": 5
  }'::jsonb;
  old_rank integer;
  new_rank integer;
BEGIN
  IF NEW.role IS NOT DISTINCT FROM OLD.role THEN
    RETURN NEW;
  END IF;

  -- Block any self-initiated role change (including lateral/downgrade attempts via direct UPDATE)
  IF auth.uid() IS NOT NULL AND auth.uid() = OLD.id THEN
    RAISE EXCEPTION 'Users cannot change their own role';
  END IF;

  old_rank := (role_ranks ->> OLD.role::text)::integer;
  new_rank := (role_ranks ->> NEW.role::text)::integer;

  -- Allow privileged role changes via set_user_role() SECURITY DEFINER path
  IF current_setting('jid.allow_role_change', true) = 'on' THEN
    RETURN NEW;
  END IF;

  IF new_rank > old_rank THEN
    RAISE EXCEPTION 'Role escalation is not permitted via direct profile update';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_prevent_role_self_escalation ON public.profiles;

CREATE TRIGGER trg_profiles_prevent_role_self_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_self_escalation();
