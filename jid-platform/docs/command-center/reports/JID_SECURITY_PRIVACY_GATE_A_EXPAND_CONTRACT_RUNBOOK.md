# JID Security & Privacy Gate A — Expand/Contract Deployment Runbook

Date: 2026-08-10 (Asia/Riyadh)
Branch: `codex/jid-security-privacy-gate-a-expand-contract`
Expected canonical base: `e876060706abd6c8fbb12d6a5f05df679d49632e`
Scope: non-production only. Do not touch `main`, production, or hosted Supabase in this task.

Claude findings closure: mentorship-request availability, server/client Radar timeline mentor identity, owner mentorship name hydration, and sitemap mentor slugs all read `mentor_public_projection` before CONTRACT.

Rollback policy archive (exact pre-CONTRACT definitions):
`docs/command-center/reports/ui-evidence/gate-a-expand-contract/CONTRACT_ROLLBACK_POLICY_ARCHIVE.md`

University owner analytics remain fail-closed until dedicated University Identity Reconciliation. No name/slug/short-code bridge.

## Exact safe order

1. **EXPAND migration on non-production**
2. **Verify new projections**
3. **Deploy application** (Gate A app that reads safe projections)
4. **Runtime smoke**
5. **CONTRACT migration**
6. **Final RLS / privacy smoke**

## Migration split

| Phase | File | Purpose |
| --- | --- | --- |
| EXPAND | `supabase/migrations/20260809065512_security_privacy_gate_a_expand.sql` | Private audience helpers; `individual_profile_public_projection`; `individual_profile_public_skills`; `mentor_public_projection`; `mentor_review_public_projection`; additive `profile_skills_audience_read`; tightened mentor-review insert binding; consent-safe University snapshot + fail-closed owner view |
| APP | application/query changes already on this branch | Public Individual/Mentor reads move onto safe projections |
| CONTRACT | `supabase/migrations/20260809065513_security_privacy_gate_a_contract.sql` | Drop obsolete public base-table policies; revoke obsolete anon/authenticated grants; owner-only mentor base select; applications least-privilege grants |

Historical note: `20260805190100_catalog_review_auth_wrappers.sql` is restored byte-for-byte to canonical (`1d9ba0c…`). The Gate A UTF-8 BOM cleanup is intentionally excluded.

## Stage 1 — EXPAND on non-production

### Apply

Apply only the EXPAND migration to the non-production database after canonical schema `e876060` / `fc852e5` is present.

### Verify new projections

Confirm these objects exist and are selectable by `anon` / `authenticated` as designed:

- `private.viewer_has_active_verified_business_profile()`
- `private.can_read_individual_profile(uuid)`
- `public.individual_profile_public_projection`
- `public.individual_profile_public_skills`
- `public.mentor_public_projection`
- `public.mentor_review_public_projection`
- `public.university_dashboard_snapshot`
- `public.university_dashboard_view` (fail-closed / zero rows)
- `public.university_dashboard_view_admin` (staff-only)

Confirm still present for the currently deployed app:

- `profiles_select_public`
- `profiles_select_verified_hr_discoverable`
- `profiles_select_university_stats`
- `profile_skills_public_read`
- `mentor_profiles_select_public`
- `mentor_reviews_select_public`
- anon/authenticated grants required by the pre-Gate-A application

### Rollback after EXPAND

Forward-only compensating migration. Do **not** edit applied migration history.

Safe compensating direction:

- Drop the new projection views and private helpers if the app was never deployed.
- Do **not** restore unconditional skills reads, tautological review predicates, short-code identity authorization, or broad application grants.
- If University snapshot recreation must be reversed before app deploy, restore the prior consent/owner-scoped view definition via a new compensating migration reviewed separately.

If EXPAND is abandoned before app deploy, leave base-table public policies intact; the currently deployed app continues on those policies.

## Stage 2 — Deploy application

Deploy the Gate A application revision from this branch (or its promotion successor) only after EXPAND verification passes.

App dependencies created by EXPAND:

- public profile reads → `individual_profile_public_projection` / `individual_profile_public_skills`
- mentor public reads → `mentor_public_projection` / `mentor_review_public_projection`
- mentorship request availability → `mentor_public_projection`
- Radar timeline mentor identity (server + client) → `mentor_public_projection`
- sitemap mentor slugs → `mentor_public_projection`
- university owner dashboard → fail-closed `university_dashboard_view`

### Rollback after application deploy

- Roll the application back to the previous non-production revision (`e876060` / `fc852e5` lineage).
- Leave EXPAND in place; the old app does not require the new projections and still has base-table public policies.
- Do **not** run CONTRACT while the old app is live.

## Stage 3 — Runtime smoke

Minimum non-production smoke after app deploy, before CONTRACT:

1. Public Individual profile page renders from projection (denied → not-found).
2. Public Mentor profile/list renders from mentor projection.
3. Mentorship request: approved+accepting succeeds; not-accepting denied; non-approved unavailable; self-request denied.
4. Radar upcoming meetings retain mentor slug/headline/name/avatar from projection.
5. Mentor review public fields render without reviewer identifiers leakage beyond projection columns.
6. University owner dashboard remains empty/unavailable honestly (fail-closed / `EmptyUniversityState`).
7. Owner/staff Individual and Mentor authenticated flows still work via base-table owner/staff RLS.
8. Business and University onboarding journeys still load.

### Rollback after smoke failure

- Roll app back first.
- Keep EXPAND.
- Do not apply CONTRACT.
- File exact failing route/RPC evidence before any further change.

## Stage 4 — CONTRACT migration

Apply CONTRACT only when:

- EXPAND is applied
- Gate A application is deployed and smoke-green on that EXPAND schema

CONTRACT removes compatibility shims the old app needed:

- public/discovery/university Individual base-table select policies
- unconditional `profile_skills_public_read`
- mentor public base-table select policy/grants
- mentor review public base-table select policy
- anonymous application privileges; authenticated least-privilege grants

### Rollback after CONTRACT

Forward-only compensating migration only, and only if a production-impacting defect is proven.

Exact archived policy/grant SQL for emergency non-prod compensating migrations:

`docs/command-center/reports/ui-evidence/gate-a-expand-contract/CONTRACT_ROLLBACK_POLICY_ARCHIVE.md`

Compensating guidance:

- Prefer fixing the application/projection path.
- Do **not** reintroduce `profile_skills_public_read USING (true)`.
- Do **not** re-grant anonymous access to `applications`.
- Do **not** restore base-table public Mentor/Individual selects if projections remain the supported contract.
- Any temporary emergency compatibility must be time-boxed, reviewed, and must not weaken Gate A intent.

## Stage 5 — Final RLS / privacy smoke

After CONTRACT:

1. Focused Gate A RLS suite must pass.
2. Full local RLS suite must introduce zero additional failures versus the canonical baseline recorded for `e876060`.
3. Spot-check: anon cannot select private Individual base rows; public projection columns only; applications have no anon grant; university owner view remains fail-closed.

## Hosted / production boundary

This runbook is for non-production rollout planning evidence only.

- Do not apply these migrations to hosted Supabase from this task.
- Do not promote `agent/nonprod-signup-form`.
- Do not touch `main` or production.
- Promotion and hosted apply remain separate authorized actions.
