# JID Spec 09 — Defect Register (running)

**Session ownership:** opened in 09-B; final CLASS_A / CLASS_B owned by 09-C
**JID09_RUN_ID:** `jid09-20260801-7d956c`
**Environment:** non-production only (`hmjuijmaefajdjrjdsxu`, `https://jid-dev.vercel.app`)
**Status convention:** all rows below are `OPEN`
**Product fixes in 09-B:** none

## Environment blocker (affects Journeys 1–3)

Authenticated reads against `business_profiles`, `university_profiles`, and `verification_requests` fail under the anon/authenticated client with:

`relation "public.claim_requests" does not exist`

This is observed via the approved non-production binding (no secrets recorded). Server routes that query those tables under RLS render the app error boundary or redirect to `/signup/entity-type`. Repair requires schema/RLS work outside Session 09-B scope.

---

## DEF-09B-001

| Field | Value |
|---|---|
| timestamp (UTC) | 2026-08-02T00:20:00Z |
| JID09_RUN_ID | `jid09-20260801-7d956c` |
| journey | J2 (also visible on shared signup surface used by J1 redirects) |
| actor | `uniApplicant` / any visitor of `/signup/entity-type` |
| route | `/signup/entity-type` |
| locale / direction | ar / RTL |
| viewport | desktop |
| fixture/scenario | `uni-reapply` / entity-type entry |
| owning specification | 09 (terminology contract from Specs 03/04/05) |
| expected | Verification surfaces use تحقق / Verification only; no visible Claim / مطالبة |
| observed | Entity-type cards show `طلب مطالبة بالملكية` for Company and University |
| persisted/server result | N/A (copy defect) |
| reproducibility | always |
| console summary | none material |
| evidence | `ui-evidence/final-qa/captures/J2-uni-reapply__ar__desktop__reapply.png` |
| security/privacy impact | none (terminology) |
| provisional severity | medium |
| provisional classification | deferred to 09-C |
| status | OPEN |

## DEF-09B-002

| Field | Value |
|---|---|
| timestamp (UTC) | 2026-08-02T00:40:00Z |
| JID09_RUN_ID | `jid09-20260801-7d956c` |
| journey | J1 / J2 / J3 (cross-cutting) |
| actor | `bizOwner*`, `uniOwner*`, `bizApplicant`, `uniApplicant`, `staffA/B`, `superAdmin`, `staffSelfReviewApplicant` |
| route | `/company/*`, `/university/*`, `/staff/verification*`, `/staff/directory` |
| locale / direction | ar+en / RTL+LTR |
| viewport | desktop + 375 |
| fixture/scenario | all owned Profile + verification + Staff queue fixtures for this RUN_ID |
| owning specification | 09 (blocks Specs 02–08 journey surfaces in non-prod) |
| expected | Authenticated actors can read own verification/profile rows; Staff can load verification queue/workspace |
| observed | Client/server queries fail with missing relation `public.claim_requests`; Business/University pending pages show unexpected error boundary; owners redirected to `/signup/entity-type`; Staff verification/directory show “تعذّر تحميل صفحة بوابة الموظفين” after successful MFA |
| persisted/server result | DB rows for RUN_ID still exist (profiles, verifications, assignments) when inspected via seed DB path; app-layer reads fail |
| reproducibility | always under current non-prod schema/RLS |
| console summary | Server Components render error; React minified #419; staff error boundary; `/api/me/encryption-key` 409 on staff sessions |
| evidence | `J1-biz-pending__ar__desktop__pending.png`; `J3-staff-queue__ar__desktop__queue-v2.png`; `J3-staff-view-only__ar__desktop__view-only-v2.png`; `J3-staff-self-review__ar__desktop__self-review-block-v2.png`; `J3-staff-sa-override__ar__desktop__super-admin-override-v2.png` |
| security/privacy impact | high — blocks authorized Staff triage and owner Profile management in non-prod; not a public data leak |
| provisional severity | critical |
| provisional classification | deferred to 09-C (environment/schema vs product) |
| status | OPEN |

