-- Section 6.2 — extend v_staff_personal_metrics with review KPIs

CREATE OR REPLACE VIEW public.v_staff_personal_metrics AS
SELECT
  staff.id AS staff_user_id,
  COALESCE(audit_stats.total_actions, 0)::bigint AS total_actions,
  COALESCE(audit_stats.actions_today, 0)::bigint AS actions_today,
  COALESCE(claim_stats.claims_reviewed, 0)::bigint AS claims_reviewed,
  COALESCE(claim_stats.claims_reviewed_today, 0)::bigint AS claims_reviewed_today,
  COALESCE(claim_stats.claims_assigned_open, 0)::bigint AS claims_assigned_open,
  COALESCE(claim_stats.claims_approved_today, 0)::bigint AS claims_approved_today,
  COALESCE(claim_stats.claims_rejected_today, 0)::bigint AS claims_rejected_today,
  COALESCE(claim_stats.avg_review_hours_7d, 0)::numeric AS avg_review_hours_7d,
  COALESCE(flag_stats.flags_resolved, 0)::bigint AS flags_resolved,
  COALESCE(flag_stats.flags_resolved_today, 0)::bigint AS flags_resolved_today
FROM public.profiles staff
LEFT JOIN LATERAL (
  SELECT
    count(*)::bigint AS total_actions,
    count(*) FILTER (
      WHERE al.created_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Riyadh')
    )::bigint AS actions_today
  FROM public.audit_logs al
  WHERE al.actor_id = staff.id
) audit_stats ON true
LEFT JOIN LATERAL (
  SELECT
    count(*) FILTER (WHERE cr.reviewed_by = staff.id)::bigint AS claims_reviewed,
    count(*) FILTER (
      WHERE cr.reviewed_by = staff.id
        AND cr.reviewed_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Riyadh')
    )::bigint AS claims_reviewed_today,
    count(*) FILTER (
      WHERE cr.assigned_staff_id = staff.id
        AND cr.status IN ('pending', 'submitted', 'pending_review', 'under_review')
    )::bigint AS claims_assigned_open,
    count(*) FILTER (
      WHERE cr.reviewed_by = staff.id
        AND cr.status = 'approved'
        AND cr.reviewed_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Riyadh')
    )::bigint AS claims_approved_today,
    count(*) FILTER (
      WHERE cr.reviewed_by = staff.id
        AND cr.status = 'rejected'
        AND cr.reviewed_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Riyadh')
    )::bigint AS claims_rejected_today,
    COALESCE(
      avg(
        EXTRACT(EPOCH FROM (cr.reviewed_at - cr.created_at)) / 3600.0
      ) FILTER (
        WHERE cr.reviewed_by = staff.id
          AND cr.reviewed_at IS NOT NULL
          AND cr.reviewed_at >= now() - interval '7 days'
      ),
      0
    )::numeric AS avg_review_hours_7d
  FROM public.claim_requests cr
) claim_stats ON true
LEFT JOIN LATERAL (
  SELECT
    count(*) FILTER (
      WHERE cf.reviewed_by = staff.id
        AND cf.status IN ('resolved', 'dismissed')
    )::bigint AS flags_resolved,
    count(*) FILTER (
      WHERE cf.reviewed_by = staff.id
        AND cf.reviewed_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Riyadh')
    )::bigint AS flags_resolved_today
  FROM public.content_flags cf
) flag_stats ON true
WHERE staff.role IN ('staff', 'admin', 'super_admin');

GRANT SELECT ON public.v_staff_personal_metrics TO authenticated;
