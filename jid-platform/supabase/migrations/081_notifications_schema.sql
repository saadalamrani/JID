-- Unified Notifications — Section 3 schema (enumerations, tables, defaults, RLS).
-- Note: migration sequence uses 081; filename 050 is occupied by jobs_posting_fields.

-- ---------------------------------------------------------------------------
-- Section 3.1 — ENUM types
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  CREATE TYPE public.notification_category_enum AS ENUM (
    -- auth.*
    'auth.email_verified',
    'auth.mfa_disabled',
    'auth.mfa_enabled',
    'auth.new_device_login',
    'auth.password_changed',
    'auth.password_reset_requested',
    'auth.phone_verified',
    'auth.session_revoked',
    -- account.*
    'account.reinstated',
    'account.suspended',
    -- claim.*
    'claim.approved',
    'claim.needs_more_info',
    'claim.rejected',
    -- company.*
    'company.link_broken',
    -- job.*
    'job.application_expired',
    'job.application_received',
    'job.application_status_changed',
    'job.expiring_soon',
    'job.posted',
    -- legal.*
    'legal.privacy_updated',
    'legal.terms_updated',
    -- mentor.*
    'mentor.application_approved',
    'mentor.application_rejected',
    -- mentorship.*
    'mentorship.feedback_requested',
    'mentorship.meeting_confirmed',
    'mentorship.meeting_proposed',
    'mentorship.meeting_reminder',
    'mentorship.request_accepted',
    'mentorship.request_declined',
    'mentorship.request_received',
    -- staff.*
    'staff.claim_assigned',
    -- digest.*
    'digest.daily_summary'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE TYPE public.notification_priority_enum AS ENUM (
    'low',
    'normal',
    'high',
    'critical'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE TYPE public.email_send_status_enum AS ENUM (
    'queued',
    'sent',
    'failed',
    'skipped_quota',
    'skipped_prefs',
    'skipped_bounced'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

-- ---------------------------------------------------------------------------
-- Section 3.2 — Tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  category public.notification_category_enum NOT NULL,
  priority public.notification_priority_enum NOT NULL DEFAULT 'normal',
  title_ar text NOT NULL,
  title_en text NOT NULL,
  body_ar text NOT NULL,
  body_en text NOT NULL,
  action_url text,
  action_label_ar text,
  action_label_en text,
  related_resource_type text,
  related_resource_id uuid,
  idempotency_key text,
  read_at timestamptz,
  archived_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notifications_idempotency_key_unique UNIQUE (idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread
  ON public.notifications (recipient_id, created_at DESC)
  WHERE read_at IS NULL AND archived_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_all
  ON public.notifications (recipient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_category
  ON public.notifications (category);

CREATE INDEX IF NOT EXISTS idx_notifications_related
  ON public.notifications (related_resource_type, related_resource_id)
  WHERE related_resource_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_idempotency_key
  ON public.notifications (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

COMMENT ON TABLE public.notifications IS
  'In-app notification feed — inserts via service role / dispatch_notification only.';

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  category public.notification_category_enum NOT NULL,
  in_app_enabled boolean NOT NULL DEFAULT true,
  email_enabled boolean NOT NULL DEFAULT false,
  include_in_digest boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, category)
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user
  ON public.notification_preferences (user_id);

COMMENT ON TABLE public.notification_preferences IS
  'Per-user notification channel overrides; unset categories fall back to default helpers.';

CREATE TABLE IF NOT EXISTS public.email_send_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid REFERENCES public.notifications (id) ON DELETE SET NULL,
  recipient_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  recipient_email text NOT NULL,
  category public.notification_category_enum,
  status public.email_send_status_enum NOT NULL DEFAULT 'queued',
  provider_message_id text,
  error_message text,
  attempted_at timestamptz,
  sent_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_send_log_notification
  ON public.email_send_log (notification_id)
  WHERE notification_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_email_send_log_recipient_created
  ON public.email_send_log (recipient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_send_log_status_created
  ON public.email_send_log (status, created_at DESC);

COMMENT ON TABLE public.email_send_log IS
  'Email delivery lifecycle per notification — super_admin read-only via RLS.';

CREATE TABLE IF NOT EXISTS public.email_bounces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  bounce_type text NOT NULL CHECK (bounce_type IN ('hard', 'complaint')),
  first_bounced_at timestamptz NOT NULL DEFAULT now(),
  last_bounced_at timestamptz NOT NULL DEFAULT now(),
  bounce_count integer NOT NULL DEFAULT 1,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT email_bounces_email_unique UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS idx_email_bounces_email
  ON public.email_bounces (email);

COMMENT ON TABLE public.email_bounces IS
  'Hard bounces and spam complaints — suppresses future email sends.';

CREATE TABLE IF NOT EXISTS public.digest_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  digest_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'sent', 'skipped_empty', 'failed')),
  notification_count integer NOT NULL DEFAULT 0,
  sent_at timestamptz,
  error_message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT digest_batches_recipient_date_unique UNIQUE (recipient_id, digest_date)
);

CREATE INDEX IF NOT EXISTS idx_digest_batches_recipient_status
  ON public.digest_batches (recipient_id, status, digest_date DESC);

COMMENT ON TABLE public.digest_batches IS
  'Deferred daily digest batches per recipient.';

-- ---------------------------------------------------------------------------
-- Section 3.2 — Default preference helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_default_email_pref(
  cat public.notification_category_enum
)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  -- Section 3.2 — high-value / security categories default to email ON.
  RETURN cat IN (
    'auth.email_verified',
    'auth.mfa_disabled',
    'auth.mfa_enabled',
    'auth.new_device_login',
    'auth.password_changed',
    'auth.password_reset_requested',
    'auth.phone_verified',
    'auth.session_revoked',
    'account.suspended',
    'account.reinstated',
    'claim.approved',
    'claim.rejected',
    'claim.needs_more_info',
    'mentor.application_approved',
    'mentor.application_rejected',
    'job.application_status_changed',
    'job.application_expired',
    'legal.terms_updated',
    'legal.privacy_updated',
    'mentorship.meeting_confirmed',
    'mentorship.meeting_reminder'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_default_digest_pref(
  cat public.notification_category_enum
)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  -- Section 3.2 — frequent low-value events default to digest inclusion.
  RETURN cat IN (
    'job.application_received',
    'job.posted',
    'job.expiring_soon',
    'mentorship.request_received',
    'mentorship.request_accepted',
    'mentorship.request_declined',
    'mentorship.meeting_proposed',
    'mentorship.feedback_requested',
    'company.link_broken',
    'staff.claim_assigned'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_category_mandatory(
  cat public.notification_category_enum
)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  -- Section 3.2 — legal / strict security updates cannot be fully opted out.
  RETURN cat IN (
    'legal.terms_updated',
    'legal.privacy_updated',
    'account.suspended',
    'auth.password_changed',
    'auth.session_revoked',
    'auth.new_device_login',
    'auth.password_reset_requested'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_notification_preference(
  p_user_id uuid,
  p_category public.notification_category_enum
)
RETURNS TABLE (
  in_app_enabled boolean,
  email_enabled boolean,
  include_in_digest boolean,
  is_mandatory boolean,
  preference_source text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pref public.notification_preferences%ROWTYPE;
  v_mandatory boolean;
BEGIN
  v_mandatory := public.is_category_mandatory(p_category);

  SELECT *
  INTO v_pref
  FROM public.notification_preferences np
  WHERE np.user_id = p_user_id
    AND np.category = p_category;

  IF FOUND THEN
    in_app_enabled := v_pref.in_app_enabled;
    email_enabled := v_pref.email_enabled;
    include_in_digest := v_pref.include_in_digest;
    preference_source := 'user';
  ELSE
    in_app_enabled := true;
    email_enabled := public.get_default_email_pref(p_category);
    include_in_digest := public.get_default_digest_pref(p_category);
    preference_source := 'default';
  END IF;

  is_mandatory := v_mandatory;

  -- Mandatory categories always deliver in-app + email regardless of user prefs.
  IF v_mandatory THEN
    in_app_enabled := true;
    email_enabled := true;
  END IF;

  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.get_default_email_pref(public.notification_category_enum) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_default_digest_pref(public.notification_category_enum) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_category_mandatory(public.notification_category_enum) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_notification_preference(uuid, public.notification_category_enum) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_default_email_pref(public.notification_category_enum) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_default_digest_pref(public.notification_category_enum) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_category_mandatory(public.notification_category_enum) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_notification_preference(uuid, public.notification_category_enum) TO authenticated;

-- ---------------------------------------------------------------------------
-- Section 3.4 — Row Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_send_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_bounces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digest_batches ENABLE ROW LEVEL SECURITY;

-- notifications: recipients read + mark read/archive only; no direct INSERT.
DROP POLICY IF EXISTS notifications_select_own ON public.notifications;
CREATE POLICY notifications_select_own
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (recipient_id = auth.uid());

DROP POLICY IF EXISTS notifications_update_own ON public.notifications;
CREATE POLICY notifications_update_own
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- notification_preferences: full self-service CRUD bounded to auth.uid().
DROP POLICY IF EXISTS notification_preferences_select_own ON public.notification_preferences;
CREATE POLICY notification_preferences_select_own
  ON public.notification_preferences
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS notification_preferences_insert_own ON public.notification_preferences;
CREATE POLICY notification_preferences_insert_own
  ON public.notification_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS notification_preferences_update_own ON public.notification_preferences;
CREATE POLICY notification_preferences_update_own
  ON public.notification_preferences
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS notification_preferences_delete_own ON public.notification_preferences;
CREATE POLICY notification_preferences_delete_own
  ON public.notification_preferences
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- email_send_log + email_bounces: super_admin only (profiles.role).
DROP POLICY IF EXISTS email_send_log_select_super_admin ON public.email_send_log;
CREATE POLICY email_send_log_select_super_admin
  ON public.email_send_log
  FOR SELECT
  TO authenticated
  USING (public.current_user_role() = 'super_admin');

DROP POLICY IF EXISTS email_bounces_select_super_admin ON public.email_bounces;
CREATE POLICY email_bounces_select_super_admin
  ON public.email_bounces
  FOR SELECT
  TO authenticated
  USING (public.current_user_role() = 'super_admin');

-- digest_batches: recipient can read own batches only.
DROP POLICY IF EXISTS digest_batches_select_own ON public.digest_batches;
CREATE POLICY digest_batches_select_own
  ON public.digest_batches
  FOR SELECT
  TO authenticated
  USING (recipient_id = auth.uid());
