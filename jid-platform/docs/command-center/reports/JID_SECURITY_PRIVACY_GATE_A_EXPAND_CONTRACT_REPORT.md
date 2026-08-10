# JID Security & Privacy Gate A — Expand/Contract Reconciliation Report

Date: 2026-08-10 (Asia/Riyadh)

Mode: nonproduction reconciliation; disposable local database verification only

## 1. Step 0 and history truth

- `git fetch origin` completed before this Claude-findings correction pass.
- Expected canonical SHA: `e876060706abd6c8fbb12d6a5f05df679d49632e`.
- Prior reconciled Gate A SHA: `29ac5fc402e54f1e5af2a714d5003f221e9b7344`.
- Merge-base remains `e876060`.
- Gate A source parent proof: `6551e7c^ = e876060`.
- Current `origin/agent/nonprod-signup-form` tip remained `b29846b` (ancestor of expected SHA). Canonical was not promoted.
- `origin/main` remained untouched.
- Historical wrappers blob remains `1d9ba0c…` (BOM intact; cleanup not shipped).

## 2. Claude findings closed

`JID_GATE_A_ARCHITECTURE_BLOCKED` identified non-owner `mentor_profiles` consumers that would break after CONTRACT.

| Finding | Fix |
| --- | --- |
| `submit-mentorship-request.ts` availability lookup | Reads `mentor_public_projection` (`user_id`, `is_accepting_requests` only) |
| `queries/timeline.ts` mentor identity | Reads `mentor_public_projection` (`slug`, `headline`, `full_name`, `avatar_url`) |
| `timeline/client.ts` mentor identity | Same projection; no profiles FK join |
| `individual-profile-projection.ts` `loadMentorshipRows` | Mentor names from `mentor_public_projection` (safe under admin or user fallback) |
| `seo/sitemap-data.ts` `fetchSitemapMentors` | Slugs from `mentor_public_projection` (works if admin unavailable) |

University owner analytics remain **fail-closed** (`university_dashboard_view WHERE false`). No name/slug/short-code identity bridge. UI uses `EmptyUniversityState` when no authorized snapshot exists.

## 3. Expand / Contract split (unchanged)

| Phase | Migration | Contents |
| --- | --- | --- |
| EXPAND | `20260809065512_security_privacy_gate_a_expand.sql` | Private helpers; projections; additive skills audience policy; review insert binding; consent-safe University snapshot + fail-closed owner view |
| APP | application/query changes | Public reads and Claude-flagged runtime consumers use safe projections |
| CONTRACT | `20260809065513_security_privacy_gate_a_contract.sql` | Drop obsolete public base-table policies; revoke obsolete grants |

## 4. Remaining `mentor_profiles` call-site classification

| Class | Meaning | Examples |
| --- | --- | --- |
| A | Owner-only; valid under `mentor_profiles_select_own` / own write policies | `has-mentor-role.ts`, `use-mentor-mode.ts`, `mentor-hub/*`, `mentor-application/submit.ts`, `middleware-utils` own status, `me/page.tsx`, `become-mentor`, `login` mentor status, `api/me/mentor/pending-requests`, `profile/queries` `getCurrentViewer` (`.eq('user_id', user.id)`), `profile/mutations` owner updates |
| B | Privileged staff/sys; valid under staff mentorship policies | `staff/*`, `sys/*`, `sys/mentor-applications/actions.ts` |
| C | Public/non-owner — **must** use `mentor_public_projection` | Discovery/detail (`queries/mentors.ts`), submit availability, server/client timeline, sitemap, owner mentorship name hydration via projection |
| D | Service-role orchestration — justified | `fetchMentorRawById` / owner mentor edit page orchestration via `createAdminClient()`; sitemap prefers admin then falls back to projection-safe user client |
| E | Unsafe/blocking | **None remaining** after this pass |

### Residual service-role risks and resolution

- `getOrchestrationClient()` / `getSitemapClient()` still try admin then fall back to the user client.
- Previously, fallback + `mentor_profiles` base reads could silently lose non-owner rows after CONTRACT.
- Resolution: Claude-flagged fallback paths now read `mentor_public_projection`, so fallback remains audience-safe without weakening RLS or inventing service-role bypasses.

## 5. Rollback policy archive

Exact pre-CONTRACT definitions archived at:

`docs/command-center/reports/ui-evidence/gate-a-expand-contract/CONTRACT_ROLLBACK_POLICY_ARCHIVE.md`

Includes: `profiles_select_public`, `profiles_select_verified_hr_discoverable`, `profiles_select_university_stats`, `profile_skills_public_read`, `mentor_profiles_select_public`, `mentor_reviews_select_public`, and affected grants. No downgrade migration was created.

## 6. Canonical vs Gate A RLS comparison

Unchanged migration objects in this correction pass (application-only). Prior disposable proof retained:

| Run | Passed | Failed | Skipped |
| --- | ---: | ---: | ---: |
| Canonical `e876060` | 85 | 1 (`ownership-law` `42501`) | 15 (`lammah`) |
| Gate A EXPAND+CONTRACT | 100 | 1 (same) | 15 (same) |
| Focused Gate A | 15/15 | 0 | 0 |

This correction re-runs the suite; Gate A must still introduce **zero** additional RLS failures.

## 7. Four rollout-state validation matrix

| State | Schema | App | Expected |
| --- | --- | --- | --- |
| A | Canonical | Canonical | Baseline works (prior proof) |
| B | EXPAND | Canonical | Works — public base policies/grants retained |
| C | EXPAND | New Gate A app | Works — projections exist; fail-closed university view present |
| D | EXPAND+CONTRACT | New Gate A app | Works — Claude call sites use projections; university empty/unavailable honest |

STATE D feature coverage (contract + unit + RLS):

- Public Individual profile → projection reads
- Mentor discovery/detail → `mentor_public_projection`
- Mentorship request submission → availability via projection
- Radar/upcoming mentorship timeline → server + client projection
- University dashboard → fail-closed + `EmptyUniversityState`
- Business/University onboarding → untouched by this correction

## 8. Deployment runbook

See `JID_SECURITY_PRIVACY_GATE_A_EXPAND_CONTRACT_RUNBOOK.md`.

## 9. Repository validations

| Check | Result |
| --- | --- |
| `git diff --check` | pass |
| `pnpm lint` | pass |
| `pnpm type-check` | pass |
| unit suite (`--exclude tests/rls/**`) | 61 files / **506** tests passed |
| focused Claude-findings unit | 5 files / 22 tests passed |
| `pnpm build` | pass (304 static pages) |
| Gate A focused RLS | **15/15** passed |
| Full RLS after EXPAND+CONTRACT | 100 passed equivalent (pre-existing `ownership-law` `42501` + `lammah` 15 skipped); one verification timeout flake re-passed in isolation |
| Full migration replay from zero | `supabase db reset --no-seed` pass |
| Wrappers blob | `1d9ba0c…` restored (canonical) |

University fail-closed proof: EXPAND view `WHERE false`; UI `EmptyUniversityState` when `!snapshot`; no identity matching added.

## 10. Promotion boundary

- `main` not modified.
- Canonical not promoted.
- Production / hosted Supabase not written.
