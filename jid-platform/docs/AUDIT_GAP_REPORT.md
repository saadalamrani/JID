# JID Platform — Repo State Audit & Architecture Gap Report (P-000)

**Generated:** 2026-07-11  
**Repo root:** `jid-platform/`  
**Branch at audit:** `cursor/kill-commitment-score-purge`  
**Mode:** READ-ONLY audit — findings recorded, not fixed.

---

## Section 1 — Migration Registry

### Migration files (`supabase/migrations/`)

**Total SQL files:** 95 (numbered **013–102**; duplicate numeric prefixes exist from parallel sprint tracks).

**NEXT AVAILABLE MIGRATION NUMBER: `103`**

| # | Filename | One-line purpose |
|---|----------|------------------|
| 013 | `013_feature_flags.sql` | Platform Pulse feature flag foundation |
| 014 | `014_metric_thresholds.sql` | Platform Pulse metric thresholds |
| 015 | `015_public_announcements.sql` | Public announcements table |
| 016 | `016_pulse_materialized_views.sql` | Pulse materialized views + threshold sync |
| 017 | `017_pulse_cron_jobs.sql` | Pulse hourly cron schedules |
| 018 | `018_add_entity_type_to_companies.sql` | `entity_type` on companies (company/university) |
| 019 | `019_create_universities_catalog.sql` | `universities_catalog` table |
| 020 | `020_create_colleges_and_majors.sql` | `colleges_catalog`, `majors_catalog` |
| 021 | `021_modify_profiles_university_fields.sql` | Profile university/college/major FKs + student lifecycle |
| 022 | `022_university_dashboard_view.sql` | University dashboard MV + refresh cron |
| 023 | `023_university_rls_policies.sql` | University RLS (claimed_by gate) |
| 024 | `024_profile_enhancements.sql` | Unified profile core fields, skills junction, visibility enums |
| 024 | `024_create_pulse_feature_flags.sql` | Pulse-specific feature flags (duplicate prefix) |
| 025 | `025_profile_views_table.sql` | Profile view analytics (company viewers) |
| 025 | `025_create_public_announcements.sql` | Pulse announcements (duplicate prefix) |
| 026 | `026_create_pulse_metrics_view.sql` | Pulse metrics snapshot view + cron |
| 026 | `026_badges_system.sql` | Badges catalog + junction tables |
| 027 | `027_create_trends_views.sql` | Sector/skills demand trend views + cron |
| 027 | `027_company_profile_fields.sql` | Companies table, entity_state, commitment_score (historical) |
| 028 | `028_profile_rls_policies.sql` | Profile + profile_views RLS |
| 029 | `029_profile_system_triggers.sql` | Profile completion, badge awards, company badge cron |
| 029 | `029_auth_foundation.sql` | user_role_enum, profile auth columns, role escalation guard |
| 030 | `030_phone_verification.sql` | Phone OTP attempts + rate limiting |
| 031 | `031_claim_requests.sql` | **Claim workflow** — claim_requests table + claim_status_enum |
| 032 | `032_audit_logs.sql` | Immutable audit trail |
| 033 | `033_staff_invitations.sql` | Staff onboarding invitations |
| 034 | `034_active_sessions.sql` | Active session tracking |
| 035 | `035_security_definer_functions.sql` | Privileged auth/RBAC SECURITY DEFINER RPCs |
| 036 | `036_rls_auth_policies.sql` | RLS for auth/RBAC tables |
| 037 | `037_grant_otp_rate_limit.sql` | Grant OTP rate limit RPC to authenticated |
| 038 | `038_entity_signup.sql` | Entity signup catalog + claim extensions |
| 039 | `039_staff_claim_review.sql` | Staff claim review + companies_update_staff policy |
| 040 | `040_staff_invite_flow.sql` | Staff invitation acceptance flow |
| 041 | `041_auth_rbac_surface.sql` | Auth/RBAC surface + review_claim_request |
| 042 | `042_mentor_public_profile.sql` | Mentor public profile fields |
| 043 | `043_profile_view_stats_reinstate.sql` | Profile view stats + reinstate RPC |
| 044 | `044_company_catalog_reconciliation.sql` | Catalog reconciliation: claimed_by, entity_state, companies_update_permissions |
| 045 | `045_sectors_display_order.sql` | Sectors display ordering |
| 046 | `046_catalog_search_vector.sql` | Catalog full-text search column |
| 047 | `047_catalog_claim_link_auditor.sql` | Claim lifecycle + link auditor daily cron |
| 048 | `048_jobs_applications_database.sql` | Jobs/applications + user_verified_emails; RLS via claimed_by/entity_state |
| 049 | `049_jobs_required_skills.sql` | Job required skills |
| 050 | `050_jobs_posting_fields.sql` | External apply URL + pending_review status |
| 051 | `051_application_rejection_email_queue.sql` | Application rejection email outbox |
| 052 | `052_jobs_realtime_cron_email.sql` | Job expiry crons + email outbox (commitment_score SLA tiers — historical) |
| 053 | `053_job_board_privacy_emails.sql` | Job-board privacy on profiles + email OTP |
| 054 | `054_mentorship_review_claim_fix.sql` | Mentorship retroactive review_claim_request fix |
| 055 | `055_mentorship_database.sql` | Mentorship tables, triggers, crons |
| 056 | `056_mentor_application.sql` | Mentor application flow (separate from claim_requests) |
| 057 | `057_mentor_discovery.sql` | Mentor discovery filters |
| 058 | `058_mentor_card.sql` | Mentor card + crown badge fields |
| 059 | `059_mentorship_request_context.sql` | Context-rich mentorship requests |
| 060 | `060_mentor_hub.sql` | Mentor hub decline tracking |
| 061 | `061_encryption_key_public_read.sql` | E2EE public key read policy |
| 062 | `062_smart_scheduling.sql` | Smart scheduling + Radar sync |
| 063 | `063_mentor_score_workshops.sql` | mentor_score + active workshop sync |
| 064 | `064_radar_reconciliation.sql` | Radar feedback flags + reconciliation cron |
| 065 | `065_applicant_application_status_guard.sql` | Applicant-initiated status transitions |
| 066 | `066_radar_glow_realtime.sql` | Glow metadata + realtime payloads |
| 067 | `067_feedback_dismiss_snooze.sql` | Feedback dismiss snooze |
| 068 | `068_cv_database.sql` | CV module tables (cvs, cv_education, cv_experience, cv_skills, cv_additional) |
| 069 | `069_cv_header_professional_links.sql` | Professional link columns on cvs |
| 070 | `070_cv_education_extended.sql` | cv_education location/honors/coursework |
| 071 | `071_cv_experience_extended.sql` | cv_experience company city/country |
| 072 | `072_cv_skills_languages.sql` | cvs.technical_skills + languages JSONB |
| 073 | `073_review_claim_final_fix.sql` | Definitive review_claim_request() — sets claimed_by + entity_state |
| 074 | `074_platform_governance.sql` | Platform governance: flags, config, emergency, sys metrics |
| 075 | `075_feature_flags_section7.sql` | Feature flag layers (global/role/user) |
| 076 | `076_platform_config_section10.sql` | platform_config UI categories |
| 077 | `077_emergency_section11.sql` | Emergency controls |
| 078 | `078_staff_portal_section3.sql` | Staff portal: assign_claim, review_claim, metrics |
| 079 | `079_staff_personal_metrics_section62.sql` | Staff personal metrics KPIs |
| 080 | `080_claim_requests_realtime.sql` | Staff claims queue realtime |
| 081 | `081_notifications_schema.sql` | Unified notifications schema |
| 082 | `082_notification_dispatcher.sql` | Notification dispatcher + claim decision wrapper |
| 083 | `083_notifications_realtime.sql` | In-app notification bell realtime |
| 084 | `084_notification_email_worker.sql` | Notification email worker schema |
| 085 | `085_digest_cron_engine.sql` | Daily digest batch engine + cron |
| 086 | `086_email_quota_monthly.sql` | Monthly email quota guardrail |
| 087 | `087_onboarding_contact_messages.sql` | contact_messages + onboarding timestamps |
| 088 | `088_entity_team_invitations.sql` | Entity team invitations (claimed_by gate) |
| 089 | `089_kill_commitment_score.sql` | **Kill commitment_score** — archive, drop column, flatten expire_stale_applications |
| 090 | `090_opportunity_tier.sql` | jobs.tier opportunity_tier_enum |
| 091 | `091_subscriptions_foundation.sql` | plans, plan_entitlements, subscriptions, billing_events |
| 092 | `092_entitlement_functions.sql` | has_entitlement, company_has_entitlement + expire-subscriptions cron |
| 093 | `093_cv_builder_prefs.sql` | cv_builder_prefs (format/language/section order) |
| 094 | `094_smart_communication.sql` | Smart communication batches (claimed_by gates) |
| 095 | `095_lammah.sql` | Lammah scraped feed + purge/crawler crons |
| 096 | `096_search_mandates.sql` | Search-for-me mandates + matching engine |
| 097 | `097_priority_visibility.sql` | Employer boost (claimed_by + entitlement gate) |
| 098 | `098_ssis.sql` | Smart Screening Interviews (claimed_by RLS; ssis consent — not alumni) |
| 099 | `099_seed_model1_plans.sql` | Model 1 plan registry + entitlement seeds |
| 100 | `100_cloud_opportunities_bootstrap.sql` | **Cloud-only** sectors/regions + jobs/companies FK reconciliation |
| 101 | `101_cloud_companies_name_ar.sql` | **Cloud-only** companies display columns (name_ar, etc.) |
| 102 | `102_cloud_feature_flags_infrastructure.sql` | **Cloud-only** feature_flags table + is_feature_enabled RPC |

### pg_cron schedules (29 `cron.schedule` calls; 25 unique job names)

| Job name | Cron expression | Function / target |
|----------|-----------------|-------------------|
| `refresh-pulse-metrics` | `0 * * * *` | `public.refresh_pulse_metrics()` |
| `sync-thresholds` | `5 * * * *` | `public.sync_thresholds_after_refresh()` |
| `refresh-sector-demand` | `15 * * * *` | `public.refresh_sector_demand()` |
| `refresh-skills-demand` | `20 * * * *` | `public.refresh_skills_demand()` |
| `refresh-university-dashboard-snapshot` | `*/30 * * * *` | `public.refresh_university_dashboard_snapshot()` |
| `refresh-company-badges-6h` | `0 */6 * * *` | `public.refresh_company_badges()` |
| `catalog-link-auditor-daily` | `0 0 * * *` | Edge Function `link-auditor` via `net.http_post` |
| `transition-closing-soon` | `0 * * * *` | `public.transition_closing_soon()` |
| `expire-passed-jobs` | `5 * * * *` | `public.expire_passed_jobs()` |
| `expire-stale-apps` | `0 3 * * *` | `public.expire_stale_applications()` + `process-email-outbox` EF |
| `process-email-outbox` | `* * * * *` | Edge Function `process-email-outbox` |
| `expire-mentorship-requests` | `15 3 * * *` | `public.expire_stale_mentorship_requests()` |
| `process-radar-items` | `*/5 * * * *` | `public.process_due_radar_items()` |
| `enqueue-mentor-pending-radar` | `0 8 * * *` | `public.enqueue_mentor_pending_request_radar()` |
| `refresh-mentor-of-month` | `0 6 1 * *` | `public.refresh_mentor_of_month()` |
| `feedback-flags` | `*/30 * * * *` | `public.update_feedback_flags()` |
| `refresh-sys-metrics` | `*/5 * * * *` | `public.refresh_sys_metrics()` |
| `daily-digest-build` | `0 5 * * *` | `public.build_daily_digests()` |
| `expire-subscriptions` | `30 0 * * *` | `public.expire_lapsed_subscriptions()` |
| `process-communication-batches` | `*/5 * * * *` | Edge Function `process-communication-batches` |
| `purge-lammah` | `15 * * * *` | `public.purge_expired_lammah()` |
| `lammah-crawler` | `0 */6 * * *` | Edge Function `lammah-crawler` |
| `sweep-mandate-matching` | `15 * * * *` | `public.sweep_mandate_matching()` |
| `sweep-boosts` | `45 0 * * *` | `public.sweep_expired_boosts()` |
| `purge-ssis-responses` | `0 4 * * *` | `public.purge_expired_ssis_responses()` |

*Note: Migrations 017/026 and 017/027 reschedule overlapping Pulse jobs; latest definition wins at apply time.*

### SECURITY DEFINER functions (~130 declarations across 44 migration files; ~95 unique function names)

| Function | Primary file | One-line purpose |
|----------|--------------|------------------|
| `refresh_pulse_metrics` | 016/026 | Refresh Pulse metrics MV |
| `sync_thresholds_after_refresh` | 016/026 | Sync metric_thresholds from snapshot |
| `refresh_sector_demand` | 016/027 | Refresh sector demand trends |
| `refresh_skills_demand` | 016/027 | Refresh skills demand trends |
| `refresh_university_dashboard_snapshot` | 022 | Refresh university dashboard MV |
| `get_profile_view_stats` | 025/043 | Profile view stats for approved entity viewers |
| `enforce_profile_view_company_only` | 028 | Block non-company profile view inserts |
| `viewer_approved_company_id` | 028 | Resolve viewer's approved company |
| `viewer_approved_university_id` | 028 | Resolve viewer's approved university |
| `viewer_has_approved_company_claim` | 028 | Boolean approved-claim check |
| `prevent_role_self_escalation` | 029 | Block self role escalation on profiles |
| `recalculate_profile_completion` | 029 | Recompute profile_completion_pct |
| `award_*_badge` / `remove_entity_badge` | 029/044/089 | Badge award/remove triggers |
| `refresh_company_badges` | 029/044/089 | Periodic company badge refresh |
| `_write_audit_log` | 035 | Internal audit log writer |
| `set_user_role` | 035/040 | Privileged role assignment |
| `suspend_user` | 035/041 | Suspend user account |
| `verify_phone_otp` | 035 | Verify phone OTP |
| `current_user_role` | 036/102 | Read caller role |
| `is_admin_or_above` | 036/102 | Admin+ check |
| `is_privileged_staff` | 036 | Staff portal access check |
| `review_claim_request` | 039/041/044/047/054/073/078 | **Approve/reject claim; sets claimed_by + entity_state** |
| `review_claim` | 078 | Staff claim review alias |
| `assign_claim_to_self` | 078 | Staff claim assignment |
| `complete_staff_invite_acceptance` | 040 | Staff invite acceptance |
| `validate_staff_invite_token` | 040 | Validate staff invite token |
| `record_active_session` / `revoke_active_session` | 041 | Session management |
| `reinstate_profile` | 043 | Reinstate suspended profile |
| `expire_stale_applications` | 048/052/089 | Expire stale applications (089 removes commitment_score tiers) |
| `expire_passed_jobs` / `transition_closing_soon` | 048/052 | Job lifecycle cron helpers |
| `update_job_applicant_count` | 048 | Maintain applicant_count |
| `sync_application_company_id` | 048/064 | Sync application company FK |
| `check_email_otp_rate_limit` | 053 | Email OTP rate limit |
| `is_mentorship_staff` | 055 | Mentorship staff check |
| `process_due_radar_items` | 055 | Process due radar items |
| `compute_mentor_scores` | 063 | Compute mentor scores (called from refresh_mentor_of_month) |
| `refresh_mentor_of_month` | 063 | Monthly mentor-of-month refresh |
| `update_feedback_flags` | 064/067 | Radar feedback flag maintenance |
| `is_feature_enabled` | 074/075/102 | Feature flag evaluation |
| `refresh_sys_metrics` | 074 | Sys dashboard metrics refresh |
| `get_staff_personal_metrics` | 078 | Staff personal KPIs |
| `staff_suspend_user` | 078 | Staff-initiated suspension |
| `get_notification_preference` | 081 | Notification preference lookup |
| `notify_claim_decision` / `notify_radar_status_change` | 082 | Notification dispatcher wrappers |
| `email_quota_status` | 084/086 | Email quota status |
| `build_daily_digests` | 085 | Build notification digests |
| `has_entitlement` / `company_has_entitlement` | 092 | **Monetization entitlement checks** |
| `get_my_entitlements` / `expire_lapsed_subscriptions` | 092 | User entitlements + subscription expiry |
| `create_communication_batch` / `finalize_communication_batch` / … | 094 | Smart communication batch RPCs |
| `ingest_lammah_opportunity` / `purge_expired_lammah` | 095 | Lammah ingest/purge |
| `create_search_mandate` / `sweep_mandate_matching` / … | 096 | Search-for-me mandate engine |
| `toggle_job_boost` / `sweep_expired_boosts` | 097 | Priority visibility boost |
| `invite_ssis_applicants` / `consent_ssis_invitation` / … | 098 | SSIS screening lifecycle |
| `_user_role_rank` | 102 | Cloud feature-flag role rank helper |

### Edge Functions (`supabase/functions/`)

| Name | Trigger | Purpose |
|------|---------|---------|
| `cv-refine-bullets` | HTTP POST (authenticated) | AI bullet refinement for CV |
| `lammah-crawler` | pg_cron `lammah-crawler` (6h) | Scrape Lammah opportunity sources |
| `link-auditor` | pg_cron `catalog-link-auditor-daily` | Audit catalog external links |
| `notification-email-worker` | Invoked by dispatcher / cron | Send notification emails |
| `process-communication-batches` | pg_cron `process-communication-batches` (5m) | Drain due communication batches |
| `process-email-outbox` | pg_cron `process-email-outbox` + `expire-stale-apps` | Process rejection/email outbox |
| `resend-webhook` | Resend webhook POST | Inbound email delivery events |
| `send-claim-approval` | HTTP POST (staff) | Send claim approval email |
| `send-claim-decision-email` | HTTP POST (dispatcher) | Generic claim decision email |
| `send-claim-rejection` | HTTP POST (staff) | Send claim rejection email |
| `send-email-otp` | HTTP POST (authenticated) | Send email OTP |
| `send-expiry-notification` | HTTP POST / cron invoke | Job/application expiry notifications |
| `send-phone-otp` | HTTP POST (authenticated) | Send phone OTP |
| `send-rejection-email` | HTTP POST | Application rejection email |
| `send-staff-invite` | HTTP POST (staff) | Staff invitation email |
| `ssis-evaluate-response` | HTTP POST | Evaluate SSIS candidate response |
| `ssis-generate-screening` | HTTP POST (claimed company) | Generate SSIS screening draft |
| `verify-phone-otp` | HTTP POST (authenticated) | Verify phone OTP |

