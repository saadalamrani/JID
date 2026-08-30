# WAVE 8 — Independent privacy / security / RLS review

**Pass:** 1 of 1 (this document). No review loop.
**Scope:** Professional Discovery, talent invitations, hiring intelligence.
**Date:** 2026-08-30 (Asia/Riyadh)

## Findings

| Severity | Finding | Disposition |
| --- | --- | --- |
| P1 | Default privileges granted `authenticated` INSERT/UPDATE/DELETE on new Wave 8 tables | Fixed forward-only in `20260830220100`; matrix revalidated |
| P0 | none | — |
| P2/P3 | none opened | — |

## Boundaries proven (nonprod actor matrix, rollback-only)

- Anon cannot execute search/invite RPCs; anon has no table SELECT/INSERT.
- Direct writes on invitation/event tables revoked from `authenticated` (RPC-only).
- Invite function body does not insert `applications`.
- Non-discoverable Individual is absent from search.
- Search payload does not include seed contact emails.
- University cannot search and cannot read another org's invitations under `authenticated` RLS.
- Candidate can read and respond to own invitation.
- Interested/invited states do not create an Application.
- Fixture transaction rolled back (`DATA_LOSS=0`).

## Residual notes (not blockers)

- Wave 7 remote versions `20260830190000` / `20260830190100` exist on nonprod without a GitHub `WAVE_7_COMPLETE` SHA. Wave 8 applied later versions `20260830220000` / `20260830220100` forward-only. Reconcile those Wave 7 files when that SHA exists.
- Cross-org isolation reuses Wave 5 `can_access_hiring_workspace` plus verified-employer gate; a second seed Business was not present to drive a live second tenant, but RLS is tenant-keyed on `business_profile_id`.
