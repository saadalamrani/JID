-- Active session tracking for auth hardening
-- Section 11 Step 1

CREATE TABLE public.active_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  session_token_hash text NOT NULL,
  ip_address inet,
  user_agent text,
  device_label text,
  last_active_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz
);

CREATE INDEX idx_active_sessions_user_id ON public.active_sessions (user_id);
