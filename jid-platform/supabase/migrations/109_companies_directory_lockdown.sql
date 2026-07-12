-- P-103 Task 1 — Directory (companies) Ownership Law lockdown
-- Drops claimed_by owner-edit hole; platform-write-only UPDATE path.

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Remove legacy policies (Step 0 inventory: companies_update_permissions, companies_select_public, companies_insert_signup)
DROP POLICY IF EXISTS companies_update_permissions ON public.companies;
DROP POLICY IF EXISTS "Update permissions" ON public.companies;
DROP POLICY IF EXISTS companies_update_staff ON public.companies;
DROP POLICY IF EXISTS companies_select_public ON public.companies;
DROP POLICY IF EXISTS "Public read active companies" ON public.companies;
DROP POLICY IF EXISTS companies_insert_signup ON public.companies;
DROP POLICY IF EXISTS "Super Admin can insert" ON public.companies;

CREATE POLICY directory_public_read
  ON public.companies
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY directory_staff_read_all
  ON public.companies
  FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('staff', 'super_admin')
  );

CREATE POLICY directory_platform_insert
  ON public.companies
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('staff', 'super_admin')
  );

CREATE POLICY directory_platform_update
  ON public.companies
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('staff', 'super_admin')
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('staff', 'super_admin')
  );

-- Step 0 found no DELETE policy — create super_admin-only path per Ownership Law.
DROP POLICY IF EXISTS directory_platform_delete ON public.companies;
CREATE POLICY directory_platform_delete
  ON public.companies
  FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
  );

COMMENT ON TABLE public.companies IS
  'Layer 1 — Directory. Platform-write-only (Ownership Law, P-103). No organization may UPDATE its own directory row under any RLS path. Corrections flow through directory_correction_suggestions (P-103) reviewed by Staff.';

NOTIFY pgrst, 'reload schema';
