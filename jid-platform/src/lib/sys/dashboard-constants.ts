/** Section 6 — dashboard alert thresholds (shared by server + client). */
export const DASHBOARD_ALERT_THRESHOLDS = {
  highErrorRate: 10,
  slaHours: 72,
  cronStaleMinutes: 10,
  dbLatencyDegradedMs: 500,
} as const
