# JID Spec 09 â€” Defect Register (FINALIZED in Session 09-C)

**JID09_RUN_ID:** `jid09-20260801-7d956c`
**Environment:** non-production only (`hmjuijmaefajdjrjdsxu`, `https://jid-dev.vercel.app`)
**Product fixes in 09-B/09-C:** none
**Classification authority:** Session 09-C

## Classification summary

| Class | Count | IDs |
|---|---|---|
| CLASS_A | 12 | DEF-09B-001, DEF-09B-002, DEF-09B-003, DEF-09B-004, DEF-09B-005, DEF-09C-001, DEF-09C-008, DEF-09C-009, DEF-09C-010, DEF-09C-011, DEF-09C-012, DEF-09C-013 |
| CLASS_B | 3 | DEF-09C-015, DEF-09C-016, DEF-09C-017 |
| Duplicate/symptom of DEF-09B-002 (not separately counted) | â€” | DEF-09C-002, DEF-09C-004, DEF-09C-005, DEF-09C-006, DEF-09C-007, DEF-09C-014 â†’ linked under DEF-09B-002 |

---

## DEF-09B-001

| Field | Value |
|---|---|
| first-observed | 2026-08-02T00:20:00Z |
| latest verification | 2026-08-02T01:30:00Z |
| JID09_RUN_ID | `jid09-20260801-7d956c` |
| journey | J2 / A11Y terminology |
| actor | anon / uniApplicant |
| route | `/signup/entity-type` |
| locale / direction / viewport | ar / RTL / desktop |
| scenario | entity-type entry |
| owning specification | 09 / Specs 03â€“05 terminology |
| expected | Verification wording only; no visible Claim / Ù…Ø·Ø§Ù„Ø¨Ø© |
| observed | `Ø·Ù„Ø¨ Ù…Ø·Ø§Ù„Ø¨Ø© Ø¨Ø§Ù„Ù…Ù„ÙƒÙŠØ©` on Company and University cards |
| server/persisted | N/A (copy) |
| reproducibility | always |
| console | none material |
| evidence | `ui-evidence/final-qa/captures/J2-uni-reapply__ar__desktop__reapply.png`; `A11Y-entity-type__ar__desktop__claim-scan.png` |
| privacy/security impact | none (terminology) |
| severity | medium |
| final classification | CLASS_A |
| status | OPEN |

## DEF-09B-002

| Field | Value |
|---|---|
| first-observed | 2026-08-02T00:40:00Z |
| latest verification | 2026-08-02T01:30:00Z |
| JID09_RUN_ID | `jid09-20260801-7d956c` |
| journey | J1â€“J6 / Staff / owner / catalog |
| actor | company_admin, university_admin, staff*, applicants |
| route | `/company/*`, `/university/*`, `/staff/verification*`, `/staff/directory/*`, catalog detail |
| locale / direction / viewport | ar+en / RTL+LTR / desktop+375 |
| scenario | authenticated reads of profiles/verifications/corrections |
| owning specification | 09 (blocks Specs 02â€“08 operable surfaces) |
| expected | Authorized actors can load own verification/profile/Staff surfaces |
| observed | Authenticated PostgREST/RLS errors: `relation "public.claim_requests" does not exist`; UI error boundaries / entity-type redirects |
| server/persisted | RUN_ID rows exist via seed DB; app-layer reads fail |
| reproducibility | always |
| console | Server Components render error; React #419 |
| evidence | Staff queue v2 captures; owner entity-type redirects; catalog â€œCould not load catalogâ€ |
| privacy/security impact | high â€” authorized operations unavailable; not a public data leak |
| severity | critical |
| final classification | CLASS_A |
| status | OPEN |
| linked symptoms | DEF-09C-002, DEF-09C-004â€¦007, DEF-09C-014 |

## DEF-09B-003

| Field | Value |
|---|---|
| first-observed | 2026-08-02T00:25:00Z |
| latest verification | 2026-08-02 (retained from 09-B evidence) |
| journey | J1 |
| actor | bizOwnerNoProfile |
| route | `/company/create-profile` |
| locale / direction / viewport | ar / RTL / desktop |
| scenario | approved no-Profile |
| owning specification | 09 / Spec 04 i18n |
| expected | Localized profile-creation copy |
| observed | Raw keys `company.profileCreation.*` / `company.nav.*` |
| server/persisted | Form still binds synthetic display name |
| reproducibility | always on captured surface |
| evidence | `J1-biz-create-profile__ar__desktop__approved-no-profile.png` |
| privacy/security impact | none |
| severity | medium |
| final classification | CLASS_A |
| status | OPEN |

