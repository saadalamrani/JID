-- JID Security & Privacy Contract Remediation — Gate A CONTRACT
-- Apply only after the Gate A application that reads safe projections is
-- deployable on top of EXPAND. Removes obsolete public base-table policies and
-- obsolete anon/authenticated grants. Final state is security-equivalent to the
-- approved Gate A intent.

-- Base profiles remain available to the owner and privileged staff policies.
-- Public, business-discovery, and university row reads move to safe projections.
DROP POLICY IF EXISTS profiles_select_public ON public.profiles;
DROP POLICY IF EXISTS profiles_select_verified_hr_discoverable ON public.profiles;
DROP POLICY IF EXISTS profiles_select_university_stats ON public.profiles;

REVOKE ALL ON TABLE public.profiles FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.profiles TO authenticated;

-- Remove unconditional skills public read; audience_read from EXPAND remains.
DROP POLICY IF EXISTS profile_skills_public_read ON public.profile_skills;

REVOKE ALL ON TABLE public.profile_skills FROM anon, authenticated;
GRANT SELECT ON TABLE public.profile_skills TO anon, authenticated;
GRANT INSERT, DELETE ON TABLE public.profile_skills TO authenticated;

-- Mentor base-table public reads end; public traffic uses mentor_public_projection.
DROP POLICY IF EXISTS mentor_profiles_select_public ON public.mentor_profiles;
DROP POLICY IF EXISTS mentor_profiles_select_own ON public.mentor_profiles;
CREATE POLICY mentor_profiles_select_own
  ON public.mentor_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

REVOKE ALL ON TABLE public.mentor_profiles FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.mentor_profiles TO authenticated;

-- Public mentor-review base-table reads end; projection remains.
DROP POLICY IF EXISTS mentor_reviews_select_public ON public.mentor_reviews;

REVOKE ALL ON TABLE public.mentor_reviews FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.mentor_reviews TO authenticated;

-- Applications retain their current applicant, owned-Business, and Staff RLS
-- contracts. Gate A contains the legacy document/contact columns by removing
-- every anonymous privilege and granting authenticated users only the
-- operations those existing policies require. No projection grants access to
-- application rows.
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.applications FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.applications TO authenticated;
