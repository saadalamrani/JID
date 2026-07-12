-- P-103 Task 3 — verification_requests: zero direct UPDATE policy (P-102 functions only)

ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

-- Drop all legacy UPDATE paths (Step 0: verification_requests_update_staff from P-101 carry-forward)
DROP POLICY IF EXISTS claim_requests_update_staff ON public.verification_requests;
DROP POLICY IF EXISTS verification_requests_update_staff ON public.verification_requests;
DROP POLICY IF EXISTS "Staff updates claims" ON public.verification_requests;

-- Replace SELECT/INSERT with Ownership Law names; drop redundant assigned policy (staff_read covers staff role).
DROP POLICY IF EXISTS claim_requests_select_own ON public.verification_requests;
DROP POLICY IF EXISTS verification_requests_select_own ON public.verification_requests;
DROP POLICY IF EXISTS claim_requests_select_staff ON public.verification_requests;
DROP POLICY IF EXISTS verification_requests_select_staff ON public.verification_requests;
DROP POLICY IF EXISTS claim_requests_insert_own ON public.verification_requests;
DROP POLICY IF EXISTS verification_requests_insert_own ON public.verification_requests;
DROP POLICY IF EXISTS claim_requests_select_assigned ON public.verification_requests;
DROP POLICY IF EXISTS verification_requests_select_assigned ON public.verification_requests;

CREATE POLICY verification_applicant_read_own
  ON public.verification_requests
  FOR SELECT
  TO authenticated
  USING (applicant_user_id = auth.uid());

CREATE POLICY verification_staff_read_all
  ON public.verification_requests
  FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('staff', 'super_admin')
  );

CREATE POLICY verification_applicant_insert_own
  ON public.verification_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (applicant_user_id = auth.uid());

COMMENT ON TABLE public.verification_requests IS
  'Layer 2. Zero direct UPDATE policy by design (P-103) — status transitions occur only via approve_verification_request()/reject_verification_request() (P-102), guaranteeing role-grant and audit-log atomicity.';

NOTIFY pgrst, 'reload schema';
