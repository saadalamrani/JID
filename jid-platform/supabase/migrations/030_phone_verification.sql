-- Phone OTP verification attempts and rate limiting
-- Section 11 Step 1

CREATE TABLE public.phone_verification_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  phone text NOT NULL,
  otp_hash text NOT NULL,
  ip_address inet,
  attempt_number smallint NOT NULL DEFAULT 1,
  is_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  verified_at timestamptz,
  CONSTRAINT phone_verification_attempts_phone_format_chk CHECK (phone ~ '^\+966[0-9]{9}$')
);

CREATE INDEX idx_phone_verification_user_created
  ON public.phone_verification_attempts (user_id, created_at DESC);

CREATE INDEX idx_phone_verification_phone_created
  ON public.phone_verification_attempts (phone, created_at DESC);

-- Rate limits: 5 attempts per 15 minutes, 10 attempts per 24 hours (per user OR phone)
CREATE OR REPLACE FUNCTION public.check_otp_rate_limit(
  p_user_id uuid,
  p_phone text
)
RETURNS void
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_count_15min integer;
  v_count_24h integer;
BEGIN
  SELECT count(*)::integer
  INTO v_count_15min
  FROM public.phone_verification_attempts
  WHERE created_at > now() - interval '15 minutes'
    AND (user_id = p_user_id OR phone = p_phone);

  IF v_count_15min >= 5 THEN
    RAISE EXCEPTION 'OTP rate limit exceeded: maximum 5 attempts per 15 minutes'
      USING ERRCODE = 'P0001';
  END IF;

  SELECT count(*)::integer
  INTO v_count_24h
  FROM public.phone_verification_attempts
  WHERE created_at > now() - interval '24 hours'
    AND (user_id = p_user_id OR phone = p_phone);

  IF v_count_24h >= 10 THEN
    RAISE EXCEPTION 'OTP rate limit exceeded: maximum 10 attempts per 24 hours'
      USING ERRCODE = 'P0001';
  END IF;
END;
$$;
