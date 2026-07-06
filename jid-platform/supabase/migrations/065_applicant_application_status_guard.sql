-- Section 9 — applicant-initiated application status transitions (Radar + self-declaration + save)
-- Company/staff updates bypass this guard.

CREATE OR REPLACE FUNCTION public.is_allowed_applicant_application_status_transition(
  p_from public.application_status_enum,
  p_to public.application_status_enum
)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT
    p_from IS NOT DISTINCT FROM p_to
    OR (p_from, p_to) IN (
      ('saved', 'pending'),
      ('saved', 'withdrawn'),
      ('invited', 'withdrawn'),
      ('withdrawn', 'saved'),
      ('expired', 'saved'),
      ('rejected', 'saved')
    );
$$;

REVOKE ALL ON FUNCTION public.is_allowed_applicant_application_status_transition(
  public.application_status_enum,
  public.application_status_enum
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_allowed_applicant_application_status_transition(
  public.application_status_enum,
  public.application_status_enum
) TO authenticated;

CREATE OR REPLACE FUNCTION public.enforce_applicant_application_status_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF public.is_privileged_staff() THEN
    RETURN NEW;
  END IF;

  IF NEW.applicant_id IS DISTINCT FROM auth.uid() THEN
    RETURN NEW;
  END IF;

  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  IF NOT public.is_allowed_applicant_application_status_transition(OLD.status, NEW.status) THEN
    RAISE EXCEPTION 'invalid_applicant_application_status_transition'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_applicant_application_status_guard ON public.applications;

CREATE TRIGGER trg_applicant_application_status_guard
  BEFORE UPDATE OF status ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_applicant_application_status_guard();

-- Applicants may only INSERT saved/pending rows (save + self-declaration).
CREATE OR REPLACE FUNCTION public.enforce_applicant_application_insert_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF public.is_privileged_staff() THEN
    RETURN NEW;
  END IF;

  IF NEW.applicant_id IS DISTINCT FROM auth.uid() THEN
    RETURN NEW;
  END IF;

  IF NEW.status NOT IN ('saved', 'pending', 'draft') THEN
    RAISE EXCEPTION 'invalid_applicant_application_insert_status'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_applicant_application_insert_guard ON public.applications;

CREATE TRIGGER trg_applicant_application_insert_guard
  BEFORE INSERT ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_applicant_application_insert_guard();
