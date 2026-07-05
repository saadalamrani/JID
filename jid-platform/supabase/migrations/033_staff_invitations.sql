-- Staff onboarding invitations
-- Section 11 Step 1

CREATE TABLE public.staff_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role public.user_role_enum NOT NULL,
  invite_token text NOT NULL UNIQUE,
  invited_by uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  accepted_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT staff_invitations_role_chk CHECK (role IN ('staff', 'admin', 'super_admin')),
  CONSTRAINT staff_invitations_email_format_chk CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

CREATE INDEX idx_staff_invitations_pending
  ON public.staff_invitations (email)
  WHERE accepted_at IS NULL;
