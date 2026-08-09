# JID Security & Privacy Gate A Report

Date: 2026-08-09 (Asia/Riyadh)

Mode: nonproduction implementation; disposable local verification only

Base: `agent/nonprod-signup-fix` at `5d6c8e3baba1b37336f1d192ea30195f8d442953`

Implementation branch: `codex/jid-security-privacy-gate-a`

## Branch reconciliation

- The promoted nonproduction base remained `5d6c8e3baba1b37336f1d192ea30195f8d442953`.
- Cursor Wave 1 existed at `c1bd5cd8001504800d67c5693ff1bdef318dc995` but was not promoted. Gate A was therefore implemented in an isolated worktree from the promoted base without modifying or merging Cursor's branch.
- No hosted database, production environment, deployment, or production data was touched.

## Vulnerabilities closed

1. `profile_skills` no longer has an unconditional `USING (true)` public-read policy. Reads now call the same active/non-deleted audience gate as the safe Individual projection.
2. `mentor_reviews` INSERT authorization now binds all target-row identifiers: the authenticated reviewer must be the meeting mentee, `meeting_id` must identify the meeting, review `mentor_id` must equal meeting `mentor_id`, and the meeting must be completed.
3. University actors no longer receive individual `profiles` rows through university-stat consent. Their supported contract is an owner-scoped aggregate view only, so approval for University A cannot reveal opted-in rows belonging to University B.
4. The university snapshot now starts from consented, active, non-deleted profiles; counts distinct profiles; computes CV, application, and completed-meeting aggregates in independent CTEs; and avoids join fan-out. Universities with no eligible population receive no snapshot row. Missing distributions remain `NULL` rather than fabricated empty evidence.
5. Public Individual, Mentor, and mentor-review readers use exact-column projections. Internal base-table columns, mentor application/moderation fields, meeting IDs, and reviewer IDs are not exposed.
6. In-scope anon/authenticated grants were replaced with explicit least-privilege grants compatible with PostgREST and the required views.

## Policies and grants: before / after

| Contract                     | Before                                                                                        | After                                                                                                                 |
| ---------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Individual public read       | Public/discovery/university policies selected from `profiles` base rows                       | Owner/staff retain base-table RLS; public and approved-business audiences use `individual_profile_public_projection`  |
| Individual skills            | `profile_skills_public_read USING (true)`                                                     | `profile_skills_audience_read USING (can_read_individual_profile(profile_id))`                                        |
| University individual access | Approved university plus stats opt-in could read any matching opted-in profile row            | University-specific individual-row policy removed; only `university_dashboard_view` aggregate is granted              |
| Mentor public read           | Anon/authenticated selected approved rows from `mentor_profiles` base table                   | Public reads `mentor_public_projection`; base table is owner/staff only                                               |
| Mentor review insert         | Predicate did not securely bind the review target to meeting mentor/reviewer/completion state | All four relationships are explicitly bound in `mentor_reviews_insert_mentee`                                         |
| Public mentor reviews        | Public policy selected from `mentor_reviews` base table                                       | Public reads `mentor_review_public_projection`; anonymous reviews suppress reviewer name and all reviewer identifiers |
| University snapshot          | Multi-domain joins could multiply counts and zero-filled unavailable states                   | Separate aggregates over one consented population; no eligible population means no row                                |

Effective local grant audit confirmed:

- anon: `SELECT` on the four safe projections and visibility-gated `profile_skills` only within this scope;
- authenticated: owner/staff-RLS-backed operations on `profiles`, `profile_skills`, `mentor_profiles`, and `mentor_reviews`, plus safe projections;
- university dashboard: authenticated `SELECT` on the owner-scoped view; snapshot storage remains service-only.

## Migration and compatibility changes

- Added `supabase/migrations/20260809065512_security_privacy_gate_a.sql`.
- Removed the UTF-8 BOM from `supabase/migrations/20260805190100_catalog_review_auth_wrappers.sql`; SQL semantics are unchanged. This was required for a clean replay with the pinned local CLI.
- Public mentor routes retain their URL and response shape, but featured ordering now uses public `is_mentor_of_month`, rating, and session-count fields instead of reading internal `mentor_score`.
- Public Individual routes retain their URL. An external viewer denied by the database projection now receives not-found rather than a restricted response containing identity from the private base row.
- University dashboard distribution fields are nullable and the UI renders unavailable distributions safely.
- Lammah tables, policies, workflows, and application code were not changed.

## Verification evidence

- Clean disposable migration replay: PASS; Gate A migration recorded locally.
- Focused Gate A RLS suite: 12/12 PASS, including wrong mentor, wrong reviewer, incomplete meeting, cross-university access, aggregate fan-out, and base-table denial cases.
- Unit suite: 49 files, 426/426 PASS.
- TypeScript: PASS (`tsc --noEmit`).
- ESLint: PASS, no warnings or errors.
- Next.js production build: PASS; 304 static pages generated. The initial sandboxed attempt could not fetch configured Google Fonts; the identical network-enabled rerun passed.
- `git diff --check`: PASS before final staging; rerun required after report addition.

The complete RLS suite produced 97 passes, 15 skips, and two baseline grant-assumption failures outside this change:

- `lammah-native-dedup.rls.test.ts` expects fixture insert permission on `lammah_sources`, which the replayed pre-Gate-A schema denies.
- `ownership-law.rls.test.ts` expects a direct `companies` update to return zero rows, while the replayed pre-Gate-A grant boundary rejects the statement with `42501`.

Gate A does not touch either table. Broadening those grants would weaken existing least-privilege boundaries and violate the task scope.

## Remaining risks

- Other legacy public projections/grants outside the Gate A tables (for example badge-related contracts) require a separate inventory and product decision; this migration intentionally does not expand scope.
- The safe views are intentionally definer-evaluated exact-column projections because invoker views would require granting base-table access. Future added columns are not exposed automatically and must receive an explicit privacy review.
- Materialized snapshot freshness still depends on the existing refresh mechanism. The migration corrects truthfulness and privacy, not refresh scheduling.
- The two unrelated RLS test assumptions above should be reconciled in their owning task without restoring broad table grants.

## Exact files changed

- `supabase/migrations/20260809065512_security_privacy_gate_a.sql`
- `supabase/migrations/20260805190100_catalog_review_auth_wrappers.sql` (encoding only)
- `src/lib/queries/mentors.ts`
- `src/lib/profile/queries.ts`
- `src/lib/profile/individual-profile-projection.ts`
- `src/lib/queries/university-dashboard.ts`
- `src/app/[locale]/(company)/_components/university-dashboard.tsx`
- `tests/rls/security-privacy-gate-a.rls.test.ts`
- `tests/unit/security/privacy-gate-a-contract.test.ts`
- `tests/unit/profile/publication-ui-routes.test.tsx`
- `docs/command-center/reports/JID_SECURITY_PRIVACY_GATE_A_REPORT.md`

## Exact database objects inspected or changed

`profiles`, `profile_skills`, `skills`, `mentor_profiles`, `mentor_reviews`, `mentorship_meetings`, `university_profiles`, `companies`, `universities_catalog`, `colleges_catalog`, `majors_catalog`, `cvs`, `applications`, `jobs`, `university_dashboard_snapshot`, `university_dashboard_view`, and `university_dashboard_view_admin`, together with all policies and grants on the in-scope profile/mentor objects.