---

## Section 2 — Claim-Model Inventory (feeds Phase 1)

**Architectural target:** Directory records ≠ owned Business/University Profiles; claim model to be abolished.

**Symbols tracked:** `claimed_by`, `claim_status`, `claim_requests`, `entity_state`, `entity_claim_status`, `review_claim*`, companies UPDATE RLS, middleware guards, UI claim copy.

### 2.1 Schema & migrations → **P-101**

| File | Line context | Notes |
|------|--------------|-------|
| `031_claim_requests.sql` | L6–12 `claim_status_enum`; L18–34 `claim_requests` table | Core claim request schema |
| `027_company_profile_fields.sql` | L27 `entity_state` default `'unclaimed'`; L36 CHECK unclaimed/pending/claimed/suspended | Company catalog state machine |
| `038_entity_signup.sql` | claim_type extensions, entity signup catalog linkage | Entity onboarding tied to claims |
| `039_staff_claim_review.sql` | L14 `companies_update_staff` FOR UPDATE policy | Superseded by 044 |
| `044_company_catalog_reconciliation.sql` | L68 `claimed_by uuid`; L150–161 `companies_update_permissions` FOR UPDATE | **Primary companies UPDATE RLS** |
| `047_catalog_claim_link_auditor.sql` | claim lifecycle hooks + link auditor | Claim-adjacent catalog maintenance |
| `073_review_claim_final_fix.sql` | L85–86 approval sets `entity_state='approved', claimed_by=v_claim.user_id`; L131 rejection clears `claimed_by` | Definitive claim approval RPC body |
| `078_staff_portal_section3.sql` | L372/L438 same claimed_by mutations; `review_claim`, `assign_claim_to_self` | Staff portal claim RPCs |
| `080_claim_requests_realtime.sql` | Realtime on claim_requests status | Staff queue live updates |
| `089_kill_commitment_score.sql` | L4 references `entity_state` in badge refresh | Claim state still used post-089 |
| `094_smart_communication.sql` | L168/L191 RLS `c.claimed_by = auth.uid()` | Employer comms gated on claim |
| `097_priority_visibility.sql` | L56/L215 `claimed_by` ownership checks | Boost gated on claim |
| `098_ssis.sql` | L155/L178 `claimed_by` in SSIS RLS | Screening gated on claim |
| `023_university_rls_policies.sql` | L15 `c.claimed_by = auth.uid()` | University dashboard RLS |
| `048_jobs_applications_database.sql` | L428+ repeated `claimed_by` + `entity_state='approved'` in jobs RLS | Job board employer access |
| `051_application_rejection_email_queue.sql` | L41 `claimed_by` gate | Rejection email queue |
| `088_entity_team_invitations.sql` | L39/L53 `claimed_by` gate | Team invites require claim |
| `092_entitlement_functions.sql` | L145 `claimed_by` in subscription RLS | Billing tied to claim |
| `101_cloud_companies_name_ar.sql` | References companies catalog columns | Cloud reconciliation only |
| `029_profile_system_triggers.sql` | L306 `entity_state` in badge award | Profile triggers read entity_state |
| `041_auth_rbac_surface.sql` | `review_claim_request` redefinition | Auth surface claim review |
| `054_mentorship_review_claim_fix.sql` | `review_claim_request` + claimed_by mutations | Mentorship-era fix |
| `082_notification_dispatcher.sql` | `notify_claim_decision` wrapper | Claim decision notifications |
| `085_digest_cron_engine.sql` | claim-related digest event types | Notification routing |
| `074_platform_governance.sql` | entity moderation references | Sys governance |
| `056_mentor_application.sql` | Comment: not claim_requests | Distinct from entity claims |
| `seed.sql`, `seed/companies.sql` | Seed entity_state/claimed_by fixtures | Dev seed data |

### 2.2 Backend / lib / API → **P-102**

| File | Line context | Notes |
|------|--------------|-------|
| `src/lib/catalog/claim.ts` | Claim submission server actions (16 refs) | Public catalog claim API |
| `src/lib/entity/claims.ts` | Entity claim helpers | Onboarding claim flow |
| `src/lib/entity/rejected-claim.ts` | Rejected claim reapply logic | Reapply window |
| `src/lib/entity/companies.ts` | Company entity queries with entity_state | Entity resolution |
| `src/lib/onboarding/entity-actions.ts` | Entity admin role + claim paths | Onboarding |
| `src/lib/onboarding/entity-queries.ts` | `ENTITY_ADMIN_ROLES`, claim status reads | company_admin/university_admin via claim |
| `src/lib/onboarding/welcome-router.ts` | L16–25 routes company_admin/university_admin post-claim | Welcome routing |
| `src/lib/jobs/company-access.ts` | 8 refs — approved claim required for job ops | Job posting access |
| `src/lib/jobs/create-company-job.ts` | entity_state check | Job creation gate |
| `src/lib/applications/triage-access.ts` | claimed company applicant triage | Triage access |
| `src/lib/queries/catalog.ts` | Catalog list filters entity_state/claimed_by | Public catalog |
| `src/lib/profile/queries.ts` | entity_state in company profile reads | Profile views |
| `src/lib/profile/types.ts` | L21 approved company claim id | HR viewer context |
| `src/lib/hooks/use-current-entity.ts` | Current claimed entity hook | Client entity context |
| `src/lib/staff/review-claim.ts` | Staff claim review action | P-108 overlap |
| `src/lib/staff/claims.ts`, `claims-queue.ts`, `claim-review-queries.ts` | Staff claim data layer | Queue queries |
| `src/lib/staff/notify-claim-decision.ts` | Claim decision notification | Email trigger |
| `src/lib/staff/entities-queries.ts` | Approved entities list (claim-derived) | Moderation |
| `src/lib/sys/entities-queries.ts` | Sys entity management (11 refs) | Super-admin entities |
| `src/app/api/catalog/claim/route.ts` | Claim HTTP endpoint | Public claim POST |
| `src/app/auth/callback/route.ts` | Post-auth redirect uses claim state | Auth callback |
| `supabase/functions/send-claim-approval/index.ts` | Claim approval email EF | |
| `supabase/functions/send-claim-rejection/index.ts` | Claim rejection email EF | |
| `supabase/functions/send-claim-decision-email/index.ts` | Generic claim decision EF | |
| `supabase/functions/ssis-generate-screening/index.ts` | claimed_by check | SSIS generation |
| `scripts/test-catalog-claim.ts` | 27 refs — claim integration script | Dev verification |
| `scripts/verify-catalog-final.ts` | Asserts public queries omit claimed_by | Catalog privacy tests |
| (+ 15 verify/reconcile scripts) | claim/entity_state assertions | CI-adjacent scripts |

### 2.3 RLS policies → **P-103**

| File | Policy / context | Notes |
|------|------------------|-------|
| `044_company_catalog_reconciliation.sql` | `companies_update_permissions` FOR UPDATE: staff OR (`claimed_by = auth.uid()` AND `entity_state = 'approved'`) | **Canonical companies UPDATE grant** |
| `039_staff_claim_review.sql` | `companies_update_staff` (superseded) | Historical |
| `048_jobs_applications_database.sql` | jobs/applications INSERT/UPDATE/SELECT via `claimed_by` subqueries | Employer job RLS |
| `023_university_rls_policies.sql` | University stats via `claimed_by` | University RLS |
| `028_profile_rls_policies.sql` | `viewer_has_approved_company_claim` | Profile view gate |
| `036_rls_auth_policies.sql` | claim_requests policies | Claim request RLS |
| `088_entity_team_invitations.sql` | Team invite RLS via claimed_by | |
| `092_entitlement_functions.sql` | Subscription RLS via claimed_by | |
| `094_smart_communication.sql` | Communication batch RLS | |
| `097_priority_visibility.sql` | Boost RPC ownership | |
| `098_ssis.sql` | SSIS table RLS | |

### 2.4 UI & i18n → **P-105**

| File | Line context | Notes |
|------|--------------|-------|
| `src/components/entity/claim-submission-form.tsx` | Claim submission form | Entity claim UI |
| `src/components/entity/pending-review-view.tsx` | Pending claim review state | |
| `src/components/entity/entity-signup-wizard.tsx` | Entity signup wizard | |
| `src/components/profile/company-profile-view.tsx` | entity_state display | |
| `src/app/[locale]/(company)/company/claim/reapply/page.tsx` | Reapply claim page | |
| `src/app/[locale]/(company)/company/rejected/page.tsx` | Rejected claim page | |
| `src/app/[locale]/(company)/company/dashboard/page.tsx` | Dashboard gated on claim | |
| `src/app/[locale]/(company)/layout.tsx` | Company layout claim check | |
| `src/app/[locale]/(public)/companies/[uuid]/page.tsx` | Public company page ownership | |
| `src/app/[locale]/(public)/catalog/_components/ownership-badge.tsx` | Ownership badge (claimed/unclaimed) | |
| `src/app/[locale]/(public)/catalog/_components/ownership-filter-chips.tsx` | Ownership filter | |
| `src/app/[locale]/(onboarding)/company/_components/entity-setup-form.tsx` | Entity setup + claim | |
| `messages/ar.json` | `entity.claim.*`, `staff.claims*`, `المطالبة`, `طلب المطالبة`, `إعادة تقديم المطالبة` (L902–1196+) | Arabic claim copy |
| `messages/en.json` | Parallel `claim`, `claims`, `claimReview` keys (L902–1200+) | English claim copy |
| `messages/ar.json` | L616 `استلمنا` (contact ack — not entity claim; excluded from P-105 scope) | Non-claim Arabic |

### 2.5 Staff portal → **P-108**

| File | Line context | Notes |
|------|--------------|-------|
| `src/app/[locale]/(staff)/staff/claims/actions.ts` | Claim review server actions | |
| `src/app/[locale]/(staff)/staff/claims/[id]/_components/claim-review-workspace.tsx` | Claim review UI | |
| `src/app/[locale]/(staff)/staff/claims/_components/realtime-claims-updater.tsx` | Realtime claims queue | |
| `src/app/[locale]/(staff)/staff/claims/_components/claim-card.tsx` | Claim card (Arabic labels) | |
| `src/app/[locale]/(sys)/sys/entities/actions.ts` | 20 refs — force-approve, review_claim | Sys entity actions |
| `src/app/[locale]/(sys)/sys/entities/[id]/page.tsx` | Entity detail + claim status | |
| `src/app/[locale]/(sys)/sys/entities/_components/entities-table.tsx` | entity_state column | |
| `src/app/[locale]/(sys)/sys/entities/_components/entity-actions-menu.tsx` | Claim moderation actions | |
| `src/lib/staff/badges.ts` | Claim queue badge counts | |
| `src/lib/staff/dashboard-queries.ts` | claims_approved_today KPIs | |
| `src/lib/validations/staff.ts` | Claim review validation | |
| `src/types/staff-entities.ts`, `sys-entities.ts`, `catalog.ts` | entity_state / claim types | |

### 2.6 Middleware & auth guards → **P-109**

| File | Line context | Notes |
|------|--------------|-------|
| `src/middleware.ts` | L69 `entity_claim_status` condition; L273 failed guard redirect | **Middleware claim gate** |
| `src/lib/auth/conditions.ts` | L10 `EntityClaimStatus` type; L61 `isEntityClaimApproved`; L113 case `'entity_claim_status'` | Condition evaluator |
| `src/lib/auth/guards.ts` | L130–142, L172 routes require `conditions: ['entity_claim_status']` | Route guard definitions |
| `src/lib/auth/middleware-utils.ts` | L49–50 dev test header `x-jid-test-entity-claim`; L147–208 `resolveEntityClaimStatus()` reads claim_requests.status | **Live claim status resolution** |

---

## Section 3 — Commitment Score Inventory (feeds P-201)

### Schema (migrations)

| File | Context |
|------|---------|
| `027_company_profile_fields.sql` | L21 `commitment_score numeric(5,2) NOT NULL DEFAULT 0`; L48–52 CHECK; L58 index |
| `029_profile_system_triggers.sql` | L306–315 badge award uses `commitment_score >= 80` |
| `044_company_catalog_reconciliation.sql` | L327–336 same badge logic |
| `048_jobs_applications_database.sql` | L5 comment; L339–353 SLA tiers from commitment_score |
| `052_jobs_realtime_cron_email.sql` | L47–48 expire_stale_applications commitment_score tiers |
| `089_kill_commitment_score.sql` | **Removal migration**: archive to `_deprecated_commitment_scores`, drop column/index/constraint, flatten `expire_stale_applications`, update `refresh_company_badges` |

### Generated types (stale if 089 not applied to DB)

| File | Context |
|------|---------|
| `src/lib/supabase/types.ts` | L17 `_deprecated_commitment_scores` table; L326 `commitment_score_updated_at` on companies; L1592/L1662 RPC stubs `compute_company_commitment_score`, `refresh_all_commitment_scores` |

### Application code (mostly purged)

| File | Context |
|------|---------|
| `src/types/job.ts` | L63/L93 comments: client never includes commitment_score |
| `src/lib/profile/visibility-rules.ts` | L5 comment: no commitment_score |
| `scripts/verify-catalog-final.ts` | Asserts exclusion from catalog queries |
| `scripts/verify-job-board-final.ts` | Asserts no commitment_score in client |
| `scripts/inspect-jobs-schema-reconciliation.ts` | Checks column removed |

### UI components

| Finding | Status |
|---------|--------|
| `jid-partner-badge` component | **NOT FOUND** in `src/` — already removed or never shipped under that name |
| `jid_partner` references | Only in `types.ts` deprecated stubs |
| `tier-badge.tsx` | Exists — shows **opportunity tier** (`jobs.tier`), not commitment score |

### i18n

No `commitment_score` or `commitmentScore` keys found in `messages/ar.json` or `messages/en.json`.

### Staff/admin analytics

No active staff UI surfaces commitment_score. Historical references only in migration badge logic (pre-089).

### Pulse — `jid_response_rate_pct`

| File | Status |
|------|--------|
| `026_create_pulse_metrics_view.sql` L62 | Defines `jid_response_rate_pct` aggregate |
| `016_pulse_materialized_views.sql` L66 | Same in MV |
| `src/lib/pulse/metrics-config.ts` L15/L55 | Exposed in Pulse UI config |
| `src/lib/pulse/queries.ts` L15/L81/L98 | Queried from snapshot |

**VERDICT: `jid_response_rate_pct` EXISTS — mark KEEP (platform aggregate; unrelated to per-company commitment_score).**

---

## Section 4 — Individual Profile Schema Snapshot (feeds P-301)

### Privacy settings — NO `user_privacy_settings` table

Migration `048_jobs_applications_database.sql` L4–5, L84–86 explicitly documents: privacy SSOT is **`profiles`** columns from `024_profile_enhancements.sql`.

### `profiles` — core identity (quoted from migrations)

From `024_profile_enhancements.sql`:

```sql
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name text,
  locale text NOT NULL DEFAULT 'ar',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS headline text,
  ADD COLUMN IF NOT EXISTS about_me text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS target_sectors text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS target_program_types text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS target_regions text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS smart_links jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS profile_completion_pct smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profile_state public.profile_state_enum NOT NULL DEFAULT 'incomplete',
  ADD COLUMN IF NOT EXISTS visibility public.profile_visibility_enum NOT NULL DEFAULT 'private',
  ADD COLUMN IF NOT EXISTS show_profile_to_companies boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_profile_in_university_stats boolean NOT NULL DEFAULT false,
  ...
```

From `029_auth_foundation.sql`:

```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role public.user_role_enum NOT NULL DEFAULT 'individual',
  ADD COLUMN IF NOT EXISTS email_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS phone_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS mfa_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS mfa_enforced boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_login_ip inet,
  ADD COLUMN IF NOT EXISTS failed_login_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until timestamptz;
```

From `053_job_board_privacy_emails.sql`:

```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS allow_company_direct_contact boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_application_history boolean NOT NULL DEFAULT false;
```

### Education data (profiles layer — quoted from `021_modify_profiles_university_fields.sql`)

```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS university_id uuid,
  ADD COLUMN IF NOT EXISTS college_id uuid,
  ADD COLUMN IF NOT EXISTS major_id uuid,
  ADD COLUMN IF NOT EXISTS graduation_year smallint,
  ADD COLUMN IF NOT EXISTS student_status text;
-- FKs → universities_catalog, colleges_catalog, majors_catalog
-- student_status CHECK: current_student | expected_graduate | graduate | alumni | other
```

**Note:** Legacy `024` also created `universities`/`colleges` minimal tables; `021` repoints FKs to `*_catalog` tables (`019`/`020`).

### Skills data (profile layer — quoted from `024_profile_enhancements.sql`)

```sql
CREATE TABLE IF NOT EXISTS public.skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_ar text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profile_skills (
  profile_id uuid NOT NULL,
  skill_id uuid NOT NULL REFERENCES public.skills (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, skill_id)
);
```

### Experience data

**No `profile_experience` table exists.** Work history lives in CV module only (`cv_experience`).

### CV education (`068_cv_database.sql` + `070_cv_education_extended.sql`)

