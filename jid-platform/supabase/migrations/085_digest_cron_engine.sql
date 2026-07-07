-- Section 7 — deferred digest batch engine + daily pg_cron (08:00 Asia/Riyadh = 05:00 UTC).
-- Note: requested filename 054_digest_cron_engine.sql is occupied by mentorship_review_claim_fix.

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS included_in_digest_id uuid REFERENCES public.digest_batches (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_included_in_digest
  ON public.notifications (included_in_digest_id)
  WHERE included_in_digest_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_digest_candidates
  ON public.notifications (recipient_id, created_at DESC)
  WHERE included_in_digest_id IS NULL
    AND delivered_via_email = false
    AND email_sent_at IS NULL
    AND archived_at IS NULL
    AND category <> 'digest.daily_summary';

-- ---------------------------------------------------------------------------
-- build_daily_digests — group deferred items, batch, parent notification, notify
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.build_daily_digests()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recipient record;
  v_batch_id uuid;
  v_parent_id uuid;
  v_digest_date date;
  v_built integer := 0;
  v_item_ids uuid[];
  v_item_count integer;
  v_title_ar text;
  v_title_en text;
  v_body_ar text;
  v_body_en text;
  v_idempotency_key text;
BEGIN
  v_digest_date := (now() AT TIME ZONE 'Asia/Riyadh')::date;

  FOR v_recipient IN
    SELECT n.recipient_id
    FROM public.notifications n
    WHERE n.included_in_digest_id IS NULL
      AND n.delivered_via_email = false
      AND n.email_sent_at IS NULL
      AND n.archived_at IS NULL
      AND n.category <> 'digest.daily_summary'
      AND n.created_at >= now() - interval '24 hours'
      AND EXISTS (
        SELECT 1
        FROM public.get_notification_preference(n.recipient_id, n.category) gp
        WHERE gp.include_in_digest = true
      )
    GROUP BY n.recipient_id
  LOOP
    IF EXISTS (
      SELECT 1
      FROM public.digest_batches db
      WHERE db.recipient_id = v_recipient.recipient_id
        AND db.digest_date = v_digest_date
    ) THEN
      CONTINUE;
    END IF;

    SELECT array_agg(sub.id ORDER BY sub.created_at DESC)
    INTO v_item_ids
    FROM (
      SELECT n.id, n.created_at
      FROM public.notifications n
      WHERE n.recipient_id = v_recipient.recipient_id
        AND n.included_in_digest_id IS NULL
        AND n.delivered_via_email = false
        AND n.email_sent_at IS NULL
        AND n.archived_at IS NULL
        AND n.category <> 'digest.daily_summary'
        AND n.created_at >= now() - interval '24 hours'
        AND EXISTS (
          SELECT 1
          FROM public.get_notification_preference(n.recipient_id, n.category) gp
          WHERE gp.include_in_digest = true
        )
    ) sub;

    v_item_count := COALESCE(cardinality(v_item_ids), 0);
    IF v_item_count = 0 THEN
      CONTINUE;
    END IF;

    INSERT INTO public.digest_batches (
      recipient_id,
      digest_date,
      status,
      notification_count,
      metadata
    )
    VALUES (
      v_recipient.recipient_id,
      v_digest_date,
      'pending',
      v_item_count,
      jsonb_build_object('item_ids', to_jsonb(v_item_ids))
    )
    RETURNING id INTO v_batch_id;

    UPDATE public.notifications n
    SET included_in_digest_id = v_batch_id
    WHERE n.id = ANY (v_item_ids);

    v_title_ar := 'ملخصك اليومي';
    v_title_en := 'Your daily summary';
    v_body_ar := format('لديك %s تحديثات من آخر 24 ساعة.', v_item_count);
    v_body_en := format('You have %s updates from the last 24 hours.', v_item_count);
    v_idempotency_key := format(
      'digest.daily:%s:%s',
      v_recipient.recipient_id,
      v_digest_date
    );

    v_parent_id := public.dispatch_notification(
      p_recipient_id := v_recipient.recipient_id,
      p_category := 'digest.daily_summary',
      p_title_ar := v_title_ar,
      p_title_en := v_title_en,
      p_body_ar := v_body_ar,
      p_body_en := v_body_en,
      p_priority := 'normal',
      p_action_url := '/notifications',
      p_action_label_ar := 'عرض الإشعارات',
      p_action_label_en := 'View notifications',
      p_related_resource_type := 'digest_batch',
      p_related_resource_id := v_batch_id,
      p_idempotency_key := v_idempotency_key,
      p_metadata := jsonb_build_object(
        'digest_batch_id', v_batch_id,
        'digest_date', v_digest_date,
        'item_ids', to_jsonb(v_item_ids),
        'item_count', v_item_count
      )
    );

    IF v_parent_id IS NULL THEN
      UPDATE public.digest_batches
      SET status = 'failed', error_message = 'dispatch_notification returned NULL'
      WHERE id = v_batch_id;
      CONTINUE;
    END IF;

    UPDATE public.digest_batches
    SET
      status = 'processing',
      metadata = metadata || jsonb_build_object('parent_notification_id', v_parent_id)
    WHERE id = v_batch_id;

    PERFORM pg_notify('email_queue', v_parent_id::text);
    v_built := v_built + 1;
  END LOOP;

  RETURN v_built;
END;
$$;

REVOKE ALL ON FUNCTION public.build_daily_digests() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.build_daily_digests() TO service_role;

COMMENT ON FUNCTION public.build_daily_digests IS
  'Build per-recipient daily digest batches (24h window) and enqueue parent notification email.';

-- digest.daily_summary emails must dispatch by default.
CREATE OR REPLACE FUNCTION public.get_default_email_pref(
  cat public.notification_category_enum
)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
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
    'mentorship.meeting_reminder',
    'digest.daily_summary'
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- pg_cron — 08:00 Asia/Riyadh (05:00 UTC)
-- ---------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

DO $$
DECLARE
  v_job_id bigint;
BEGIN
  FOR v_job_id IN
    SELECT jobid
    FROM cron.job
    WHERE jobname = 'daily-digest-build'
  LOOP
    PERFORM cron.unschedule(v_job_id);
  END LOOP;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN OTHERS THEN NULL;
END;
$$;

SELECT cron.schedule(
  'daily-digest-build',
  '0 5 * * *',
  $$ SELECT public.build_daily_digests(); $$
);
