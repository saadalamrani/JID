-- P-103 Task 2 — Layer 3 profile ownership policies (business + university)

ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profile_public_read_published ON public.business_profiles;
DROP POLICY IF EXISTS profile_owner_read_own ON public.business_profiles;
DROP POLICY IF EXISTS profile_staff_read_all ON public.business_profiles;
DROP POLICY IF EXISTS profile_owner_update_content ON public.business_profiles;

CREATE POLICY profile_public_read_published
  ON public.business_profiles
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

CREATE POLICY profile_owner_read_own
  ON public.business_profiles
  FOR SELECT
  TO authenticated
  USING (owner_user_id = auth.uid());

CREATE POLICY profile_staff_read_all
  ON public.business_profiles
  FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('staff', 'super_admin')
  );

CREATE POLICY profile_owner_update_content
  ON public.business_profiles
  FOR UPDATE
  TO authenticated
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid() AND status <> 'suspended');

-- NO INSERT / DELETE policies — creation via P-102 SECURITY DEFINER functions only.

ALTER TABLE public.university_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS university_profile_public_read_published ON public.university_profiles;
DROP POLICY IF EXISTS university_profile_owner_read_own ON public.university_profiles;
DROP POLICY IF EXISTS university_profile_staff_read_all ON public.university_profiles;
DROP POLICY IF EXISTS university_profile_owner_update_content ON public.university_profiles;

CREATE POLICY university_profile_public_read_published
  ON public.university_profiles
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

CREATE POLICY university_profile_owner_read_own
  ON public.university_profiles
  FOR SELECT
  TO authenticated
  USING (owner_user_id = auth.uid());

CREATE POLICY university_profile_staff_read_all
  ON public.university_profiles
  FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('staff', 'super_admin')
  );

CREATE POLICY university_profile_owner_update_content
  ON public.university_profiles
  FOR UPDATE
  TO authenticated
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid() AND status <> 'suspended');

NOTIFY pgrst, 'reload schema';