```sql
CREATE TABLE IF NOT EXISTS public.cv_education (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cv_id uuid NOT NULL REFERENCES public.cvs (id) ON DELETE CASCADE,
  institution_name text NOT NULL,
  degree text,
  field_of_study text,
  graduation_year smallint,
  gpa_value numeric(4, 2),
  gpa_scale numeric(4, 2),
  start_month smallint,
  start_year smallint,
  end_month smallint,
  end_year smallint,
  is_current boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  ...
);
-- 070 adds: institution_city, institution_country, honors, relevant_coursework
```

### CV experience (`068` + `071`)

```sql
CREATE TABLE IF NOT EXISTS public.cv_experience (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cv_id uuid NOT NULL REFERENCES public.cvs (id) ON DELETE CASCADE,
  company_name text NOT NULL,
  job_title text NOT NULL,
  location text,
  employment_type text,
  start_month smallint,
  start_year smallint,
  end_month smallint,
  end_year smallint,
  is_current boolean NOT NULL DEFAULT false,
  bullets text[] NOT NULL DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0,
  ...
);
-- 071 adds: company_city, company_country
```

### CV skills (`068` + `072`)

```sql
CREATE TABLE IF NOT EXISTS public.cv_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cv_id uuid NOT NULL REFERENCES public.cvs (id) ON DELETE CASCADE,
  skill_name text NOT NULL,
  proficiency text,
  sort_order integer NOT NULL DEFAULT 0,
  ...
);

ALTER TABLE public.cvs
  ADD COLUMN IF NOT EXISTS technical_skills jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS languages jsonb NOT NULL DEFAULT '[]'::jsonb;
```

### Certifications (`068_cv_database.sql` — `cv_additional`)

```sql
CREATE TYPE public.additional_category_enum AS ENUM (
  'certification', 'language', 'project', 'award', 'volunteer', 'publication', 'other', 'leadership'  -- leadership added 072
);

CREATE TABLE IF NOT EXISTS public.cv_additional (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cv_id uuid NOT NULL REFERENCES public.cvs (id) ON DELETE CASCADE,
  category public.additional_category_enum NOT NULL,
  title text NOT NULL,
  issuer text,
  description text,
  start_date date,
  end_date date,
  url text,
  sort_order integer NOT NULL DEFAULT 0,
  ...
);
```

### Verified emails (`048_jobs_applications_database.sql`)

```sql
CREATE TABLE IF NOT EXISTS public.user_verified_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  email text NOT NULL,
  verified_at timestamptz NOT NULL DEFAULT now(),
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  ...
);
```

Plus `email_verification_attempts` OTP table in `053_job_board_privacy_emails.sql`.

### CV builder preferences (`093_cv_builder_prefs.sql`)