## DEF-09B-004 / DEF-09C-003

| Field | Value |
|---|---|
| first-observed | 2026-08-02T00:45:00Z |
| latest verification | 2026-08-02T01:25:00Z |
| journey | J2 / J6 |
| actor | anon |
| route | `/universities/jid09-uni-pub-jid09-20260801-7d956c/profile` |
| locale / direction / viewport | ar / RTL / desktop |
| scenario | `profile-uni-published` |
| owning specification | 09 / Spec 07 |
| expected | Published University Profile publicly available |
| observed | HTTP 404 |
| server/persisted | `university_profiles` row status `published` for owner exists |
| reproducibility | always |
| evidence | `J6-uni-pub__ar__desktop__public.png` |
| privacy/security impact | none (availability) |
| severity | high |
| final classification | CLASS_A |
| status | OPEN |

## DEF-09B-005

| Field | Value |
|---|---|
| first-observed | 2026-08-02T00:45:00Z |
| latest verification | 2026-08-02 (09-B evidence retained) |
| journey | J2 |
| actor | uniApplicant / uniOwnerNoProfile |
| route | `/university/rejected` |
| locale / direction / viewport | ar / RTL / desktop |
| scenario | university rejected outcome |
| owning specification | 09 / Spec 03 |
| expected | Rejected outcome page |
| observed | 404 / unavailable during 09-B |
| server/persisted | rejected terminal verification exists |
| reproducibility | reproduced in 09-B |
| evidence | `J2-uni-rejected__ar__desktop__rejected.png` |
| privacy/security impact | none |
| severity | high |
| final classification | CLASS_A |
| status | OPEN |

## DEF-09C-001

| Field | Value |
|---|---|
| first-observed | 2026-08-02T01:20:00Z |
| latest verification | 2026-08-02T01:20:00Z |
| journey | J4 |
| actor | correctionSuggester |
| route | `/catalog/jid09-dir-corr-jid09-20260801-7d956c` |
| locale / direction / viewport | ar / RTL / desktop |
| scenario | `dir-correction-target` |
| owning specification | 09 / Spec 06 correction |
| expected | Catalog detail + correction suggestion form |
| observed | â€œCould not load catalogâ€ / error |
| server/persisted | Directory + pending suggestion rows exist |
| reproducibility | always in 09-C |
| evidence | `J4-corr-entry__ar__desktop__suggest-entry.png` |
| privacy/security impact | none (availability) |
| severity | high |
| final classification | CLASS_A |
| status | OPEN |

## DEF-09C-008

| Field | Value |
|---|---|
| first-observed | 2026-08-02T01:28:00Z |
| latest verification | 2026-08-02T01:35:00Z |
| journey | NEG N8 |
| actor | individual |
| route | `/ar/staff/verification` |
| locale / direction / viewport | ar / RTL / desktop |
| scenario | Individual â†’ Staff |
| owning specification | 09 Â§14 |
| expected | deny redirect / 404 / unauthorized |
| observed | URL retained on Staff route; empty body; no clear deny |
| server/persisted | N/A |
| reproducibility | reproduced on reprobe |
| evidence | `NEG-N8__ar__desktop__deny.png` |
| privacy/security impact | high â€” authorization boundary unclear |
| severity | critical |
| final classification | CLASS_A |
| status | OPEN |

## DEF-09C-009

| Field | Value |
|---|---|
| first-observed | 2026-08-02T01:28:00Z |
| latest verification | 2026-08-02T01:35:00Z |
| journey | NEG N19 |
| actor | bizOwnerPublished |
| route | `/ar/university/dashboard` |
| expected | cross-tenant deny |
| observed | URL retained; empty body |
| privacy/security impact | high |
| severity | critical |
| final classification | CLASS_A |
| status | OPEN |
| evidence | `NEG-N19__ar__desktop__cross-deny.png` |

## DEF-09C-010

