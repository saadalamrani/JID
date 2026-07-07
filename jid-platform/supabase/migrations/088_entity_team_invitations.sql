-- Entity team invitations — mirrors staff_invitations pattern (Section 12 / Task 2).
-- company_admin / university_admin invite colleagues; no profiles.role change until acceptance ships.

CREATE TABLE IF NOT EXISTS public.entity_team_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  email text NOT NULL,
  invite_token text NOT NULL UNIQUE,
  invited_by uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  accepted_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT entity_team_invitations_email_format_chk
    CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

CREATE INDEX IF NOT EXISTS idx_entity_team_invitations_company_id
  ON public.entity_team_invitations (company_id);

CREATE INDEX IF NOT EXISTS idx_entity_team_invitations_pending
  ON public.entity_team_invitations (email)
  WHERE accepted_at IS NULL;

ALTER TABLE public.entity_team_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS entity_team_invitations_select_admin ON public.entity_team_invitations;
DROP POLICY IF EXISTS entity_team_invitations_insert_admin ON public.entity_team_invitations;

CREATE POLICY entity_team_invitations_select_admin
  ON public.entity_team_invitations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.companies c
      WHERE c.id = entity_team_invitations.company_id
        AND c.claimed_by = auth.uid()
    )
  );

CREATE POLICY entity_team_invitations_insert_admin
  ON public.entity_team_invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    invited_by = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.companies c
      WHERE c.id = entity_team_invitations.company_id
        AND c.claimed_by = auth.uid()
        AND c.entity_state = 'approved'
    )
  );
