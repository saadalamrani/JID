-- Section 12 Step 3 / Master Prompt 5.1 + 8 — public announcements

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'announcement_category_enum') THEN
    CREATE TYPE public.announcement_category_enum AS ENUM (
      'jobs',
      'mentorship',
      'events',
      'platform',
      'community'
    );
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.public_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar text NOT NULL,
  body_ar text,
  category public.announcement_category_enum NOT NULL,
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  cta_url text,
  cta_label_ar text,
  is_featured boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  updated_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  CONSTRAINT public_announcements_title_ar_len_chk
    CHECK (char_length(trim(title_ar)) BETWEEN 10 AND 120),
  CONSTRAINT public_announcements_body_ar_len_chk
    CHECK (body_ar IS NULL OR char_length(body_ar) <= 500),
  CONSTRAINT public_announcements_cta_label_ar_len_chk
    CHECK (cta_label_ar IS NULL OR char_length(cta_label_ar) <= 30),
  CONSTRAINT public_announcements_expires_after_starts_chk
    CHECK (expires_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_public_announcements_published_schedule
  ON public.public_announcements (starts_at, expires_at)
  WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_public_announcements_category
  ON public.public_announcements (category, created_at DESC);

ALTER TABLE public.public_announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS public_announcements_select_public ON public.public_announcements;
CREATE POLICY public_announcements_select_public
  ON public.public_announcements
  FOR SELECT
  TO public
  USING (
    is_published = true
    AND starts_at <= now()
    AND expires_at > now()
  );

DROP POLICY IF EXISTS public_announcements_staff_manage ON public.public_announcements;
DO $$
BEGIN
  IF to_regprocedure('public.is_privileged_staff()') IS NOT NULL THEN
    EXECUTE $policy$
      CREATE POLICY public_announcements_staff_manage
        ON public.public_announcements
        FOR ALL
        TO authenticated
        USING (public.is_privileged_staff())
        WITH CHECK (public.is_privileged_staff())
    $policy$;
  ELSIF to_regprocedure('public.current_user_role()') IS NOT NULL THEN
    EXECUTE $policy$
      CREATE POLICY public_announcements_staff_manage
        ON public.public_announcements
        FOR ALL
        TO authenticated
        USING (public.current_user_role() IN ('staff', 'admin', 'super_admin'))
        WITH CHECK (public.current_user_role() IN ('staff', 'admin', 'super_admin'))
    $policy$;
  END IF;
END;
$$;