## DEF-09B-003

| Field | Value |
|---|---|
| timestamp (UTC) | 2026-08-02T00:25:00Z |
| JID09_RUN_ID | `jid09-20260801-7d956c` |
| journey | J1 |
| actor | `bizOwnerNoProfile` |
| route | `/company/create-profile` |
| locale / direction | ar / RTL |
| viewport | desktop |
| fixture/scenario | approved no-Profile |
| owning specification | 09 / Spec 04 Profile creation i18n |
| expected | Localized Arabic/English copy for profile creation |
| observed | Raw message keys rendered (`company.profileCreation.title`, `company.nav.*`, etc.) |
| persisted/server result | Form still binds synthetic display name for RUN_ID |
| reproducibility | always on captured surface |
| console summary | none material beyond missing message warnings if present |
| evidence | `ui-evidence/final-qa/captures/J1-biz-create-profile__ar__desktop__approved-no-profile.png` |
| security/privacy impact | none |
| provisional severity | medium |
| provisional classification | deferred to 09-C |
| status | OPEN |

## DEF-09B-004

| Field | Value |
|---|---|
| timestamp (UTC) | 2026-08-02T00:45:00Z |
| JID09_RUN_ID | `jid09-20260801-7d956c` |
| journey | J2 |
| actor | anon |
| route | `/universities/jid09-uni-pub-jid09-20260801-7d956c/profile` |
| locale / direction | ar / RTL |
| viewport | desktop |
| fixture/scenario | `profile-uni-published` |
| owning specification | 09 / Spec 07 public University Profile |
| expected | Published University Profile publicly available |
| observed | HTTP 404 “This page could not be found.” |
| persisted/server result | `university_profiles` row exists as `published` for `uniOwnerPublished` (seed DB path) |
| reproducibility | always for this slug during 09-B |
| console summary | none material |
| evidence | route probe during 09-B (anon visit); related capture `J2-uni-public__ar__desktop__published-public.png` must be treated as non-authoritative if it does not show the live 404 |
| security/privacy impact | none (availability) |
| provisional severity | high |
| provisional classification | deferred to 09-C |
| status | OPEN |

## DEF-09B-005

| Field | Value |
|---|---|
| timestamp (UTC) | 2026-08-02T00:45:00Z |
| JID09_RUN_ID | `jid09-20260801-7d956c` |
| journey | J2 |
| actor | `uniApplicant` |
| route | `/university/rejected` |
| locale / direction | ar / RTL |
| viewport | desktop |
| fixture/scenario | university rejected / reapply path |
| owning specification | 09 / Spec 03 outcome routes |
| expected | Rejected University outcome page |
| observed | 404 when navigated after login under current environment |
| persisted/server result | rejected terminal verification exists for `uniOwnerNoProfile`; applicant pending remains pending_review |
| reproducibility | reproduced in 09-B route probe |
| console summary | none material |
| evidence | 09-B route probe observation; `J2-uni-rejected__ar__desktop__rejected.png` shows error/404-class failure |
| security/privacy impact | none |
| provisional severity | high |
| provisional classification | deferred to 09-C |
| status | OPEN |

## Counts

| Metric | Value |
|---|---|
| Open defects | 5 |
| Critical | 1 (`DEF-09B-002`) |
| High | 2 |
| Medium | 2 |
| Fixed in 09-B | 0 |

## Explicit non-defects / PASS interpretations

- Honest Staff MFA challenge after password login = PASS (expected).
- Anonymous published Business Profile page for `jid09-biz-pub-jid09-20260801-7d956c` rendered with synthetic RUN_ID content = PASS for that public cell.
- Suspended Business public denial capture retained for 09-C continuity.
- Deferred Staff evidence viewer / request-more-information not asserted as working.
- Snapshot-present University dashboard remains an environment limitation when owner routes cannot load (see DEF-09B-002); not fabricated.
