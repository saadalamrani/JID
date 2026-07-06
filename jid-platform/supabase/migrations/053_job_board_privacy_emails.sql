-- Section 6 / 13 — job-board privacy fields + email OTP verification

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS allow_company_direct_contact boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_application_history boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.email_verification_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  email text NOT NULL,
  otp_hash text NOT NULL,
  ip_address inet,
  is_verified boolean NOT NULL DEFAULT false,
  verified_at timestamptz,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT email_verification_attempts_email_format_chk
    CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  CONSTRAINT email_verification_attempts_email_lower_chk
    CHECK (email = lower(email))
);

CREATE INDEX IF NOT EXISTS idx_email_verification_attempts_user_created
  ON public.email_verification_attempts (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_verification_attempts_email_created
  ON public.email_verification_attempts (email, created_at DESC);

ALTER TABLE public.email_verification_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS email_verification_attempts_select_own ON public.email_verification_attempts;
CREATE POLICY email_verification_attempts_select_own
  ON public.email_verification_attempts
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS email_verification_attempts_insert_own ON public.email_verification_attempts;
CREATE POLICY email_verification_attempts_insert_own
  ON public.email_verification_attempts
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.check_email_otp_rate_limit(
  p_user_id uuid,
  p_email text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recent_count integer;
BEGIN
  SELECT count(*)::integer INTO v_recent_count
  FROM public.email_verification_attempts
  WHERE user_id = p_user_id
    AND created_at > now() - interval '1 hour';

  IF v_recent_count >= 5 THEN
    RAISE EXCEPTION 'Email OTP rate limit exceeded';
  END IF;

  SELECT count(*)::integer INTO v_recent_count
  FROM public.email_verification_attempts
  WHERE email = lower(trim(p_email))
    AND created_at > now() - interval '1 hour';

  IF v_recent_count >= 5 THEN
    RAISE EXCEPTION 'Email OTP rate limit exceeded for this address';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.check_email_otp_rate_limit(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_email_otp_rate_limit(uuid, text) TO authenticated;
