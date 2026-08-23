# JID Final Interview QA Report

**Date:** 2026-08-23  
**Branch:** `cursor/jid-interview-mvp-final-closeout-v1`  
**App root:** `jid-platform/`  
**Nonprod DB:** `hmjuijmaefajdjrjdsxu`  
**Forbidden production:** `znfhladafpajyjwcfzvv` (not used)

## Local validation (worktree)

| Check | Result |
|---|---|
| `git diff --check` | PASS |
| `pnpm type-check` | PASS |
| `pnpm lint` | PASS |
| `pnpm test` | PASS — 619 passed, 116 skipped, 79 files passed / 12 skipped |
| `pnpm build` | PASS — Next.js 14.2.15 |

## Product-truth gates kept

- Three actors only. Directory ≠ Profile. No Claim Existing Profile. No commitment scoring.
- No social feed / likes / comments / follower graph.
- No Professional Discovery controls on the privacy form.
- Public Pulse footer gated on the Pulse flag.
- Public catalogue excludes `seed-%` slugs.
- Harvard/ATS CV claims remain softened (templates exist; no guarantee).
- Lammah auto-publication **OFF**.
- ACWA not published (no invented Directory row).

## P1 repairs in this closeout

- Applicant triage uses `decideJobTriageAccess()` with Profile-anchored ownership via `business_profiles`, not legacy `claimed_by`.
- `/university/rejected` no longer throws (Spec 03 outcome resolution).
- Staff catalog/Lammah RPCs wrap `auth.uid()` because `request.jwt.claim.sub` is unset on this PostgREST.

## Nonprod content

| Dataset | Count / note |
|---|---|
| Public active business Directory (non-seed) | 36 |
| Active Lammah opportunities | 13 |
| Lammah sources qualified | Aramco, KAUST careers, KAUST admissions, Elm, HRDF |
| Excluded | ACWA (unmapped); closed research rows never ingested |

## Language / theme / viewport matrix

Code and i18n unit tests cover AR/EN copy locks. Live visual matrix (light/dark × 390/430/768/1024/1440) against the **deployed** URL is recorded after `jid-dev` promotion in the closeout handoff, not against the previous SHA on `jid-dev`.

## Known limitation

`SYS_POST_MFA_RUNTIME_QA_LIMITATION` — `admin@jidseed.test` has one MFA factor. Staff demo account has zero factors. No MFA bypass was implemented.