| Field | Value |
|---|---|
| first-observed | 2026-08-02T01:28:00Z |
| latest verification | 2026-08-02T01:35:00Z |
| journey | NEG N20 |
| actor | uniOwnerPublished |
| route | `/ar/company/dashboard` |
| expected | cross-tenant deny |
| observed | URL retained; empty body |
| privacy/security impact | high |
| severity | critical |
| final classification | CLASS_A |
| status | OPEN |
| evidence | `NEG-N20__ar__desktop__cross-deny.png` |

## DEF-09C-011

| Field | Value |
|---|---|
| first-observed | 2026-08-02T01:28:00Z |
| latest verification | 2026-08-02T01:35:00Z |
| journey | NEG N21 |
| actor | individual |
| route | `/ar/company/profile/edit` |
| expected | deny |
| observed | URL retained; empty body |
| privacy/security impact | high |
| severity | critical |
| final classification | CLASS_A |
| status | OPEN |
| evidence | `NEG-N21__ar__desktop__deny.png` |

## DEF-09C-012

| Field | Value |
|---|---|
| first-observed | 2026-08-02T01:28:00Z |
| latest verification | 2026-08-02T01:28:00Z |
| journey | NEG N22 |
| actor | individual |
| route | `/ar/university/profile/edit` |
| expected | deny |
| observed | URL retained; empty body |
| privacy/security impact | high |
| severity | critical |
| final classification | CLASS_A |
| status | OPEN |
| evidence | `NEG-N22__ar__desktop__deny.png` |

## DEF-09C-013

| Field | Value |
|---|---|
| first-observed | 2026-08-02T01:28:00Z |
| latest verification | 2026-08-02T01:35:00Z |
| journey | NEG N23 |
| actor | correctionSuggester |
| route | `/ar/staff/directory/suggestions` |
| expected | deny |
| observed | URL retained; empty body |
| privacy/security impact | high |
| severity | critical |
| final classification | CLASS_A |
| status | OPEN |
| evidence | `NEG-N23__ar__desktop__deny.png` |

## DEF-09C-015

| Field | Value |
|---|---|
| first-observed | 2026-08-02T01:28:00Z |
| latest verification | 2026-08-02T01:28:00Z |
| journey | NEG N10 |
| actor | staffSelfReviewApplicant |
| route | self-review verification workspace |
| expected | clear self-review hard denial |
| observed | functional denial not verified; Staff page-load/MFA environment blocked walk |
| privacy/security impact | medium â€” inconclusive security cell |
| severity | high |
| final classification | CLASS_B |
| status | OPEN |
| rationale | Cannot classify as locked mechanical pass/fail without operable Staff surface; carry to release report |

## DEF-09C-016

| Field | Value |
|---|---|
| first-observed | 2026-08-02T01:35:00Z |
| latest verification | 2026-08-02T01:35:00Z |
| journey | NEG N26 |
| actor | anon |
| route | `/ar/sys/claims` |
| expected | route must not exist (404) |
| observed | Redirect to `/sys/login?next=/ar/sys/claims` |
| privacy/security impact | medium â€” historical Claim path still addressable under sys auth gate |
| severity | high |
| final classification | CLASS_B |
| status | OPEN |
| rationale | Touches historical Claim / sys routing policy; founder-facing release decision |

## DEF-09C-017

| Field | Value |
|---|---|
| first-observed | 2026-08-02T01:22:00Z |
| latest verification | 2026-08-02T01:22:00Z |
| journey | J4 / J6 publication apply proofs |
| actor | staffA / owners |
| route | Staff suggestions; owner publish controls |
| expected | Complete apply+audit and publish+audit proofs |
| observed | Blocked by DEF-09B-002; fixtures exist but journeys incomplete |
| privacy/security impact | none (evidence completeness) |
| severity | high |
| final classification | CLASS_B |
| status | OPEN |
| rationale | Evidence/environment limitation affecting release confidence; not a micro-fix of a single UI string |

---

## Linked symptoms of DEF-09B-002 (not double-counted)

| ID | Surface | Note |
|---|---|---|
| DEF-09C-002 | Staff correction queue | page-load error |
| DEF-09C-004â€¦007 | Owner publish/edit/dashboard | entity-type redirect |
| DEF-09C-014 | Staff keyboard a11y walk | blocked by queue load failure |

## Explicit empty-register statement

Not applicable â€” defects were recorded across Sessions 09-B and 09-C.