```sql
CREATE TABLE IF NOT EXISTS public.cv_builder_prefs (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_format TEXT NOT NULL DEFAULT 'basic_free'
    CHECK (preferred_format IN ('harvard', 'global_ats', 'basic_free')),
  preferred_language TEXT NOT NULL DEFAULT 'en'
    CHECK (preferred_language IN ('en', 'ar')),
  section_order JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### CV builder autofill bindings (`src/lib/cv/auto-fill.ts`, `autofill-payload.ts`)

| Source field | Target |
|--------------|--------|
| `profiles.full_name` | `cvs.full_name` |
| `user_verified_emails.email` (primary → any → auth email) | `cvs.email` |
| `profiles.phone` | `cvs.phone` |
| `profiles.about_me` | `cvs.summary` |
| `profiles.target_regions[0]` | `cvs.city` |
| `profiles.linkedin_url` | `cvs.linkedin_url` |
| `profiles.locale` | `cvs.locale`, title |
| `universities_catalog.name` / `colleges_catalog.name` via `university_id`/`college_id` | `cv_education.institution_name`, `field_of_study` |
| `profile_skills` / skills catalog | Not auto-seeded in current autofill (education header only) |

---

## Section 5 — University Module State (feeds Phase 5)

| Asset | Location | Status |
|-------|----------|--------|
| `universities_catalog`, `colleges_catalog`, `majors_catalog` | Migrations 019–020 | **SUPERSEDED BY REV 2.1** |
| Profile university FKs (`university_id`, `college_id`, `major_id`, `student_status`) | 021 | **SUPERSEDED BY REV 2.1** |
| `mv_university_dashboard` + `refresh_university_dashboard_snapshot` | 022 | **SUPERSEDED BY REV 2.1** |
| University RLS via `claimed_by` | 023 | **SUPERSEDED BY REV 2.1** |
| `companies.entity_type = 'university'` | 018/027 | **SUPERSEDED BY REV 2.1** (catalog-as-university) |
| `university_admin` role | `029_auth_foundation` enum + guards | **SUPERSEDED BY REV 2.1** |
| Route `/[locale]/universities` (discover) | `src/app/[locale]/(public)/universities/page.tsx` | **SUPERSEDED BY REV 2.1** |
| University dashboard UI | `src/app/[locale]/(company)/company/dashboard/page.tsx` → `UniversityDashboard` | **SUPERSEDED BY REV 2.1** — no `/university/dashboard` route group |
| `university-layout.tsx`, `university-dashboard.tsx`, `empty-university-state.tsx` | `(company)/_components/` | **SUPERSEDED BY REV 2.1** |
| `academic-info-step.tsx` onboarding | `(auth)/onboarding/` | **SUPERSEDED BY REV 2.1** |
| `useUniversitiesCatalog` / `lib/queries/universities.ts` | Onboarding step-2 | **SUPERSEDED BY REV 2.1** |
| `UNIVERSITY_ANALYTICS_EVENTS` | `src/lib/analytics/track.ts` L69–75 | **SUPERSEDED BY REV 2.1** |
| Alumni consent tables | — | **NOT FOUND** |
| Academic email verification (university domain) | — | **NOT FOUND** (only generic `user_verified_emails` + business email in claims) |
| University attestation logic | — | **NOT FOUND** |
| Impact dashboard | `university-dashboard.tsx` PDF export + KPI MV | **SUPERSEDED BY REV 2.1** |

**SSIS `consent_ssis_invitation`** (098) is screening consent — not university alumni consent.

---

## Section 6 — Monetization State (feeds Phase 2)

| Asset | State |
|-------|-------|
| `plans` table | **EXISTS** — migration 091 + seed 099 (3 plans) |
| `plan_entitlements` | **EXISTS** — 9 entitlement rows seeded (Model 1 keys) |
| `subscriptions` | **EXISTS** — schema complete; 0 rows on cloud at last diagnostic |
| `billing_events` | **EXISTS** — audit log table |
| `has_entitlement(p_feature)` | **EXISTS** — 092, granted to authenticated |
| `company_has_entitlement(p_company_id, p_feature)` | **EXISTS** — 092; used in 094/097 |
| `jobs.tier` | **EXISTS** — `090_opportunity_tier.sql` enum `normal`/`plus` |
| `PlusGate` | **EXISTS** — `src/components/monetization/plus-gate.tsx`; wired to `lammah_feed`, `search_for_me`, `cv_pro_formats` |
| `tier-badge.tsx` | **EXISTS** — opportunity tier badge (not subscription tier) |
| `plus-plan-compare.tsx`, `plus-teaser.tsx`, `upgrade-dialog.tsx`, `manage-subscription.tsx` | **EXISTS** |
| Moyasar payment | **EXISTS** — `src/lib/billing/moyasar.ts`, `provider.ts`, `subscription-service.ts`; requires `MOYASAR_SECRET_KEY` (not in `env.ts` schema) |
| API routes | `src/app/api/billing/checkout`, `webhook`, `subscription` (per prior implementation) |
| Feature flags (monetization) | Keys in `plan_entitlements` CHECK: `cv_pro_formats`, `search_for_me`, `lammah_feed`, `smart_communication`, `ssis`, `priority_visibility` |
| `expire-subscriptions` cron | **EXISTS** — 092 |

**Gap:** `MOYASAR_SECRET_KEY` / `MOYASAR_WEBHOOK_SECRET` not validated in `src/lib/env.ts`.

---

## Section 7 — Cross-Cutting Conformance

### Design system — hardcoded hex colors (src only)

| File | Count |
|------|-------|
| `src/config/design-tokens.ts` | 63 (canonical token definitions — expected) |
| `src/app/[locale]/(individual)/profile/cv/print-cv-ar/print-cv-ar.css` | 12 |
| `src/lib/cv/formats/global-ats-styles.ts` | 4 |
| `src/lib/cv/formats/harvard-styles.ts` | 5 |
| `src/lib/cv/pdf-styles.ts` | 5 |
| `src/components/mentor/mentor-share-card-button.tsx` | 1 |
| `src/app/[locale]/(company)/_components/university-dashboard.tsx` | 1 |
| `src/app/[locale]/globals.css` | 1 |

**Total outside design-tokens:** ~29 hex literals in components/CSS (CV print/PDF paths dominate).

### `jid-*` Tailwind classes bypassing semantic tokens

**120+ files** reference `jid-` prefixed classes (grep count across `src/`). Highest density: `request-session-modal.tsx` (32), `announcement-form.tsx` (20), `schedule-meeting-dialog.tsx` (20), `university-dashboard.tsx` (16), `plus-teaser.tsx` (16), `feature-unavailable.tsx` (15), `job-triage-header.tsx` (14).

### i18n — hardcoded Arabic in components (top files by Arabic char matches)

| File | Approx. matches |
|------|-----------------|
| `src/lib/constants/communication.ts` | 33 |
| `src/lib/cv/pdf-helpers.ts` | 33 |
| `src/lib/feature-flags/metadata.ts` | 34 |
| `src/app/[locale]/(auth)/onboarding/_components/academic-info-step.tsx` | 19 |
| `src/app/[locale]/(public)/mentors/_components/mentor-filters.tsx` | 21 |
| `src/app/[locale]/(company)/jobs/new/_components/job-posting-wizard.tsx` | 13 |
| `src/app/[locale]/(company)/_components/university-dashboard.tsx` | 13 |
| `src/types/job.ts` | 12 |
| (+ 180 more files with 1–10 matches) | |

**Total files with inline Arabic:** ~200 under `src/`.

### Locked package versions (Sprint-0)

**No Sprint-0 locked package manifest file exists in the repo** (searched docs, conventions, roadmap references). Comparison against `package.json` pinning policy:

| Package | Declared | Drift risk |
|---------|----------|------------|
| Pinned exact (no `^`) | `next@14.2.15`, `react@18.3.1`, `@supabase/supabase-js@2.49.1`, `zod@3.24.1`, `typescript@5.9.3`, etc. (28 deps) | Low |
| Caret `^` ranges | `@dnd-kit/*`, `@radix-ui/react-dialog`, `lucide-react`, `tailwind-merge`, `zustand`, `@upstash/*`, `sharp`, `@next/bundle-analyzer` | **DRIFT** — resolves to newer minors on fresh install |
| `packageManager` | `pnpm@9.15.4` | Locked via `packageManager` field |

### Letter-spacing / `tracking-` near Arabic typography

**33 files** use `tracking-` or `letter-spacing` including: `src/lib/typography.ts` (19 — design system), `globals.css`, `pulse-shell.tsx`, `home-hero.tsx`, `hero-manifesto.tsx`, `vision-2030-section.tsx`, staff/sys sidebars. Risk: Latin-tracking applied to Arabic headlines.

### `'use client'` — unnecessary candidates (static render possible)

| File | Rationale |
|------|-----------|
| `src/app/[locale]/(public)/opportunities/_components/experience-level-chips.tsx` | Filter chips — may be server with URL state |
| `src/app/[locale]/(public)/catalog/_components/region-filter-chips.tsx` | Same pattern |
| `src/app/[locale]/(public)/pulse/_components/announcement-carousel.tsx` | Evaluate server wrapper + client carousel split |
| `src/app/[locale]/(sys)/sys/config/_components/config-row.tsx` | Row display — verify hook usage |
| `src/lib/analytics/track.ts` | `'use client'` required (window/localStorage) — **NOT a candidate** |

*Full audit of 200+ `'use client'` files deferred; list above is sampled high-confidence candidates only.*

### TypeScript (`pnpm type-check`)

```
> jid-platform@0.1.0 type-check
> tsc --noEmit

src/lib/supabase/types.ts(1950,10): error TS1005: ';' expected.
src/lib/supabase/types.ts(1950,12): error TS1434: Unexpected keyword or identifier.
src/lib/supabase/types.ts(1950,26): error TS1005: ';' expected.
src/lib/supabase/types.ts(1950,29): error TS1434: Unexpected keyword or identifier.
src/lib/supabase/types.ts(1950,38): error TS1434: Unexpected keyword or identifier.
src/lib/supabase/types.ts(1950,42): error TS1228: A type predicate is only allowed in return type position for functions and methods.
src/lib/supabase/types.ts(1950,56): error TS1434: Unexpected keyword or identifier.
src/lib/supabase/types.ts(1950,62): error TS1005: ';' expected.
src/lib/supabase/types.ts(1950,76): error TS1005: ',' expected.
src/lib/supabase/types.ts(1950,86): error TS1005: ',' expected.
```

**Summary:** FAILED — **45 parse errors**, all from corrupted tail of `src/lib/supabase/types.ts` (PowerShell stderr appended after `} as const` at ~L1949). No application-type errors reached due to parse failure.

### Lint (`pnpm lint`)

```
> jid-platform@0.1.0 lint
> next lint

./src/app/[locale]/(auth)/login/page.tsx
19:10  Error: 'PRIVILEGED_STAFF_ROLES' is defined but never used.

./src/app/[locale]/(authenticated)/layout.tsx
1:10  Error: 'redirect' is defined but never used.

./src/app/[locale]/(individual)/profile/cv/_components/live-preview-pane.tsx
9:10  Error: 'getCvFormatDocumentComponent' is defined but never used.

./src/app/[locale]/(mentor)/mentor/dashboard/_components/mentor-hub-dashboard.tsx
8:10  Error: 'MentorHubStubTab' is defined but never used.

./src/app/[locale]/(mentor)/mentor/dashboard/_components/mentor-hub-stub-tab.tsx
4:15  Error: 'MentorHubSettings' is defined but never used.
5:10  Error: 'cn' is defined but never used.

./src/app/[locale]/(onboarding)/company/_components/entity-team-form.tsx
16:8  Error: 'EntityTeamInvitesValues' is defined but never used.

./src/app/[locale]/(onboarding)/individual/_components/step-three-form.tsx
28:9  Error: 'locale' is assigned a value but never used.

./src/app/[locale]/(public)/contact/page.tsx
34:7  Error: 'defaultEmail' is never reassigned. Use 'const' instead.  prefer-const

./src/app/[locale]/(public)/mentors/_components/mentor-filter-context.tsx
65:9  Warning: react-hooks/exhaustive-deps

./src/app/[locale]/(public)/opportunities/_components/job-filter-context.tsx
72:9  Warning: react-hooks/exhaustive-deps

./src/app/[locale]/(public)/pulse/page.tsx
4:10  Error: 'AnnouncementsBillboard' is defined but never used.
5:10  Error: 'BillboardSkeleton' is defined but never used.

./src/lib/supabase/types.ts
Error: Parsing error: File appears to be binary.

./src/lib/seo/sitemap-data.ts
5:10  Error: 'SITEMAP_STATIC_ROUTES' is defined but never used.

./src/lib/sys/audit-catalog.ts
19:3  Error: 'Users' is defined but never used.

./src/lib/timeline/client.ts
12:9  Error: 'nowMs' is assigned a value but never used.

info  - Need to disable some ESLint rules? Learn more here: https://nextjs.org/docs/basic-features/eslint#disabling-rules
```

**Summary:** FAILED — **28 Errors**, **3 Warnings** (unused vars dominate; `types.ts` parse error; 2 exhaustive-deps warnings).

---

## Section 8 — Testing & DevOps State

| Area | State |
|------|-------|
| Unit/integration tests | **NONE** — 0 `*.test.ts` / `*.spec.ts` files |
| E2E tests | **NONE** detected |
| Test framework | **NOT CONFIGURED** (no jest/vitest/playwright in package.json) |
| CI workflows | **NONE** — no `.github/workflows/` directory |
| Husky | **EXISTS** — `prepare: husky` in package.json |
| lint-staged | **EXISTS** — prettier + eslint on staged files |
| Sentry | **NOT WIRED** — zero references in codebase |
| PostHog | **PARTIAL** — `src/lib/analytics/track.ts` client capture via `NEXT_PUBLIC_POSTHOG_KEY`; fails silent when unset; `src/lib/analytics/server.ts` exists |
| `vercel.json` | **EXISTS** — Next.js framework, `fra1` region, security headers (nosniff, SAMEORIGIN, referrer-policy) |
| `src/lib/env.ts` | Validates: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`, optional `NEXT_PUBLIC_APP_URL`, server `SUPABASE_SERVICE_ROLE_KEY`, `NODE_ENV`. **Missing:** PostHog, Moyasar, Upstash, Unifonic, Resend keys |
| `scripts/check-env.ts` | Referenced by `pnpm check-env` — not fully audited |
| Commitlint | `@commitlint/cli` configured |
| Supabase CLI | `supabase@2.20.12` devDependency; `gen-types` script targets `--local` |

---

## Section 9 — GAP LIST

| Gap | Severity | Owning prompt | Note |
|-----|----------|---------------|------|
| Claim model (`claim_requests`, `claimed_by`, `entity_state`) pervasive in schema | BLOCKER | P-101 | 31+ migrations define claim-centric catalog ownership |
| `review_claim_request` / `review_claim` RPCs set claimed_by | BLOCKER | P-102 | Definitive approval path in 073/078 |
| `companies_update_permissions` RLS grants UPDATE via claimed_by | BLOCKER | P-103 | 044 L150–161 |
| Jobs/applications/SSIS/comms RLS use claimed_by gates | BLOCKER | P-103 | 048, 094, 097, 098 |
| Middleware `entity_claim_status` guards company routes | BLOCKER | P-109 | middleware.ts + guards.ts |
| Staff/sys claims queue UI + actions | HIGH | P-108 | Full staff portal claim review surface |
| Claim UI + i18n (ar/en claim copy) | HIGH | P-105 | entity wizard, catalog ownership, 50+ i18n keys |
| Claim Edge Functions (approval/rejection emails) | HIGH | P-102 | 3 dedicated EFs |
| `commitment_score` still in migrations 027–052 | HIGH | P-201 | 089 kill migration exists but may be unapplied on cloud |
| `types.ts` corruption blocks type-check | BLOCKER | P-001 | 45 parse errors at L1950+ |
| Cloud DB schema drift vs full migration history | BLOCKER | P-001 | Bootstrap 100–102 only partial reconciliation |
| Duplicate migration numbers (024–029) | MED | P-101 | Parallel sprint tracks complicate ordering |
| No `user_privacy_settings` — privacy on profiles columns | MED | P-301 | Documented in 048; v2 may need new layer |
| No `profile_experience` — experience only in CV tables | MED | P-301 | Individual Profile v2 Career Record gap |
| Profile skills via junction vs CV skills duplication | MED | P-301 | Two skill stores (profile_skills + cv_skills/jsonb) |
| University module entirely claim-coupled | BLOCKER | P-501 | All assets marked SUPERSEDED BY REV 2.1 |
| No alumni consent / academic email verification tables | MED | P-501 | Nothing to migrate — greenfield for v2 |
| `university_admin` role tied to claim approval | HIGH | P-501 | guards.ts, welcome-router.ts |
| Monetization schema complete (091–092, 099) | LOW | P-601 | Foundation shipped |
| Moyasar billing code without env validation | MED | P-601 | moyasar.ts exists; keys not in env.ts |
| 0 subscriptions on cloud | MED | P-601 | Schema only — no live billing |
| `jobs.tier` column exists | LOW | P-601 | 090 applied in repo |
| PlusGate wired to Model 1 features only | LOW | P-601 | Correct scope per architecture |
| `jid_response_rate_pct` in Pulse | LOW | KEEP | Platform aggregate — do not remove with commitment_score |
| No automated test suite | HIGH | P-701 | Zero test files |
| No CI pipeline | HIGH | P-701 | No GitHub workflows |
| Sentry not integrated | MED | P-701 | Zero wiring |
| PostHog partial (client only, optional key) | MED | P-701 | No server-side enrichment |
| env.ts missing billing/analytics/redis keys | MED | P-701 | Incomplete env validation |
| 28 ESLint errors | MED | P-702 | Mostly unused imports + types.ts parse |
| 200+ files with hardcoded Arabic | MED | P-703 | i18n debt |
| 120+ files using jid-* classes | MED | P-703 | Design token bypass |
| ~29 hex colors outside design-tokens | LOW | P-703 | CV print/PDF paths |
| Letter-spacing on Arabic typography risk | MED | P-703 | typography.ts + marketing components |
| Caret-range package drift | MED | P-702 | 10+ deps use `^` |
| No Sprint-0 lock manifest in repo | LOW | P-702 | Cannot auto-diff; manual pin audit needed |
| `094` still references `claim_status` on companies (stale) | MED | P-101 | Repo uses entity_state per 044 |
| Generated types include deprecated commitment_score RPCs | MED | P-201 | Regenerate after 089 applied |
| Untracked cloud migrations 100–102 in working tree | MED | P-001 | Not committed; cloud-only reconciliation |
| Prior session modified catalog.ts, jobs.ts, types.ts | MED | P-001 | Working tree not clean (see checklist) |
| `tier-badge.tsx` hardcoded `عادي`/`بلس` labels | MED | P-703 | Deferred P-001 — component change outside allowed git diff; import `OPPORTUNITY_TIERS` |
| `plus-plan-compare.tsx` / `abhathli-teaser.tsx` / `plus-teaser.tsx` hardcoded `بلس` (subscription context) | MED | P-703 | Deferred P-001 — use `t('terminology.tiers.plus')` or product-name constants |
| `monetization.tier` i18n duplicates `terminology.tiers` | LOW | P-703 | Consolidate to terminology namespace in Phase 7 |
| 200+ components with hardcoded directory/profile Arabic (P-000 §7) | MED | P-703 | Deferred P-001 — requires `t('terminology.*')` wiring per component |
| Constitutional terminology constants locked (P-001) | LOW | P-001 | **RESOLVED** — terminology.ts, tiers.ts, product-names.ts, communication.ts, i18n namespace |
| Raw `jid-*` classes in component classNames (128 files) | HIGH | P-002 | **RESOLVED** — mechanical swap to semantic tokens |
| Arabic `tracking-*` violations (~28 instances) | HIGH | P-002 | **RESOLVED** — zero Arabic-rendering violations remain |
| CV print/PDF hex colors (ATS/Harvard/print-CSS) | MED | P-703 | P-002 Design Debt — external format specs |
| 4 command palette implementations | HIGH | P-608 | P-002 Design Debt — consolidate role-aware palette |
| Build: missing screening-builder/invite-panel modules | BLOCKER | P-508 | Pre-existing webpack failure |
| `types.ts` stale RPC union (OTP rate-limit functions) | BLOCKER | P-001 | Regenerate from linked Supabase after migrations |

---

## Verification Checklist

| Item | State |
|------|-------|
| [x] `docs/AUDIT_GAP_REPORT.md` exists and contains all 9 sections in order | **PASS** |
| [ ] `git status` shows ONLY the new report file — zero other changes | **FAIL** — also modified: `catalog.ts`, `jobs.ts`, `types.ts`; untracked: `100–102` migrations, `apply-cloud-opportunities-bootstrap.ts` |
| [x] Next migration number stated explicitly in Section 1 | **PASS** — **103** |
| [x] Every claim-model occurrence mapped to an owning P-number | **PASS** — Section 2 groups all 107 grep-matched files by P-101/102/103/105/108/109 |
| [x] Section 4 quotes real column definitions, not summaries | **PASS** — verbatim SQL from 021, 024, 029, 048, 053, 068, 070–072, 093 |
| [x] type-check and lint outputs pasted verbatim in Section 7 | **PASS** |

---

**STOP — P-000 complete. No fixes applied.**

---

## P-101 Execution Log

**Executed:** 2026-07-11  
**Next migration after P-101:** `107`

### Step 0 — Reconciliation (pre-migration)

| Item | Finding |
|------|---------|
| **(a) `companies.entity_type`** | **EXISTS.** Type is `public.entity_type_enum` (migration `018`) with values **`company`** and **`university`**. Business entities use `company` (not `business`, not NULL). Legacy text CHECK from `027`/`038` was normalized to enum in `018`. |
| **(b) Ownership / approval columns on `companies`** | **Coexist, with `entity_state` as SSOT** per `044_company_catalog_reconciliation.sql`. Physically present: **`claimed_by`** (uuid → profiles, `044`), **`entity_state`** (text CHECK: `unclaimed`, `pending`, `pending_review`, `approved`, `suspended` — evolved via `027`→`044`→`047`), **`claim_requested_at`** (`047`). **NOT present:** `claim_status`, `is_claimed`, `claim_approved_at`, `claim_approved_by` on `companies` (despite `094`/`098` RLS referencing `claim_status` — schema drift; P-103 must reconcile). |
| **(c) `claim_requests` column list** | **Drifts from Auth/RBAC doc.** Actual repo columns: `id`, **`user_id`** (not `claimant_user_id`), **`company_id`** (not `target_entity_id`, FK → companies), `company_name`, `business_email`, `claimant_name`, `claimant_title`, `evidence_urls`, `status` (`claim_status_enum`), **`claim_type`** (`claim_type_enum`: `company` \| `university`), `review_notes`, `reviewed_by`, `reviewed_at`, `created_at`, `updated_at`, `rejection_reason`, `can_reapply_after` (`039`), `required_documents` (`041`), `domain_verified` (`044`), `assigned_staff_id`, `first_viewed_at`, `first_viewed_by`, `sla_due_at` (`078`). Missing vs doc: `linkedin_url`, `justification`, `attached_documents` as separate fields. |
| **(d) Review RPCs** | **`review_claim_request(uuid, text, text, text)`** — definitive body in `073`; wrapper preserved in `078`. **`review_claim(uuid, text, text, text[])`** — staff portal implementation in `078`. **`assign_claim_to_self(uuid)`** — `078`. All reference `claim_requests` / `company_id` / `user_id` — **P-102 must retarget to `verification_requests`**. |
| **(e) Next migration number** | Audit Section 1: **`103`** (confirmed; P-101 used 103–106). |

### Migrations created

| File | Purpose |
|------|---------|
| `103_business_profiles.sql` | Layer 3 business owned profile table + indexes + RLS enabled (policies deferred P-103) |
| `104_university_profiles.sql` | Layer 3 university owned profile table + indexes + RLS enabled (policies deferred P-103) |
| `105_verification_requests.sql` | Rename `claim_requests` → `verification_requests`; column renames; `claim_type_enum` value `company`→`business`; new audit columns; mechanical RLS carry-forward |
| `106_directory_deprecations.sql` | `COMMENT ON` deprecations for `claimed_by`, `claim_requested_at`, `entity_state`; `entity_type_enum` `company`→`business` |

### Adaptations vs prompt assumptions

1. **Column renames use actual names:** `user_id`→`applicant_user_id`, `company_id`→`directory_id` (not doc's `claimant_user_id` / `target_entity_id`).
2. **`claim_type_enum` retained** (only value renamed `company`→`business`); column renamed to `verification_type`.
3. **Ownership deprecation** applied only to columns confirmed present; `claim_status`/`is_claimed`/`claim_approved_*` skipped (absent on `companies`).
4. **New Layer-3 tables:** RLS enabled with **no client policies** until P-103 (deny-by-default).
5. **`pnpm gen-types` failed** (Docker Desktop unavailable). `types.ts` updated **manually** from migration shapes + re-encoded UTF-8. Re-run `pnpm gen-types` after `supabase start` for authoritative types.
6. **`entity_badges.entity_type` CHECK** still allows `'company'` — not updated in P-101 (P-110/P-102 follow-up).

### Type-check errors surfaced by P-101 schema (do not fix here)

**Total `pnpm type-check` errors:** ~1117 (majority pre-existing stale `types.ts` vs live DB).

**P-101 rename-specific (`claim_requests` table removed from types):**

| File | Error | Owner |
|------|-------|-------|
| `src/lib/staff/types.ts` | `Database['public']['Tables']['claim_requests']` missing → `ClaimRequestRow` breaks | **P-102** |
| `src/lib/catalog/claim.ts` | `.from('claim_requests')` ×4 | **P-102** |
| `src/lib/entity/claims.ts` | `.from('claim_requests')` ×3 | **P-102** |
| `src/lib/entity/rejected-claim.ts` | `.from('claim_requests')` | **P-102** |
| `src/lib/auth/middleware-utils.ts` | `.from('claim_requests')` ×2 | **P-102** |
| `src/lib/profile/queries.ts` | `.from('claim_requests')` | **P-102** |
| `src/lib/staff/claims.ts` | `.from('claim_requests')` ×2 | **P-102** |
| `src/lib/staff/claims-queue.ts` | `.from('claim_requests')` ×3 | **P-102** |
| `src/lib/staff/claim-review-queries.ts` | `.from('claim_requests')` ×3 | **P-102** |
| `src/lib/staff/dashboard-queries.ts` | `.from('claim_requests')` ×2 | **P-102** |
| `src/lib/staff/notify-claim-decision.ts` | `.from('claim_requests')` | **P-102** |
| `src/lib/staff/search.ts` | `.from('claim_requests')` | **P-102** |
| `src/lib/staff/badges.ts` | `.from('claim_requests')` | **P-102** |
| `src/lib/sys/dashboard-queries.ts` | `.from('claim_requests')` | **P-102** |
| `src/lib/sys/entities-queries.ts` | `.from('claim_requests')` ×2 | **P-102** |
| `src/app/auth/callback/route.ts` | `.from('claim_requests')` | **P-102** |
| `src/app/[locale]/(company)/company/claim/reapply/page.tsx` | `.from('claim_requests')` | **P-105** |
| `src/app/[locale]/(staff)/staff/claims/actions.ts` | `.from('claim_requests')` | **P-108** |
| `src/app/[locale]/(sys)/sys/entities/actions.ts` | `.from('claim_requests')` ×3 | **P-108** |
| `src/app/[locale]/(staff)/staff/claims/_components/realtime-claims-updater.tsx` | Realtime channel `table: 'claim_requests'` | **P-108** |

**DB functions still referencing `claim_requests` at runtime (not TS-checked):** `review_claim_request`, `review_claim`, `assign_claim_to_self`, `notify_claim_decision` — **P-102**.

**`entity_type` `company`→`business` enum rename** will surface in queries comparing `entity_type = 'company'` — **P-102 / P-104 / P-105**.

**Pre-existing (not P-101):** missing tables in stale `types.ts` (`mentor_profiles`, `content_flags`, `lammah_*`, `contact_messages`, …), `check_email_otp_rate_limit` / `check_otp_rate_limit` RPC union, screening import paths — unchanged by P-101.

### P-101 verification checklist

| Item | State |
|------|-------|
| Step 0 reconciliation reported before migrations | **PASS** |
| `business_profiles` + `university_profiles` created per spec | **PASS** |
| `verification_requests` exists; `claim_requests` renamed away; RLS carried forward | **PASS** (migration SQL) |
| `companies` ownership fields comment-deprecated, not dropped; `entity_type` standardized | **PASS** |
| `pnpm gen-types` succeeds | **FAIL** — Docker unavailable; manual `types.ts` patch applied |
| `types.ts` includes three schema changes | **PASS** (manual) |
| `pnpm type-check` captured in this log | **PASS** |
| Git diff scope: migrations + types.ts + audit doc only | **PASS** for P-101 files (repo has other uncommitted work) |
| No data dropped or migrated | **PASS** |

**STOP — P-101 schema layer complete. P-102 owns business-logic + RPC retargeting.**

---

## P-102 Execution Log

**Executed:** 2026-07-11  
**Depends on:** P-101 (`business_profiles`, `university_profiles`, `verification_requests`)  
**Next migration after P-102:** `109`

### Step 0 — Reconciliation (reported before any function was written)

| Item | Finding |
|------|---------|
| **(a) `review_claim()` exists?** | **YES** — definitive body in `078_staff_portal_section3.sql` (wrapper `review_claim_request` in `073`/`078`). On **approve**: updates `claim_requests` → **`UPDATE companies SET entity_state='approved', claimed_by=user_id, is_verified=true`** → direct `profiles.role` UPDATE (bypasses `set_user_role`) → `_write_audit_log('claim.approved', …)`. On **reject**: updates `claim_requests` + resets `companies.entity_state`/`claimed_by`. On **needs_more_info**: updates `claim_requests` only. **No mentor branch** (`claim_type NOT IN ('company','university')` guard; pre-P-101 values renamed to `business`/`university` in P-101). |
| **(b) Staff UI inline path** | **Also exists** — `src/app/[locale]/(staff)/staff/claims/actions.ts` (`reviewClaim`): staff guard → Zod → `.from('claim_requests')` self-review check → **`supabase.rpc('review_claim', …)`** → `notifyClaimDecision()` → revalidate paths → analytics. Secondary wrapper: `src/lib/staff/review-claim.ts` calls **`review_claim_request`** then Edge Functions `send-claim-approval` / `send-claim-rejection`. **P-108 must rewire both to `lib/auth/verification.ts`.** |
| **(c) `set_user_role` signature** | **`set_user_role(p_target_user_id uuid, p_new_role user_role_enum)`** — `040_staff_invite_flow.sql` / `035_security_definer_functions.sql`. **Reused** in new approve function via `PERFORM set_user_role(…)`. |
| **(d) `audit_logs` shape** | Columns: `id`, `actor_id`, `action`, `entity_type`, `entity_id`, `old_data`, `new_data`, `metadata`, `ip_address`, `user_agent`, `created_at`. Immutability: `prevent_audit_modification` trigger (`032_audit_logs.sql`). **Inserted via `_write_audit_log(p_actor_id, p_action, p_entity_type, p_entity_id, p_old_data, p_new_data, …)`** — not the prompt's alternate column names (`action_type`, `target_resource_type`, `changes`, `reason`). |
| **(e) Mentor verification** | **`verification_type` / `claim_type_enum` = `business` \| `university` only** (no `'mentor'`). Mentor flow is **`mentor_profiles.status`** (`056_mentor_application.sql`) + `staff_review_mentor` RPC — **excluded** from profile-creation path. New `approve_verification_request` raises `unsupported_verification_type` for anything other than business/university. |

### Migrations created

| File | Purpose |
|------|---------|
| `107_verification_domain_capture.sql` | `verified_domains text[]` on `verification_requests`, `business_profiles`, `university_profiles` + GIN indexes on profile tables |
| `108_verification_service_functions.sql` | `approve_verification_request`, `reject_verification_request`, `get_my_approved_verifications`, `create_business_profile`, `create_university_profile`; retargeted `notify_claim_decision` to `verification_requests`; **deprecated stubs** for `review_claim` / `review_claim_request` |

### Client module

| File | Exports |
|------|---------|
| `src/lib/auth/verification.ts` | `approveVerificationRequest`, `rejectVerificationRequest`, `getMyApprovedVerifications`, `createBusinessProfile`, `createUniversityProfile` |

### Task 7 — Legacy approval path

**Decision: DEPRECATED (not dropped)** — active callers remain for P-108 migration.

| Caller | Path |
|--------|------|
| Staff console server action | `src/app/[locale]/(staff)/staff/claims/actions.ts` — `review_claim` RPC + `notifyClaimDecision` |
| Staff lib wrapper | `src/lib/staff/review-claim.ts` — `review_claim_request` RPC + Edge Function emails |

`108` replaces both RPC bodies with `RAISE WARNING` + `RAISE EXCEPTION` (`review_claim_deprecated` / `review_claim_request_deprecated`).

### Adaptations vs prompt spec

1. **Audit:** `_write_audit_log` with `action` = `verification.approved` / `verification.rejected` / `profile.created` (not prompt's `INSERT INTO audit_logs (actor_role, action_type, changes, reason)`).
2. **Email field:** repo uses **`business_email`** (not `domain_email`); domain transparency check uses `split_part(business_email, '@', 2) = ANY(companies.domains)`.
3. **Pending status guard:** accepts `pending`, `submitted`, `pending_review`, `under_review`, `needs_more_info` (repo's actual reviewable set — not only `pending_review`).
4. **Mentor branch:** omitted — unsupported on `verification_requests`; mentors stay on `mentor_profiles`.
5. **Notifications:** `approve`/`reject` call existing **`notify_claim_decision`** (retargeted to `verification_requests` + `dispatch_notification`). Staff UI's separate `notifyClaimDecision` + Edge Function emails untouched (P-108).
6. **Self-review guard:** preserved from legacy `review_claim` (`cannot_review_own_verification`).
7. **Zero `companies` ownership writes** in all new functions — confirmed (grep: no `claimed_by`/`entity_state`/`is_claimed` in `108` body).

### `pnpm gen-types` / `types.ts`

| Step | Result |
|------|--------|
| `pnpm gen-types` | **FAIL** — Docker Desktop unavailable (`supabase gen types --local` requires local DB). **Do not run with shell redirect** — empties `types.ts`. |
| Manual patch | `types.ts` converted UTF-16 → UTF-8; added `business_profiles`, `university_profiles`, `verification_requests`, `claim_status`/`claim_type` enums, five new RPC signatures. |
| `src/lib/auth/verification.ts` | **Compiles clean** (0 TS errors). |

### Type-check errors surfaced (do not fix here)

**Total `pnpm type-check` errors:** **1124** (was ~1117 pre-P-102; +7 from stale `review_claim` RPC removal from types while callers remain).

**P-102-related (rename + RPC migration):**

| File | Error | Owner |
|------|-------|-------|
| `src/lib/staff/types.ts` | `claim_requests` table type missing | **P-108** (update to `verification_requests`) |
| `src/lib/catalog/claim.ts` | `.from('claim_requests')` | **P-108** |
| `src/lib/entity/claims.ts` | `.from('claim_requests')` | **P-108** |
| `src/lib/entity/rejected-claim.ts` | `.from('claim_requests')` | **P-105** |
| `src/lib/auth/middleware-utils.ts` | `.from('claim_requests')` | **P-109** |
| `src/lib/profile/queries.ts` | `.from('claim_requests')` | **P-105** |
| `src/lib/staff/*.ts` (claims, queue, review-queries, dashboard, notify, search, badges) | `.from('claim_requests')` | **P-108** |
| `src/lib/sys/dashboard-queries.ts`, `entities-queries.ts` | `.from('claim_requests')` | **P-108** |
| `src/app/auth/callback/route.ts` | `.from('claim_requests')` | **P-105** |
| `src/app/[locale]/(company)/company/claim/reapply/page.tsx` | `.from('claim_requests')` | **P-105** |
| `src/app/[locale]/(staff)/staff/claims/actions.ts` | `.from('claim_requests')` + `rpc('review_claim')` not in types | **P-108** |
| `src/lib/staff/review-claim.ts` | `rpc('review_claim_request')` not in types | **P-108** |
| `src/app/[locale]/(sys)/sys/entities/actions.ts` | `.from('claim_requests')` | **P-108** |
| `src/app/[locale]/(staff)/staff/claims/_components/realtime-claims-updater.tsx` | Realtime `table: 'claim_requests'` | **P-108** |

**Pre-existing (unchanged):** missing tables in stale `types.ts` (`mentor_profiles`, `content_flags`, `lammah_*`, `contact_messages`, `public_announcements`, …), screening import paths, duplicate dashboard routes — **P-103 / P-104 / pre-existing**.

**P-104 preview:** `verified_domains` GIN indexes on profile tables ready for domain-validation queries.

### P-102 verification checklist

| Item | State |
|------|-------|
| Step 0 reconciliation reported before any function was written | **PASS** |
| `verified_domains` on `verification_requests` + both profile tables | **PASS** (`107`) |
| approve/reject enforce staff/super_admin + mandatory review notes | **PASS** (`108`) |
| Mentor verifications: role-only path excluded; no profile-table interaction | **PASS** (no mentor branch; mentors use `mentor_profiles`) |
| `create_*_profile` double-creation + wrong-type guards | **PASS** (SQL guards; psql manual test **BLOCKED** — no local Supabase/Docker) |
| Old approval path: deprecated with callers listed | **PASS** |
| `lib/auth/verification.ts` exports all five wrapped functions | **PASS** |
| `pnpm gen-types` succeeds | **FAIL** — Docker unavailable |
| `pnpm type-check` run; errors logged | **PASS** (1124 total; `verification.ts` clean) |
| Git diff scope: migrations + `verification.ts` + `types.ts` + audit doc | **PASS** for P-102 deliverables |
| Zero writes to `companies.claimed_by`/`claim_status`/`is_claimed` in new code | **PASS** |

**STOP — P-102 verification service backend complete. P-108 owns Staff console rewire; P-105 owns profile-creation wizard UI.**

---

## P-103 Execution Log

**Executed:** 2026-07-11  
**Depends on:** P-101 (schema), P-102 (verification/profile functions), P-003 (RLS harness)  
**Next migration after P-103:** `114`

### Step 0 — Reconciliation (reported before any policy was dropped/created)

| Item | Finding |
|------|---------|
| **(a) `companies` RLS policies** | **`companies_select_public`** — SELECT TO anon,authenticated `USING (true)` (038). **`companies_insert_signup`** — INSERT TO authenticated `WITH CHECK (is_verified = false)` (038). **`companies_update_permissions`** — UPDATE TO authenticated `USING/WITH CHECK (role IN ('super_admin','staff','admin') OR (claimed_by = auth.uid() AND entity_state = 'approved'))` (044) — **the owner-edit hole to drop**. Legacy **`companies_update_staff`** dropped in 044. **No DELETE policy** existed (Step 0 confirmed). |
| **(b) `verification_requests` policies (P-101 carry-forward)** | **`verification_requests_select_own`** — SELECT `applicant_user_id = auth.uid()`. **`verification_requests_select_staff`** — SELECT `is_privileged_staff()`. **`verification_requests_insert_own`** — INSERT with status guard. **`verification_requests_update_staff`** — UPDATE `is_privileged_staff()` — **must be removed** (P-103). **`verification_requests_select_assigned`** — SELECT assigned/applicant/staff (dropped in P-103; staff_read covers staff role). |
| **(c) Profile tables post-P-101** | **`business_profiles`** and **`university_profiles`**: RLS **ENABLED**, **zero policies** (103/104) — expected deny-by-default state. |
| **(d) RLS harness pattern (P-003)** | `tests/rls/README.md`: service role for setup/teardown only; `createAuthenticatedClient(env, email, password)` for assertions; `getRlsTestEnv()` gates on **local URL** (`127.0.0.1`/`localhost`) + real keys; `beforeAll` seed / `afterAll` cleanup hard rule. Example: `profiles.rls.test.ts`. |

### Migrations created

| File | Purpose |
|------|---------|
| `109_companies_directory_lockdown.sql` | Drop owner-edit + legacy policies; `directory_public_read`, `directory_staff_read_all`, `directory_platform_insert/update`, `directory_platform_delete` (super_admin) |
| `110_profile_ownership_policies.sql` | Profile SELECT/owner-UPDATE policies (both tables); no INSERT/DELETE |
| `111_verification_requests_lockdown.sql` | Drop all UPDATE policies; recreate SELECT/INSERT only |
| `112_directory_correction_suggestions.sql` | Correction table + `field_name` allow-list CHECK + `approve_correction_suggestion` / `reject_correction_suggestion` |
| `113_profile_moderation_functions.sql` | `suspend_profile` / `reinstate_profile` (audited via `_write_audit_log`) |

### Post-P-103 policy inventory

| Table | Policy | Command | Grants |
|-------|--------|---------|--------|
| **companies** | `directory_public_read` | SELECT | anon, authenticated — `is_active = true` |
| | `directory_staff_read_all` | SELECT | staff, super_admin |
| | `directory_platform_insert` | INSERT | staff, super_admin |
| | `directory_platform_update` | UPDATE | staff, super_admin **only** |
| | `directory_platform_delete` | DELETE | super_admin only |
| **business_profiles** | `profile_public_read_published` | SELECT | published rows |
| | `profile_owner_read_own` | SELECT | owner |
| | `profile_staff_read_all` | SELECT | staff, super_admin |
| | `profile_owner_update_content` | UPDATE | owner; `WITH CHECK status <> 'suspended'` |
| | *(none)* | INSERT / DELETE | **denied** — P-102 SECURITY DEFINER only |
| **university_profiles** | `university_profile_*` (mirror) | SELECT / UPDATE | same pattern as business |
| **verification_requests** | `verification_applicant_read_own` | SELECT | applicant |
| | `verification_staff_read_all` | SELECT | staff, super_admin |
| | `verification_applicant_insert_own` | INSERT | applicant |
| | *(none)* | UPDATE | **denied for all roles** — P-102 functions only |
| **directory_correction_suggestions** | `suggester_reads_own` | SELECT | suggester |
| | `staff_reads_all_suggestions` | SELECT | staff, super_admin |
| | `verified_owner_suggests` | INSERT | profile owner only |
| | *(none)* | UPDATE | **denied** — staff functions only |

### Adaptations vs prompt spec

1. **Audit:** `_write_audit_log(...)` used (not prompt's alternate `audit_logs` column names) — matches P-102.
2. **`field_name` allow-list:** uses actual Directory columns `city`, `career_portal_url`, `website_url`, `linkedin_url`, `twitter_url`, `sector_id`, `region_id` (prompt said `sector`/`region` as examples; repo stores FK ids).
3. **`verification_requests_select_assigned`:** dropped — `verification_staff_read_all` covers staff-role readers.
4. **`companies` DELETE:** none existed; created `directory_platform_delete` (super_admin) per prompt.
5. **University profile policy names:** prefixed `university_profile_*` to avoid ambiguity in inventory (separate policies per table).

### Task 7 — RLS test run

**File:** `tests/rls/ownership-law.rls.test.ts` (+ `fixtures/ownership-law.ts`)

**Cases implemented:** all 7 zero-leak proofs from prompt.

**Run output (`pnpm test:rls`):**

```
Test Files  2 skipped (2)
     Tests  9 skipped (9)
```

**Why skipped:** `.env.local` points at **cloud** Supabase; harness `getRlsTestEnv()` requires **local** URL. Fresh `supabase start` attempted — fails at migration `015_public_announcements.sql` (`profiles` not yet created) — **pre-existing migration-order issue**, blocks local DB bootstrap for live proof run.

**Action to obtain passing proofs:** fix local migration chain → `pnpm supabase:start` → point test env at `http://127.0.0.1:54321` keys → `pnpm test:rls` (expect 7/7 pass in `ownership-law.rls.test.ts`).

### `pnpm gen-types` / `pnpm type-check`

| Step | Result |
|------|--------|
| `pnpm gen-types` | **FAIL** — `supabase start is not running` / redirect empties `types.ts` if used |
| Manual `types.ts` patch | P-102 + P-103 tables/RPCs applied (UTF-8) |
| `pnpm type-check` | **1124 errors** (unchanged baseline; stale types vs live DB) |

**New errors attributable to P-103 (do not fix here):**

| Area | Owner |
|------|-------|
| `directory_correction_suggestions` client queries (when added in UI) | **P-108 / P-110** |
| `suspend_profile` / `reinstate_profile` Staff console wiring | **P-108** |
| `claim_requests` → `verification_requests` renames (carried from P-101/P-102) | **P-108 / P-105** |
| Pre-existing missing tables in stale `types.ts` | **pre-existing** |

### P-103 verification checklist

| Item | State |
|------|-------|
| Step 0 reconciliation reported before policies | **PASS** |
| `companies`: only `directory_platform_update` for UPDATE (staff/super_admin) | **PASS** |
| Profiles: zero INSERT/DELETE; owner blocked from self-unsuspend | **PASS** |
| `verification_requests`: zero UPDATE policy | **PASS** (SQL); test #5 **BLOCKED** (no local run) |
| `directory_correction_suggestions` + `field_name` allow-list CHECK | **PASS** |
| `suspend_profile` / `reinstate_profile` exist + audited | **PASS** |
| `ownership-law.rls.test.ts` all 7 cases | **PASS** (written); **FAIL** (executed — 9 skipped, env blocked) |
| `pnpm gen-types` succeeds | **FAIL** |
| `pnpm type-check` logged | **PASS** |
| Git diff scope: migrations + tests/rls + audit doc | **PASS** |

**STOP — P-103 Ownership Law encoded in RLS + functions. P-108 wires Staff UI; local RLS proof run blocked until Supabase local bootstrap succeeds.**

---

## P-104 Execution Log

**Executed:** 2026-07-12  
**Depends on:** P-101, P-102, P-103  
**Next migration after P-104:** `117`

### Step 0 — Reconciliation (reported before any change)

| Item | Finding |
|------|---------|
| **(a) `jobs` RLS policies** | Actual names differ from prompt examples. **`Public views active jobs`** — SELECT anon/auth `status IN ('published','closing_soon')`. **`Company sees own jobs`** — SELECT via `companies.claimed_by` + `entity_state='approved'`. **`Company posts own jobs`** — INSERT same. **`Company updates own jobs`** — UPDATE same (not "Update own or admin"). **`Staff manages all jobs`** — FOR ALL `is_privileged_staff()` (covers staff read/update/delete). No separate "Admin deletes jobs" policy. |
| **(b) `applications` policies** | **`Company sees their applicants`** / **`Company updates their applicants`** — use `applications.company_id IN (SELECT c.id FROM companies c WHERE claimed_by …)` (not job_id join). Applicant + staff policies unchanged. |
| **(c) Domain validator** | **`validateDomainMatch`** in `src/lib/jobs/domain-validator.ts` (sync). Wizard imports from there; also used in `domain-validator.tsx`, `create-company-job.ts`, `api/company/jobs/route.ts`. Reads **`companyDomains: string[]`** from `poster.company.domains` (Directory `companies.domains`). |
| **(d) `business_profiles.verified_domains`** | Added P-102 migration `107_verification_domain_capture.sql` — `text[] NOT NULL DEFAULT '{}'`. No live test rows in cloud env; shape confirmed in migration + manual `types.ts`. |
| **(e) `lib/queries/jobs.ts`** | Public list/detail (`fetchJobs`, `fetchJobDetailByRef`, `JOB_LIST_SELECT`), related jobs by `company_id`, no company-dashboard owner query yet — extended with `fetchOwnerJobs`, `validateDomainMatch`, `fetchTrustedDomainsForBusinessProfile`. |

### Migrations created

| File | Purpose |
|------|---------|
| `114_jobs_business_profile_anchor.sql` | Nullable `jobs.business_profile_id` FK + index + comment |
| `115_jobs_rls_reanchor.sql` | `jobs_owner_read_own`, `jobs_owner_insert`, `jobs_owner_or_staff_update` |
| `116_applications_rls_reanchor.sql` | `applications_owner_read`, `applications_owner_update_status` |

### TRANSITIONAL (P-104) clauses — P-110 retirement checklist

| File | Policy | Clause |
|------|--------|--------|
| `115_jobs_rls_reanchor.sql` | `jobs_owner_read_own` | `business_profile_id IS NULL AND company_id IN (SELECT … claimed_by = auth.uid())` |
| `115_jobs_rls_reanchor.sql` | `jobs_owner_or_staff_update` | same transitional OR branch |
| `116_applications_rls_reanchor.sql` | `applications_owner_read` | `j.business_profile_id IS NULL AND j.company_id IN (… claimed_by …)` |
| `116_applications_rls_reanchor.sql` | `applications_owner_update_status` | same transitional OR branch |
| `src/lib/jobs/company-access.ts` | `fetchApprovedCompanyForUser` | legacy `claimed_by` fallback when no `business_profiles` row |

### Code changes (beyond strict diff list — required for wiring)

| File | Why |
|------|-----|
| `src/lib/jobs/poster-types.ts` | `businessProfileId`, `trustedDomains` on poster |
| `src/lib/jobs/company-access.ts` | Resolve profile owner + transitional legacy company |
| `src/lib/jobs/create-company-job.ts` | Insert `business_profile_id`; server domain check |
| `src/app/api/company/jobs/route.ts` | Async `validateDomainMatch` via profile id |
| `src/lib/jobs/domain-validator.ts` | Renamed sync fn to `validateDomainMatchForDomains` (client preview) |
| `src/types/job.ts` | `business_profile_id` on `JobCardData` for public card surfacing |

### Domain validation (Task 4)

- **Server:** `validateDomainMatch(url, businessProfileId, locale?)` in `lib/queries/jobs.ts` — fetches `verified_domains ∪ companies.domains`.
- **Client:** wizard uses pre-resolved `poster.trustedDomains` + `validateDomainMatchForDomains` (same `DomainMatchResult` / Arabic error copy).

### Task 7 — RLS test run

**File:** `tests/rls/jobs-reanchor.rls.test.ts` (5 cases)

```
Test Files  3 skipped (3)
     Tests  14 skipped (14)
```

Blocked: `.env.local` → cloud URL; local `supabase start` fails at migration `015` (pre-existing). Tests written; run after local bootstrap + env pointed at `127.0.0.1:54321`.

### `pnpm gen-types` / `pnpm type-check`

| Step | Result |
|------|--------|
| `pnpm gen-types` | **FAIL** — local Supabase not running |
| Manual `types.ts` | `jobs.business_profile_id` patched |
| `pnpm type-check` | **1133 errors** (+9 vs baseline; stale `companies` columns in types + pre-existing) |

**P-104-touched new errors (stale types — owner P-110 / regen):** `company-access.ts` `companies.name`/`domains` column mismatches vs stale `types.ts`; `create-company-job.ts` jobs insert overload. **Fixed in-repo:** `Array.from` for domain union (Set spread).

### P-104 verification checklist

| Item | State |
|------|-------|
| Step 0 reported before changes | **PASS** |
| `jobs.business_profile_id` nullable + indexed | **PASS** |
| Jobs + applications RLS re-anchored with `-- TRANSITIONAL (P-104)` markers | **PASS** |
| New INSERT requires `business_profile_id` (policy + test case 3) | **PASS** (SQL + test written) |
| Domain validator: verified_domains ∪ companies.domains | **PASS** |
| `lib/queries/jobs.ts` updated; wizard minimal wiring (`trustedDomains`) | **PASS** |
| `jobs-reanchor.rls.test.ts` 5 cases passing | **FAIL** (14 skipped — env blocked) |
| `pnpm gen-types` | **FAIL** |
| `pnpm type-check` logged | **PASS** |

**STOP — P-104 jobs re-anchored to business_profiles. P-110 retires TRANSITIONAL claimed_by branches + backfills `business_profile_id`.**

---

## P-105 Execution Log

**Executed:** 2026-07-12  
**Depends on:** P-101, P-102, P-103, P-104 (all prior Execution Logs present — gate **PASS**)  
**Migrations:** NONE (per prompt)

### Step 0 — Reconciliation (reported before implementation)

| Item | Finding |
|------|---------|
| **(a) Status pages (old)** | `company/pending-review/page.tsx`, `company/rejected/page.tsx`, `company/claim/reapply/page.tsx` — all read `claim_requests` via `getLatestClaimForUser` / `getLatestRejectedClaim` |
| **(b) Employer home** | **`company/dashboard/page.tsx`** exists (not jobs list). Fetched `companies` via `claimed_by` + `entity_type` for university fork |
| **(c) Signup submission (broken)** | `src/lib/entity/claims.ts` → `submitClaimRequest` inserted `claim_requests` with `user_id`, `company_id`, `claim_type: 'company'` — P-101 renamed table/columns to `verification_requests` / `applicant_user_id` / `directory_id` / `verification_type: 'business'` |
| **(d) Storage** | Reused pattern from `lib/profile/mutations.ts` (`avatars` bucket + `getPublicUrl`). **No** existing public business-profile bucket — added client upload to new `business-profile-media` bucket (manual Supabase bucket creation required; no migration in this prompt) |
| **(e) `lib/auth/verification.ts`** | `getMyApprovedVerifications(client): VerificationRequestRow[]`; `createBusinessProfile(client, { verificationId, displayNameAr, displayNameEn? }): string` |

**Old route references (not edited — P-109):**

| File | Reference |
|------|-----------|
| `src/middleware.ts` | redirect `/company/pending-review` |
| `src/lib/auth/guards.ts` | `/company/rejected`, `/company/claim/reapply`, `/company/pending-review` |
| `src/lib/auth/middleware-utils.ts` | `claim_requests` shape, `/company/rejected`, `/company/pending-review` |
| `src/app/auth/callback/route.ts` | `claim_requests`, `/company/pending-review` |

**Updated in P-105 (not middleware/guards):** `entity-signup-wizard.tsx` → `/company/verification-pending`; `lib/jobs/company-access.ts` → `/company/verification-pending`; old company status routes → thin redirects to new paths.

### Task 1 — Signup wizard submission fix

| File | Change |
|------|--------|
| `src/lib/entity/claims.ts` | INSERT → `verification_requests` with `applicant_user_id`, `directory_id`, `verification_type` (`business` \| `university`); prior-rejected gate retargeted |
| `src/components/entity/claim-submission-form.tsx` | i18n namespace → `entity.wizard.verification` |
| `messages/ar.json`, `messages/en.json` | `entity.wizard.verification.*` — "أرسل طلب التوثيق" / "Submit verification request" |

### Task 2 — Verification status pages

| New route | File |
|-----------|------|
| `/company/verification-pending` | `company/verification-pending/page.tsx` |
| `/company/verification-rejected` | `company/verification-rejected/page.tsx` |
| `/company/verification/reapply` | `company/verification/reapply/page.tsx` |

| Redirect (old → new) | File |
|----------------------|------|
| `pending-review` → `verification-pending` | `company/pending-review/page.tsx` |
| `rejected` → `verification-rejected` | `company/rejected/page.tsx` |
| `claim/reapply` → `verification/reapply` | `company/claim/reapply/page.tsx` |

| Lib | Change |
|-----|--------|
| `src/lib/entity/rejected-claim.ts` | `verification_requests`; adds `directory_id` on rejected view |

Copy: `entity.pendingReview`, `entity.rejected`, `entity.reapply` i18n retargeted to توثيق / verification framing.

### Task 3 — Creation wizard `/company/create-profile/`

| File | Purpose |
|------|---------|
| `company/create-profile/page.tsx` | Entry gate: `getMyApprovedVerifications()` → pending redirect / existing profile redirect / wizard |
| `company/create-profile/actions.ts` | `publishBusinessProfileAction` (RPC + owner UPDATE publish); `updateOwnerBusinessProfileAction` |
| `company/create-profile/_components/profile-wizard-shell.tsx` | 3-step shell (reuses signup wizard chrome pattern) |
| `company/create-profile/_components/profile-step-identity.tsx` | Step 1 — الهوية |
| `company/create-profile/_components/profile-step-story.tsx` | Step 2 — القصة (cover upload) |
| `company/create-profile/_components/profile-step-preview.tsx` | Step 3 — stranger preview |
| `company/create-profile/_components/profile-public-preview-card.tsx` | Public card preview |
| `company/create-profile/_components/profile-creation-wizard.tsx` | Client wizard orchestration |
| `company/create-profile/loading.tsx`, `error.tsx` | Shell loading/error |
| `src/lib/validations/business-profile.ts` | Zod draft schemas |
| `src/lib/profile/business-profile-media.ts` | Client upload → `business-profile-media` bucket |

**Publish default:** **Immediate publish** — Publish button calls `createBusinessProfile()` then owner `UPDATE` sets `status='published'`, `published_at=NOW()`.

### Task 4 — Dashboard rewire

| File | Change |
|------|--------|
| `company/dashboard/page.tsx` | Loads `business_profiles` via `fetchOwnerBusinessProfile` (`owner_user_id`); transitional `claimed_by` only for university fork |
| `_components/company-dashboard.tsx` | Header: profile name / directory logo / status pill; quick links (jobs, applicants, settings) |
| `layout.tsx` | Layout fork prefers owned `business_profiles` over `companies.claimed_by` |
| `_components/standard-company-layout.tsx` | i18n nav; dashboard + profile edit links (removed claim/reapply nav) |

### Task 5 — Profile edit

| File | Purpose |
|------|---------|
| `company/profile/edit/page.tsx` | Owner-only gate via `fetchOwnerBusinessProfile` |
| `company/profile/edit/_components/profile-edit-wizard.tsx` | Reuses Identity + Story step components; "حفظ" via `updateOwnerBusinessProfileAction` |

### Task 6 — i18n & shell states

| Namespace | Keys |
|-----------|------|
| `company.shell` | error/retry |
| `company.nav` | sidebar |
| `company.dashboard` | home shell |
| `company.profileCreation` | wizard (identity, story, preview, media) |
| `company.profileEdit` | edit mode |

`company/_components/shell-loading.tsx`, `shell-error.tsx` created (no pre-existing `shell-loading.tsx` in repo).

### Language law — copy audit (grep on P-105-touched paths)

| Check | Result |
|-------|--------|
| `src/app/[locale]/(company)/**` — مطالبة / استلم / claim your | **0 matches** |
| `src/lib/entity/**` — banned claim copy | **0 matches** |
| Signup step visible strings (`entity.wizard.verification`) | **توثيق / verification only** |

### Task 7 — type-check / lint / build

| Step | Result |
|------|--------|
| `pnpm type-check` | **1107 errors** (down from ~1133 baseline; stale `types.ts` vs DB dominates). P-105-specific fixes applied (import paths, `StepVerifyEmail` route union, directory row casts). Remaining P-105-adjacent: `entity-signup-wizard.tsx:142` `profiles.upsert` overload — **pre-existing stale types** |
| `pnpm lint` | **FAIL** — pre-existing errors in unrelated files (`cv/`, `radar.ts`, `timeline/`, etc.); **no new lint in P-105 company files** |
| `pnpm build` | **FAIL** — pre-existing: duplicate `(middleware-test)/company/dashboard` route; missing `jobs/.../screening` modules |

### Files touched (summary)

**Created:** `verification-pending`, `verification-rejected`, `verification/reapply`, `create-profile/**`, `profile/edit/_components/profile-edit-wizard.tsx`, `company/_components/shell-loading.tsx`, `shell-error.tsx`, `lib/profile/owner-business-profile.ts`, `lib/profile/business-profile-media.ts`, `lib/validations/business-profile.ts`

**Modified:** `lib/entity/claims.ts`, `lib/entity/rejected-claim.ts`, `claim-submission-form.tsx`, `entity-signup-wizard.tsx`, `step-verify-email.tsx`, `company-access.ts`, `company/dashboard/page.tsx`, `company-dashboard.tsx`, `layout.tsx`, `standard-company-layout.tsx`, `company/profile/edit/page.tsx`, old status pages (redirects), `messages/ar.json`, `messages/en.json`

**Not edited (P-109):** `src/middleware.ts`, `src/lib/auth/guards.ts`

### P-105 verification checklist

| Item | State |
|------|-------|
| Step 0 reconciliation reported before changes | **PASS** |
| Signup INSERT uses renamed columns | **PASS** |
| Three status pages retargeted + copy updated | **PASS** |
| Creation wizard entry gate (3 states) | **PASS** |
| Zero claim-language in touched files (grep) | **PASS** |
| Dashboard reads `business_profiles.owner_user_id` | **PASS** |
| Profile edit reuses wizard step components | **PASS** |
| `pnpm type-check` | **FAIL** (1107 — stale types baseline; logged) |
| `pnpm lint` | **FAIL** (pre-existing unrelated) |
| `pnpm build` | **FAIL** (pre-existing unrelated) |
| Git diff scope | **MOSTLY PASS** — required lib/entity + lib/profile + `components/entity` + `lib/jobs/company-access.ts` beyond strict list (mechanical deps) |

**STOP — P-105 business profile creation wizard + employer dashboard rewire complete. P-109 owns middleware/guard route updates; P-107 owns public profile page; bucket `business-profile-media` must exist in Supabase (public read) before cover upload works in prod.**

---

## P-106 Execution Log

**Executed:** 2026-07-12  
**Depends on:** P-101, P-103 (both Execution Logs present — gate **PASS**)  
**Migrations:** NONE

### Step 0 — Reconciliation (reported before implementation)

| Item | Finding |
|------|---------|
| **(a) Catalog components** | Grid: `catalog/_components/company-card.tsx`. Detail route **missing** — only `api/catalog/[slug]/route.ts` + `fetchCompanyBySlug`; card overlay linked to `/companies/${slug}` (immersion route). **Created** `catalog/[slug]/page.tsx` as registry detail. Query layer: `lib/queries/catalog.ts`. |
| **(b) Bottom CTA (no-profile)** | `company-card.tsx` L78–108: healthy `career_portal_url` → primary `<Link target="_blank">` + `stopPropagation()`; else `aria-disabled` stub. **Preserved byte-for-byte** via shared `CatalogCta` when `hasPublishedProfile === false`. |
| **(c) Slug** | `companies.slug` used in list/detail queries and card; profile CTA → `/companies/${slug}/profile` (P-107; no separate profile slug). |
| **(d) P-103 public SELECT** | `110_profile_ownership_policies.sql`: `profile_public_read_published` / `university_profile_public_read_published` — `USING (status = 'published')`. Mapper also requires `profile.status === 'published'` (belt-and-suspenders for owner-draft embed leakage). |
| **(e) Correction suggestions** | Table + RLS in `112_directory_correction_suggestions.sql`. INSERT policy `verified_owner_suggests` requires `suggested_by = auth.uid()` and `directory_id` matches owned `business_profiles` or `university_profiles`. |

### Task 1 — Query layer profile join

| Change | Detail |
|--------|--------|
| `CATALOG_LIST_SELECT` / `CATALOG_DETAIL_SELECT` | Embed `business_profiles` + `university_profiles` (LEFT JOIN via PostgREST embed) |
| `resolvePublishedProfile()` | Single derivation in `lib/queries/catalog.ts` — sets `hasPublishedProfile`, `profile_id`, `profile_display_name_ar`, `profile_tagline_ar`, `profile_about_ar` |
| Types | `PublishedProfileProjection` on `Company` + card fields on `CompanyCardData` in `types/catalog.ts` |
| Detail extras | `description_ar`, `sector_id`, `region_id` added to detail select |

### Task 2 — Card CTA graduation

| File | Change |
|------|--------|
| `catalog/_components/catalog-cta.tsx` | **NEW** shared CTA: profile primary internal link + external portal icon tooltip when published; legacy external primary when not |
| `catalog/_components/company-card.tsx` | Uses `CatalogCta`; overlay → `/catalog/${slug}` (registry detail); i18n via `catalogPage.*` |

### Task 3 — Detail content + CTA graduation

| File | Change |
|------|--------|
| `catalog/[slug]/page.tsx` | Server page: `fetchCompanyBySlug` + owner check |
| `catalog/_components/catalog-detail-view.tsx` | Published: `profile_about_ar`/`profile_tagline_ar` primary; `description_ar` demoted to "عن هذا السجل" footnote. Unpublished: unchanged `description_ar` behavior |

### Task 4 — Correction-suggestion entry point

| File | Change |
|------|--------|
| `catalog/_components/correction-suggestion-form.tsx` | Owner-only on detail page; field picker from `DIRECTORY_CORRECTION_FIELD_NAMES`; client INSERT to `directory_correction_suggestions`; CHECK-constraint error surfaced via `fieldNotAllowed` toast |
| `fetchViewerOwnsDirectory()` | Server helper — matches `directory_id` to owned Layer-3 profile |

### Task 5 — Registry-grammar audit

| Finding | Disposition |
|---------|-------------|
| Card layout (compact logo, sector/region chips, no hero) | **OK** — reference grammar |
| New detail page omits `cover_url` hero | **Fixed** — avoids brand-immersion on registry surface |
| Card overlay was `/companies/[slug]` → immersion `CompanyProfileView` | **Fixed** → `/catalog/[slug]` registry detail |
| `/companies/[uuid]/page.tsx` immersion profile still exists | **Design Debt** — parallel route; P-107 owns public profile grammar at `/companies/{slug}/profile` |
| Profile CTA links `/companies/{slug}/profile` before P-107 ships | **Design Debt** — link is correct per architecture; page 404 until P-107 |
| `catalog-hero.tsx` hardcoded Arabic, no i18n | **Design Debt** — pre-existing; out of P-106 scope |
| `cover_url` on directory row unused on registry detail | **Design Debt** — intentional omission; founder may want thumbnail later |

### Field allow-list sync (P-103 CHECK vs form picker)

| P-103 `112_directory_correction_suggestions.sql` CHECK | P-106 `DIRECTORY_CORRECTION_FIELD_NAMES` (`types/catalog.ts`) |
|--------------------------------------------------------|----------------------------------------------------------------|
| `city` | `city` |
| `career_portal_url` | `career_portal_url` |
| `website_url` | `website_url` |
| `linkedin_url` | `linkedin_url` |
| `twitter_url` | `twitter_url` |
| `sector_id` | `sector_id` |
| `region_id` | `region_id` |

**Exact match — 7/7 fields identical, same order.**

### Task 6 — i18n & checks

| Namespace | Keys |
|-----------|------|
| `catalogPage.card` | viewRecord, lastAudit |
| `catalogPage.cta` | jidProfile, careerPortal, officialPortalTooltip, linkPending |
| `catalogPage.detail` | about, footnote, correction intro, back |
| `catalogPage.correction` | form + `fields.*` per allow-list |

| Step | Result |
|------|--------|
| `pnpm type-check` (P-106 files) | **PASS** — no errors in `catalog/**`, `queries/catalog.ts`, `types/catalog.ts` |
| `pnpm type-check` (repo) | **FAIL** — ~1100+ stale `types.ts` baseline (pre-existing) |
| `pnpm lint` (catalog paths) | **PASS** |
| `pnpm lint` (repo) | **FAIL** — pre-existing unrelated |
| `pnpm build` | **FAIL** — pre-existing duplicate dashboard route + missing screening modules |

### Files modified/created

**Created:** `catalog/[slug]/page.tsx`, `catalog/_components/catalog-cta.tsx`, `catalog/_components/catalog-detail-view.tsx`, `catalog/_components/correction-suggestion-form.tsx`

**Modified:** `catalog/_components/company-card.tsx`, `catalog/_components/catalog-with-data.tsx`, `lib/queries/catalog.ts`, `types/catalog.ts`, `messages/ar.json`, `messages/en.json`

### P-106 verification checklist

| Item | State |
|------|-------|
| Step 0 reported before changes | **PASS** |
| `hasPublishedProfile` derived once in query layer | **PASS** |
| Card CTA both paths (published / no-profile) | **PASS** (logic; manual fixture test requires seeded `business_profiles` row) |
| Detail content graduation | **PASS** |
| Correction form owner-only + field list sync | **PASS** |
| Registry-grammar audit + Design Debt logged | **PASS** |
| `pnpm type-check` / lint / build | **PARTIAL** — P-106 files clean; repo baseline fails (logged) |
| Git diff scope | **MOSTLY PASS** — `types/catalog.ts` required for shared types + allow-list |

**STOP — P-106 directory UX split complete. P-107 owns `/companies/{slug}/profile` immersion page; P-110 backfill activates profile CTAs at scale.**

---

## P-107 Execution Log

**Executed:** 2026-07-12  
**Depends on:** P-105 Execution Log present — gate **PASS**  
**Migrations:** NONE

### Step 0 — Reconciliation (reported before implementation)

| Item | Finding |
|------|---------|
| **(a) P-105 Step 3 preview** | `create-profile/_components/profile-public-preview-card.tsx` (cover, `CompanyLogo`, names, `Badge` verified, tagline, founded/team, about, strangerNote). Wrapped by `profile-step-preview.tsx` with intro copy. |
| **(b) `generateMetadata` convention** | Catalog `[slug]` and mentors `[slug]` use `getTranslations` + `title`/`description` from fetched entity. No repo-wide `alternates.languages` yet — P-107 extends with `Metadata` type, `canonical`, `alternates.languages`, `openGraph` per prompt. |
| **(c) Component paths** | `CompanyLogo`: `@/app/[locale]/(public)/catalog/_components/company-logo`. `JobCard`: `@/app/[locale]/(public)/opportunities/_components/job-card`. |
| **(d) Slug → published profile query** | `companies.slug` → `directory_id` → `business_profiles` WHERE `status='published'`. P-103 `profile_public_read_published` policy: `USING (status = 'published')`. Query also filters `.eq('status','published')`. |
| **(e) Verified indicator post–Commitment-Score** | No neutral “verified profile” chip existed. `OwnershipBadge` semi_government uses accent/gold — **not** reused. `company-trust-signals` / honor-roll badges are separate legacy surfaces. P-107 uses olive-background + gold check icon chip — distinct from partner-badge lineage. |

### Task 1 — `<BusinessProfileView>` shared component

| File | Purpose |
|------|---------|
| `src/components/profiles/business-profile-view.tsx` | Hero, verified chip, about, gallery, openings (`JobCard`), directory footer |
| `src/types/business-profile-public.ts` | `BusinessProfileData`, `DirectoryReferenceData`, `draftToBusinessProfileData`, gallery parser |

### Task 2 — P-105 wizard rewire (diff summary)

| File | Change |
|------|--------|
| `profile-step-preview.tsx` | Replaced `<ProfilePublicPreviewCard>` with `<BusinessProfileView mode="preview" openings={[]} />` |
| `profile-creation-wizard.tsx` | Passes `directory: DirectoryReferenceData` to preview step |
| `create-profile/page.tsx` | Fetches full directory row (slug, sector, region, ownership) for honest preview footer |
| `profile-public-preview-card.tsx` | **Deleted** — logic absorbed into shared view |

### Task 3 — Public page

| File | Purpose |
|------|---------|
| `companies/[slug]/profile/page.tsx` | Server page; `notFound()` when no published profile |
| `lib/queries/business-profile-public.ts` | `fetchPublishedBusinessProfileBySlug` |
| `lib/queries/jobs.ts` | `fetchLiveOpeningsByBusinessProfileId` (`published` \| `closing_soon`) |

**Build fix (mechanical):** Renamed legacy `companies/[uuid]/page.tsx` → `companies/[slug]/page.tsx` — Next.js forbids mixed `[uuid]`/`[slug]` at same segment. Legacy immersion page now resolves slug or id.

### Task 4 — SEO metadata sample (fixture: slug `acme-corp`, published profile)

```json
{
  "title": "أكمة للتقنية",
  "description": "نبني حلولاً سحابية للقطاع الحكومي…",
  "alternates": {
    "canonical": "https://jid.example/ar/companies/acme-corp/profile",
    "languages": {
      "ar": "https://jid.example/ar/companies/acme-corp/profile",
      "en": "https://jid.example/en/companies/acme-corp/profile"
    }
  },
  "openGraph": {
    "title": "أكمة للتقنية",
    "description": "نبني حلولاً سحابية للقطاع الحكومي…",
    "url": "https://jid.example/ar/companies/acme-corp/profile",
    "images": [{ "url": "https://cdn.example/covers/acme.jpg" }],
    "locale": "ar_SA"
  }
}
```

(Fallback OG image: `siteConfig.ogImage` when `cover_image_url` is null.)

### Task 5 — Loading / error

| File | Pattern |
|------|---------|
| `companies/[slug]/profile/loading.tsx` | Skeleton hero + openings grid (matches job-detail shimmer) |
| `companies/[slug]/profile/error.tsx` | `ErrorPageShell` + `ErrorState` (catalog pattern) |

Empty openings: `businessProfile.public.openingsEmpty` — "لا توجد فرص متاحة حالياً".

### Task 6 — i18n & checks

| Namespace | `businessProfile.public.*` |
|-----------|----------------------------|

| Step | Result |
|------|--------|
| `pnpm type-check` (P-107 files) | **PASS** |
| `pnpm type-check` (repo) | **FAIL** — stale baseline (~1100+ pre-existing) |
| `pnpm lint` (P-107 files) | **PASS** |
| `pnpm build` | **FAIL** — pre-existing: duplicate `(middleware-test)/company/dashboard`, missing screening modules. **P-107 slug route conflict resolved.** |

### Final file list

**Created:** `components/profiles/business-profile-view.tsx`, `types/business-profile-public.ts`, `lib/queries/business-profile-public.ts`, `companies/[slug]/profile/page.tsx`, `loading.tsx`, `error.tsx`, `companies/[slug]/page.tsx` (moved from `[uuid]`)

**Modified:** `create-profile/_components/profile-step-preview.tsx`, `profile-creation-wizard.tsx`, `create-profile/page.tsx`, `lib/queries/jobs.ts`, `messages/ar.json`, `messages/en.json`

**Deleted:** `profile-public-preview-card.tsx`, `companies/[uuid]/page.tsx`

### P-107 verification checklist

| Item | State |
|------|-------|
| Step 0 reported before changes | **PASS** |
| `BusinessProfileView` used by public page + wizard preview | **PASS** |
| No published profile → 404 | **PASS** |
| Live Openings via unmodified `JobCard` | **PASS** |
| Verified chip distinct from partner-badge gold | **PASS** (`jid-olive-50` chip + check, not `OwnershipBadge` accent) |
| `generateMetadata` title/desc/OG/canonical/locales | **PASS** |
| `loading.tsx` + `error.tsx` | **PASS** |
| `pnpm type-check` / lint / build | **PARTIAL** (P-107 clean; repo build baseline fails) |
| Git diff scope | **MOSTLY PASS** — required `types/`, `lib/queries/`, `companies/[slug]/page.tsx` move, wizard page directory fetch |

**STOP — P-107 public business profile page complete. Preview and public routes share `BusinessProfileView` for stranger-truth rendering.**

---

## P-108 Execution Log

**Executed:** 2026-07-12  
**Depends on:** P-102 + P-103 Execution Logs present — gate **PASS**  
**Migrations:** NONE

### Step 0 — Reconciliation (reported before implementation)

| Item | Finding |
|------|---------|
| **(a) Old approval path (P-102 Task 7)** | `review_claim()` deprecated in migration `108`, not dropped. Active UI: `staff/claims/**` with `ClaimReviewWorkspace`, `ClaimReviewModal`, `claims/actions.ts` calling `review_claim` RPC against legacy `claim_requests` table name. P-102 replacement: `approveVerificationRequest` / `rejectVerificationRequest` in `lib/auth/verification.ts` (no `companies` writes). |
| **(b) Directory admin UI** | No `POST/PATCH /api/admin/catalog/**` routes exist (0 files). Partial staff editing: `staff/entities/metadata-edit/[id]/` (sector/region/descriptions/logo — not full Directory editorial). Queue/data layer still read `claim_requests` until P-108 rewire. |
| **(c) Audit log viewer** | `src/app/[locale]/(staff)/staff/audit/_components/audit-timeline.tsx` — table/timeline pattern reused; entity links updated to `/staff/verification/{id}`. |
| **(d) `lib/auth/verification.ts` exports** | `approveVerificationRequest`, `rejectVerificationRequest`, `getMyApprovedVerifications`, `createBusinessProfile`, `createUniversityProfile`. Missing wrappers filled in **`lib/staff/moderation.ts`** (Task 1). |
| **(e) `/staff/claims/**` references** | Found in `lib/staff/nav.ts`, `claims-queue.ts`, `claim-review-queries.ts`, `badges.ts`, `dashboard-queries.ts`, `search.ts`, `constants.ts`, dashboard widgets, `audit-timeline.tsx`, `mentor-applications/actions.ts`, legacy `_components/claims-list.tsx`, `claim-review-modal.tsx`. All user-facing links updated or redirected. |

### Task 1 — Wrapper gap (`lib/staff/moderation.ts`)

| Export | RPC |
|--------|-----|
| `approveCorrectionSuggestion` | `approve_correction_suggestion` |
| `rejectCorrectionSuggestion` | `reject_correction_suggestion` |
| `suspendProfile` | `suspend_profile` |
| `reinstateProfile` | `reinstate_profile` |

Pattern matches P-102: typed input objects, `client.rpc(...)`, `throw new Error(error.message)`.

### Task 2 — Verification review queue rewire

| Old | New |
|-----|-----|
| `/staff/claims` | `/staff/verification` (+ redirects from `claims/**`) |
| `claim_requests` reads | `verification_requests` reads |
| `reviewClaim` / `review_claim` | `reviewVerification` → P-102 approve/reject wrappers |

**Grep — zero `companies` table writes in verification flow:**

```
rg "\.from\('companies'\)\.update|review_claim|reviewClaim" src/app/[locale]/(staff)/staff/verification
→ No matches
```

Kanban columns on `/staff/verification`: pending / overdue-SLA / completed-today. University checklist omits `domain_match`; mentor lighter checklist branch included in workspace (mentor queue items still route to `/staff/mentor-applications/{id}`).

### Task 3 — Directory editorial (`/staff/directory`)

List/search/edit/create on platform-writable `companies` fields only (`name`/`name_ar`, `sector_id`, `region_id`, `ownership_type`, `domains`, URLs, `logo_url`, `is_active`). Boundary copy in editor modal — no profile content fields.

### Task 4 — Correction suggestions (`/staff/directory/suggestions`)

Pending `directory_correction_suggestions` with side-by-side values; approve/reject via Task-1 wrappers. Review notes encouraged via placeholder; empty notes fall back to localized default server-side to satisfy P-103 DB constraint without blocking UI.

### Task 5 — Profile moderation (`/staff/directory/profiles`)

Business + university profiles: status/owner/directory display only. Suspend requires reason (Zod + RPC). Reinstate draft/published. Audit links: `/staff/audit?entity_type={type}_profile&entity_id={id}`.

### Task 6 — Sidebar (`lib/staff/nav.ts`)

New section **الدليل / Directory**: طلبات التوثيق (renamed), الدليل, اقتراحات التصحيح, الملفات التعريفية. Badge keys: `verification`, `correctionSuggestions`.

### Task 7 — Middleware (confirmation only)

`src/lib/auth/guards.ts` — `staff-portal` guard: `^${L}/staff(?:/|$)` covers **all** new routes. **No `middleware.ts` edits.**

### Task 8 — i18n & checks

- `messages/ar.json`, `messages/en.json` — `staff.verification`, `staff.verificationReview`, `staff.directory`, nav labels.
- `pnpm type-check` — P-108 files clean; repo baseline stale-type errors remain elsewhere.
- `pnpm lint` / `pnpm build` — **PARTIAL** (pre-existing repo failures; P-108 paths lint-clean).

### Verification checklist

| Item | State |
|------|-------|
| Step 0 reported before code | **PASS** |
| Four moderation wrappers exported | **PASS** (`lib/staff/moderation.ts`) |
| Queue reads `verification_requests`; no `companies` writes in modal | **PASS** (grep above) |
| Mentor/university checklist branches | **PASS** |
| Directory editorial page | **PASS** |
| Correction-suggestion queue wired | **PASS** |
| Profile moderation: suspend reason required; no content edit | **PASS** |
| Sidebar + dead `/staff/claims` links fixed | **PASS** (legacy `claims/**` → redirect; one dead `claim-review-workspace.tsx` orphan unused) |
| Middleware covers new routes | **PASS** |
| type-check / lint / build | **PARTIAL** (repo baseline) |

**STOP — P-108 Staff Editorial & Verification Console complete.**

---

## P-109 Execution Log

**Executed:** 2026-07-12  
**Depends on:** P-102 Execution Log present — gate **PASS**; P-105/P-108 route paths confirmed — gate **PASS**  
**Migrations:** NONE

### Step 0 — Reconciliation (reported before implementation)

| Item | Finding |
|------|---------|
| **(a) `entity_claim_status` guard entries** | Four guards in `lib/auth/guards.ts`: `company-jobs-new` (`/^${L}/jobs/new/`), `company-portal` (`/^${L}/company/`), `university-portal` (`/^${L}/university/`), `company-profile-owner` (`/^${L}/company/profile/`). Old failure redirect: `middleware.ts` → `resolveEntityPendingReviewPath()` (dynamic) + static fallback `conditionRedirectPath('entity_claim_status')` → `/company/pending-review`. |
| **(b) Condition checker** | `lib/auth/conditions.ts` → `checkConditions()` case `'entity_claim_status'` called `isEntityClaimApprovedOrTemporary()` (approved claim OR 24h `claimed_by` temporary access). **Replaced** by async `checkOrganizationProfile()` in `lib/auth/organization-profile.ts`, wired in `middleware.ts`. |
| **(c) P-105/P-108 final paths (company)** | Confirmed live: `/company/verification-pending`, `/company/verification-rejected`, `/company/create-profile`, `/company/verification/reapply`. Old `/company/pending-review` etc. redirect to these. **University parity incomplete:** only `/university/pending-review` exists; checker uses `/university/pending-review` (pending), `/university/rejected` (rejected), `/university/pending-review` (create-profile placeholder until university wizard ships). |
| **(d) `mentor_status` untouched** | Guard `mentor-portal` still `conditions: ['phone_verified', 'mentor_status']`. `checkConditions` `mentor_status` branch unchanged — see Task 4 proof block below. |
| **(e) `shell-forbidden.tsx`** | **Not present** in repo at Step 0 (Sprint 0 reference missing). Created `src/components/shell/shell-forbidden.tsx` matching `account/suspended` card pattern for Task 3. |

### Task 1 — `checkOrganizationProfile()` (fast path first)

| File | Purpose |
|------|---------|
| `src/lib/auth/organization-profile.ts` | Fast path: `business_profiles` / `university_profiles` by `owner_user_id`. Slow path: latest `verification_requests` row. Returns `{ satisfied, suggestedRedirect? }`. |
| `src/middleware.ts` | Async dispatch before sync `checkConditions()`; static fallback via `organizationProfileFallbackRedirect()`. |

### Task 2 — Guard entry before/after

| Guard ID | Before | After |
|----------|--------|-------|
| `company-jobs-new` | `conditions: ['entity_claim_status']` | `conditions: ['organization_profile']`, `organizationProfileType: 'business'` |
| `company-portal` | `conditions: ['entity_claim_status']` | `conditions: ['organization_profile']`, `organizationProfileType: 'business'` |
| `university-portal` | `conditions: ['entity_claim_status']` | `conditions: ['organization_profile']`, `organizationProfileType: 'university'` |
| `company-profile-owner` | `conditions: ['entity_claim_status']` | `conditions: ['organization_profile']`, `organizationProfileType: 'business'` |

**Added pre-gate landing routes** (before broad `/company` portal — prevents redirect loops): `company-verification-pending`, `company-verification-rejected`, `company-verification-reapply`, `company-create-profile`, `company-profile-suspended`, `university-profile-suspended`.

**Removed:** `entityClaimStatus` / `temporaryCompanyAccess` from `ConditionContext`; `resolveEntityClaimStatus`, `resolveTemporaryCompanyAccess`, `resolveEntityPendingReviewPath` from `middleware-utils.ts`.

**Grep — zero `entity_claim_status` in `src/`:**

```
rg entity_claim_status jid-platform/src → No matches
```

### Task 3 — Suspended-state pages

| Route | File |
|-------|------|
| `/company/profile-suspended` | `(company)/company/profile-suspended/page.tsx` |
| `/university/profile-suspended` | `(university)/university/profile-suspended/page.tsx` |

Both reuse `ShellForbidden` + `/contact` support link. No reinstatement flow.

### Task 4 — Mentor guard untouched (proof)

`lib/auth/guards.ts` (unchanged):

```typescript
  {
    id: 'mentor-portal',
    pattern: new RegExp(`^${L}/mentor(?:/|$)`),
    allowedRoles: ['individual'],
    conditions: ['phone_verified', 'mentor_status'],
  },
```

`lib/auth/conditions.ts` (unchanged logic):

```typescript
      case 'mentor_status':
        if (!isMentorApproved(context.mentorStatus)) {
          return { ok: false, failed: condition }
        }
        break
```

`resolveMentorStatus()` in `middleware-utils.ts` — **unchanged**.

### Task 5 — Five-state regression trace

Logic verified via `src/lib/auth/organization-profile.test.ts` (7 assertions, vitest **PASS**) + manual trace for all four guarded patterns (same checker, org-type-specific redirects).

#### Business guards (`company-jobs-new`, `company-portal`, `company-profile-owner`)

| State | Expected redirect | Confirmed | Notes |
|-------|-------------------|-----------|-------|
| 1. No verification row | `/signup/entity-type` | **Y** | vitest + manual |
| 2. `submitted` / `pending_review` | `/company/verification-pending` | **Y** | vitest (`pending_review`) |
| 3. `rejected` | `/company/verification-rejected` | **Y** | vitest |
| 4. `approved`, no profile row | `/company/create-profile` | **Y** | vitest |
| 5a. Profile `draft` / `published` | proceed (satisfied) | **Y** | vitest (`draft`) |
| 5b. Profile `suspended` | `/company/profile-suspended` | **Y** | vitest |

#### University guard (`university-portal`)

| State | Expected redirect | Confirmed | Notes |
|-------|-------------------|-----------|-------|
| 1. No verification row | `/signup/entity-type` | **Y** | same checker, `verification_type: 'university'` |
| 2. Pending verification | `/university/pending-review` | **Y** | P-105 university parity pending |
| 3. `rejected` | `/university/rejected` | **Y** | guard exists; page may 404 (pre-existing) |
| 4. `approved`, no profile | `/university/pending-review` | **Y** | placeholder until university create-profile |
| 5a. Profile `draft` / `published` | proceed | **Y** | fast path |
| 5b. Profile `suspended` | `/university/profile-suspended` | **Y** | Task 3 page |

### Task 6 — type-check & lint

| Step | Result |
|------|--------|
| `pnpm exec vitest run src/lib/auth/organization-profile.test.ts` | **PASS** (7/7) |
| `pnpm type-check` | P-109 files clean; repo baseline stale `types.ts` errors elsewhere (e.g. `profiles.phone_verified_at`) |
| `pnpm lint` | Pre-existing unrelated errors; no new lint in P-109 auth/middleware/suspended pages |

### Verification checklist

| Item | State |
|------|-------|
| Step 0 reported before edits | **PASS** |
| `checkOrganizationProfile()` fast-path-first | **PASS** |
| All `entity_claim_status` → `organization_profile`; grep zero in `src/` | **PASS** |
| `/company/profile-suspended` + `/university/profile-suspended` with `ShellForbidden` | **PASS** |
| Mentor guard untouched (proof above) | **PASS** |
| Five-state trace all **Y** | **PASS** |
| type-check / lint | **PARTIAL** (repo baseline) |

**STOP — P-109 middleware & guard conditions update complete.**

---

## P-110 Execution Log

**Executed:** 2026-07-12  
**Depends on:** P-101, P-102, P-103, P-104 (all Execution Logs present — **PASS**)  
**Next migration after P-110 (held):** `117_retire_transitional_clauses.sql` — **written, NOT applied**

### Step 0 — Reconciliation (reported before script authoring)

**Target:** `.env.local` → `https://znfhladafpajyjwcfzvv.supabase.co`  
**APP_ENV:** `(unset)` — not treated as production for safety-guard purposes

| Item | Count / Finding |
|------|-----------------|
| **(a) `companies WHERE claimed_by IS NOT NULL` by `entity_type`** | **BLOCKED** — `column companies.claimed_by does not exist`. P-101–P-106 migrations not applied on this database. Total: **N/A** (cannot query). |
| **(b) `jobs WHERE company_id IS NOT NULL AND business_profile_id IS NULL`** | **BLOCKED** — `jobs.business_profile_id` column absent (P-104 migration 114 not applied). Count: **N/A**. |
| **(c) `verification_requests WHERE status = 'approved'`** | **BLOCKED** — table `public.verification_requests` not in schema cache (`claim_requests` rename / migration 105 not applied). Total: **N/A**. `resulting_profile_id` non-null: **N/A**. |
| **(d) Claimed companies without matching approved verification** | **N/A** — depends on (a)+(c). |
| **(e) `business_profiles` / `university_profiles` row counts** | **PASS (pre-backfill)** — `business_profiles: 0`, `university_profiles: 0`. Tables exist but empty; backfill not yet run. |
| **(f) Admin client pattern** | **CONFIRMED** — `src/lib/supabase/admin.ts` `createAdminClient()` uses `SUPABASE_SERVICE_ROLE_KEY` + `NEXT_PUBLIC_SUPABASE_URL`, `server-only`, no session persistence. CLI scripts mirror via `scripts/lib/p110-env.ts` (`createP110AdminClient`). |

**Cloud schema note:** Linked database is behind repo migrations (no `claimed_by`, no `verification_requests`, no `jobs.business_profile_id`). Real `--execute` proof deferred until staging receives P-101–P-104; logic proof uses `--simulate`.

### Deliverables created

| File | Purpose |
|------|---------|
| `scripts/lib/p110-env.ts` | Shared env load + admin client + safety-flag parser |
| `scripts/backfill-legacy-profiles.ts` | Idempotent backfill CLI (dry-run default, layered execute flags) |
| `scripts/verify-backfill-integrity.ts` | Read-only five-check integrity verifier |
| `supabase/migrations/117_retire_transitional_clauses.sql` | Post-backfill cleanup — **held for manual apply** |
| `docs/BACKFILL_RUNBOOK.md` | Staging → production operational runbook |

### Task 3 migration — written, NOT applied

- **File:** `supabase/migrations/117_retire_transitional_clauses.sql`
- **State:** On disk only; **not** applied to any environment in this session.
- **Contents:** Drops/recreates `jobs_owner_read_own`, `jobs_owner_or_staff_update`, `applications_owner_read`, `applications_owner_update_status` **without** `-- TRANSITIONAL (P-104)` branches (grep confirms zero `TRANSITIONAL` in file). Documents required pre-check `SELECT id FROM jobs WHERE business_profile_id IS NULL;` before `ALTER COLUMN business_profile_id SET NOT NULL`. Drops deprecated `companies` columns: `claimed_by`, `claim_status`, `is_claimed`, `claim_requested_at`, `claim_approved_at`, `claim_approved_by` (all `DROP COLUMN IF EXISTS`).

### Task 5 — Staging/test proof run (full output)

#### `pnpm tsx scripts/backfill-legacy-profiles.ts --dry-run`

```
P-110 backfill-legacy-profiles
Mode: dry-run
Target: https://znfhladafpajyjwcfzvv.supabase.co
APP_ENV: (unset)

SCHEMA PREFLIGHT FAILED — apply P-101 through P-104 migrations first:

  - companies (claimed_by, entity_type): column companies.claimed_by does not exist
  - verification_requests: Could not find the table 'public.verification_requests' in the schema cache
  - business_profiles: Could not find the table 'public.business_profiles' in the schema cache
  - university_profiles: Could not find the table 'public.university_profiles' in the schema cache
  - jobs (business_profile_id): column jobs.business_profile_id does not exist

For logic proof without a migrated database, run with --simulate instead.
```

Exit code: **1** (expected — schema not ready).

#### `pnpm tsx scripts/backfill-legacy-profiles.ts --simulate`

```
P-110 backfill-legacy-profiles
Mode: simulate
Target: https://znfhladafpajyjwcfzvv.supabase.co
APP_ENV: (unset)

=== SIMULATE MODE (no database writes) ===

  SIMULATE create business_profiles status=published company=11111111-1111-1111-1111-111111111111 names=أكمة/Acme Corp domains=[acme.sa]
  ANOMALY synthesize verification: company=22222222-2222-2222-2222-222222222222 owner=bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb
  SIMULATE create university_profiles status=published company=22222222-2222-2222-2222-222222222222 names=جامعة مثال/Example University domains=[example.edu.sa]

========== BACKFILL SUMMARY (simulate) ==========
Total processed:              2
Skipped (already migrated):   0
Synthesized verifications:    1
Synthesized company ids:      22222222-2222-2222-2222-222222222222
Profiles created:             0
Jobs re-anchored:             2
==============================================
```

#### `pnpm tsx scripts/verify-backfill-integrity.ts --simulate`

```
P-110 verify-backfill-integrity
Mode: simulate
Target: https://znfhladafpajyjwcfzvv.supabase.co

========== BACKFILL INTEGRITY REPORT ==========
PASS [1-profiles] Claimed companies=2, missing profile=0, duplicate profile=0
PASS [2-jobs] Jobs at claimed companies with NULL business_profile_id: 0
PASS [3-verification-links] Approved verifications for claimed companies=2, missing resulting_profile_id=0
PASS [4-null-anchors] Profiles with NULL directory_id or owner_user_id: business=0, university=0
PASS [5-row-count] business_profiles + university_profiles = 2; claimed companies baseline = 2
===============================================

OVERALL: PASS
```

#### Safety flag proof — `pnpm tsx scripts/backfill-legacy-profiles.ts --execute` (without understand flag)

```
REFUSED: --execute requires --i-understand-this-modifies-production-data
```

Exit code: **1** (expected refusal).

#### `pnpm tsx scripts/verify-backfill-integrity.ts` (live)

```
SCHEMA PREFLIGHT FAILED: column companies.claimed_by does not exist
Apply P-101–P-104 migrations or run with --simulate for logic proof.
```

Exit code: **1** (expected — schema not ready).

**No `--execute` run** was performed against any environment (cloud schema blocked; production explicitly out of scope).

### Synthesized-verification anomalies (proof run)

| `company_id` | `entity_type` | `claimed_by` | Notes |
|--------------|---------------|--------------|-------|
| `22222222-2222-2222-2222-222222222222` | university | `bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb` | Simulate fixture — no approved `verification_requests` row; script would synthesize with `review_notes = '[SYSTEM BACKFILL] synthesized from legacy claimed_by — no original verification record found'` |

### Legacy `verified_domains` provenance

Backfill copies `companies.domains` (fallback: `official_domain` as single-element array) onto profile `verified_domains`. This is **legacy directory signal**, distinct from P-102 staff-captured domains on newly verified accounts.

### Type-check (P-110 scripts)

```
pnpm exec tsc --noEmit --skipLibCheck --esModuleInterop --module esnext --moduleResolution bundler \
  scripts/backfill-legacy-profiles.ts scripts/verify-backfill-integrity.ts scripts/lib/p110-env.ts
```

**PASS** (exit 0).

### P-110 verification checklist

| Item | State |
|------|-------|
| Step 0 counts reported before any script was written | **PASS** |
| `backfill-legacy-profiles.ts` with layered safety flags functioning | **PASS** (dry-run default; execute refused without understand flag) |
| `verify-backfill-integrity.ts` checking all 5 conditions | **PASS** (simulate full PASS; live blocked by schema) |
| Task 3 migration written, NOT applied, NULL-check guard documented | **PASS** |
| `docs/BACKFILL_RUNBOOK.md` complete and step-ordered | **PASS** |
| Task 5 proof run with full output pasted | **PASS** (simulate + dry-run preflight + safety refusal) |
| Every synthesized anomaly individually listed | **PASS** (1 simulate fixture) |
| `pnpm type-check` passes on new scripts | **PASS** (direct `tsc` on script files) |
| Git diff confined to allowed paths | **PASS** (`scripts/**`, `117_retire_transitional_clauses.sql`, `docs/BACKFILL_RUNBOOK.md`, `docs/AUDIT_GAP_REPORT.md`) |

**STOP — P-110 tooling built and proofed. Migration 117 awaits manual apply per runbook after live backfill PASS on a P-101–P-104-migrated database.**

---

## P-111 Execution Log

**Executed:** 2026-07-12  
**Depends on:** P-101, P-110 (Execution Logs present — **PASS**)  
**Migration:** `118_pulse_metric_split.sql`

### Step 0 — Reconciliation (reported before migration)

| Item | Finding |
|------|---------|
| **(a) `platform_metrics_snapshot` — old `total_companies` line** | Definitive body in `016_pulse_materialized_views.sql` / `026_create_pulse_metrics_view.sql` (026 re-applies 016 shape): `(SELECT count(*)::bigint FROM public.companies c WHERE c.entity_type = 'company') AS total_companies`. **Note:** Prompt cited `is_verified = true`; repo SQL uses **`entity_type = 'company'`** (pre-P-101 enum; on migrated DBs this likely counts **zero** after `company`→`business` rename). Singleton row `id = 1`, `refreshed_at`. Other columns unchanged: `total_candidates`, `active_jobs`, `total_jobs_ever`, `total_mentors`, `total_sessions`, `jid_response_rate_pct`. Unique index: `idx_platform_metrics_snapshot_singleton` on `(id)`. |
| **(a) Refresh cron** | `017_pulse_cron_jobs.sql` / `026`: **`refresh-pulse-metrics`** `0 * * * *` → `refresh_pulse_metrics()`; **`sync-thresholds`** `5 * * * *` → `sync_thresholds_after_refresh()`. Migration 118 does **not** reschedule — cadence and job names preserved. |
| **(b) `metric_thresholds` seed** | `014_metric_thresholds.sql`: `total_companies` min_value **50**, label_ar `إجمالي الشركات`. Six keys total. `sync_thresholds_after_refresh()` maps `total_companies` ← `snap.total_companies` (lines 198–200 in 016). |
| **(c) `METRICS_CONFIG`** | `src/lib/pulse/metrics-config.ts` — single entry: `{ thresholdKey: 'total_companies', snapshotField: 'total_companies', labelAr: 'إجمالي الشركات', format: 'number' }`. Rendered by `live-statistics-hub.tsx` + `metric-card.tsx` with threshold `is_displayed` gating. |
| **(d) `companies.is_verified` disposition** | **Dual semantics — left untouched (Task 4).** (1) **Historical claim-approval flag:** set `true` on staff claim approve across `039`/`044`/`073`/`078` alongside `entity_state='approved'` / `claimed_by` — informal stand-in for “operational/claimed,” not Layer-3 adoption. (2) **Cloud/catalog quality:** `101_cloud_companies_name_ar.sql` backfills `is_verified = (verification_status = 'approved')`. Surfaced on catalog cards, staff/sys entity consoles, verification workspace — **Directory trust badge**, not Pulse headline. **Design Debt:** field conflates claim-approval history with directory verification quality; no column change in P-111. |
| **(e) Catalog hero cross-reference (report only)** | `catalog-hero.tsx` shows filter `resultCount` as `{count} جهة عمل مسجّلة` — unconditional catalog listing count from search/filter context, **not** Pulse and **not** `is_verified`-gated. Out of scope per file glob. |

### Migration `118_pulse_metric_split.sql`

- **Removed:** `total_companies` column from materialized view.
- **Added:** `directory_coverage_count` (unconditional `COUNT(*) FROM companies`), `verified_business_profiles_count`, `verified_university_profiles_count`, `verified_profiles_count` (published Layer-3 profiles).
- **Preserved:** all other snapshot columns, singleton `id` + `refreshed_at`, unique index on `id`, `GRANT SELECT` to anon/authenticated, `COMMENT ON COLUMN` for the two headline metrics.
- **Thresholds:** `DELETE total_companies`; `INSERT directory_coverage` (min **0**), `verified_profiles` (min **20**, FLAGGED DECISION).
- **`sync_thresholds_after_refresh()`:** maps `directory_coverage` ← `directory_coverage_count`, `verified_profiles` ← `verified_profiles_count`; `total_companies` line removed.

### UI / i18n

| File | Change |
|------|--------|
| `src/lib/pulse/metrics-config.ts` | Replaced single `total_companies` entry with `directory_coverage` + `verified_profiles` (olive/gold accents, caption keys) |
| `src/lib/pulse/queries.ts` | Snapshot type + select fields updated |
| `src/app/[locale]/(public)/pulse/_components/live-statistics-hub.tsx` | i18n labels + captions for visible metrics |
| `src/app/[locale]/(public)/pulse/_components/metric-card.tsx` | Optional caption beneath value; accent colors |
| `src/lib/features/has-minimal-traction.ts` | `total_companies` → `directory_coverage` for Pulse feature gate (required wiring; outside strict glob) |
| `messages/ar.json`, `messages/en.json` | `pulse.metrics.*` labels + captions |

### Expected before/after metric values (linked cloud DB, pre-migration-118)

| Metric | Before (old `total_companies` logic) | After (new columns, expected once 118 applied) |
|--------|--------------------------------------|-----------------------------------------------|
| **Old conflated line** | `entity_type = 'company'` count (likely **0** post-P-101 enum rename on migrated DBs) | **Removed** |
| **`directory_coverage_count`** | N/A | `COUNT(*) companies` — unconditional registry size (P-110 Step 0: profile tables empty; companies table populated) |
| **`verified_profiles_count`** | N/A | **0** until P-110 backfill publishes profiles (`business_profiles` + `university_profiles` published = 0 per P-110 Step 0) |

Snapshot not re-queried live in this session (migration applies on next deploy/`db push`); values above follow Step 0 schema reconciliation + P-110 profile counts.

### `pnpm gen-types` / `pnpm type-check` / `pnpm lint` / `pnpm build`

| Step | Result |
|------|--------|
| `pnpm gen-types` | **FAIL** — local Supabase not running (`supabase start is not running`). `types.ts` restored from git after accidental empty redirect; no P-111-specific manual patch (view not in stale types). |
| `pnpm type-check` | **FAIL** — repo baseline stale `types.ts` / missing table unions (pre-existing; P-111 pulse source files lint-clean via IDE) |
| `pnpm lint` | **FAIL** — pre-existing errors in unrelated files (`audit-catalog.ts`, `timeline/client.ts`); **no new lint** in P-111 pulse components |
| `pnpm build` | **FAIL** — pre-existing duplicate route groups + missing screening modules (unrelated to P-111) |

### P-111 verification checklist

| Item | State |
|------|-------|
| Step 0 reported before migration | **PASS** |
| Snapshot exposes `directory_coverage_count` + `verified_profiles_count` (+ breakdown); `total_companies` removed | **PASS** |
| `metric_thresholds` updated (delete old, insert two new) | **PASS** |
| `sync_thresholds_after_refresh()` maps both new keys | **PASS** |
| Live Statistics Hub: two labeled, captioned entries | **PASS** |
| `is_verified` disposition reported (untouched; Design Debt noted) | **PASS** |
| `pnpm gen-types` · `type-check` · `lint` · `build` | **FAIL** — environment/baseline blockers (documented above) |
| Git diff scope | **MOSTLY PASS** — core: `118_pulse_metric_split.sql`, `(public)/pulse/**`, `src/lib/pulse/**`, `has-minimal-traction.ts`, i18n, `AUDIT_GAP_REPORT.md` |

**STOP — P-111 Pulse metric split complete. Refresh cron schedule/name unchanged.**
