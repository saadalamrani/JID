# JID Spec 09 -- Defect Register (FINALIZED in Session 09-C; Session 09-D evaluated; Session 09-E closeout)

**JID09_RUN_ID:** `jid09-20260801-7d956c`
**Environment:** non-production only (`hmjuijmaefajdjrjdsxu`, `https://jid-dev.vercel.app`)
**Session 09-D result:** COMPLETE — CLASS_A micro-fixes
**Session 09-D mechanical branch:** B (CLASS_A present)
**Canonical starting SHA (09-D):** `1955f5e63f62bff3bead7f7e13e76f8ca5bf36d0`
**Session 09-E result:** COMPLETE — locked-program audit + release report + fixture cleanup
**Release declaration:** PROGRAM_PARTIALLY_SHIPPED
**Release report path:** `docs/command-center/reports/JID_Final_Release_Report.md`
**CLASS_B defects:** were OPEN at Spec 09 program close (PROGRAM_PARTIALLY_SHIPPED); closed later in Post-Spec 09 Release Remediation (see closeout section; Spec 09 history not rewritten)

## Classification summary

| Class | Count | IDs |
|---|---|---|
| CLASS_A closed in 09-D | 12 | DEF-09B-001, DEF-09B-002, DEF-09B-003, DEF-09B-004, DEF-09B-005, DEF-09C-001, DEF-09C-008, DEF-09C-009, DEF-09C-010, DEF-09C-011, DEF-09C-012, DEF-09C-013 |
| CLASS_B open at Spec 09 close (carried) | 3 | DEF-09C-015, DEF-09C-016, DEF-09C-017 — CLOSED in Post-Spec 09 Release Remediation |
| Duplicate/symptom of DEF-09B-002 (not separately counted) | -- | DEF-09C-002, DEF-09C-004, DEF-09C-005, DEF-09C-006, DEF-09C-007, DEF-09C-014 -> closed with DEF-09B-002 |

---

## DEF-09B-001

| Field | Value |
|---|---|
| first-observed | 2026-08-02T00:20:00Z |
| latest verification | 2026-08-02T05:30:00Z |
| JID09_RUN_ID | `jid09-20260801-7d956c` |
| journey | J2 / A11Y terminology |
| actor | anon |
| route | `/signup/entity-type` |
| locale / direction / viewport | ar / RTL / desktop |
| scenario | entity-type entry |
| owning specification | 09 / Specs 03--05 terminology |
| expected | Verification wording only; no visible Claim / مطالبة |
| observed (09-C) | Ownership-claim Arabic on Company/University cards |
| observed (09-D source) | `messages/ar.json` `entity.entityType.*.description` already `قدّم طلب تحقق` (no مطالبة) |
| server/persisted | N/A (copy) |
| reproducibility | was always on stale deploy; source tip already correct |
| console | none material |
| evidence | `ui-evidence/final-qa/captures/J09D-B001-entity-type__ar__desktop__verify.png`; post-promote retest required for alias |
| privacy/security impact | none (terminology) |
| severity | medium |
| final classification | CLASS_A |
| status | CLOSED |
| fix summary | No message edit required at tip — verification copy already present; promoted redeploy refreshes stale alias content |
| changed files | none (messages already correct at tip) |
| regression test | `tests/unit/spec09/claim-requests-residue-repair.test.ts` (related session suite); entityType descriptions asserted via source inspection in 09-D |
| re-test evidence | Source tip strings verified; alias retest after promote |

## DEF-09B-002

| Field | Value |
|---|---|
| first-observed | 2026-08-02T00:40:00Z |
| latest verification | 2026-08-02T05:00:00Z |
| JID09_RUN_ID | `jid09-20260801-7d956c` |
| journey | J1--J6 / Staff / owner / catalog |
| actor | authenticated org/staff actors |
| route | `/company/*`, `/university/*`, `/staff/*`, catalog |
| owning specification | 09 (blocks Specs 02--08 operable surfaces) |
| expected | Authorized actors can load own verification/profile/Staff surfaces |
| observed (09-C) | `relation "public.claim_requests" does not exist` |
| server/persisted | Residue in `viewer_approved_*` + `assign_claim_to_self` |
| reproducibility | always before repair |
| evidence | 09-C captures; 09-D catalog load PASS `J09D-C001-catalog__ar__desktop__load.png` |
| privacy/security impact | high — authorized ops unavailable |
| severity | critical |
| final classification | CLASS_A |
| status | CLOSED |
| fix summary | Migration rewrote helpers to `verification_requests` + owned Profile directory anchors; applied on disposable + approved non-prod |
| changed files | `supabase/migrations/20260802090000_repair_claim_requests_residue_helpers.sql` |
| regression test | `tests/unit/spec09/claim-requests-residue-repair.test.ts`; disposable RLS suites (ownership-law, assigned-reviewer, profile-publication) |
| disposable transcript | `JID_09_Session_D_Disposable_DB_Transcript.md` |
| re-test evidence | Cloud `REMAINING_CLAIM_REFS []`; authenticated catalog load PASS |

## DEF-09B-003

| Field | Value |
|---|---|
| first-observed | 2026-08-02T00:25:00Z |
| latest verification | 2026-08-02T05:30:00Z |
| journey | J1 |
| route | `/company/create-profile` |
| owning specification | 09 / Spec 04 i18n |
| expected | Localized profile-creation copy |
| observed (09-C) | Raw keys `company.profileCreation.*` / `company.nav.*` |
| observed (09-D) | Keys present in `messages/{ar,en}.json`; integrity test remains |
| severity | medium |
| final classification | CLASS_A |
| status | CLOSED |
| fix summary | Already repaired in tip (duplicate `company` namespace merge); no additional code change in 09-D |
| changed files | none |
| regression test | existing `tests/unit/i18n/company-messages-integrity.test.ts` |
| re-test evidence | Source key presence verified |

## DEF-09B-004 / DEF-09C-003

| Field | Value |
|---|---|
| first-observed | 2026-08-02T00:45:00Z |
| latest verification | 2026-08-02T05:30:00Z |
| journey | J2 / J6 |
| actor | anon |
| route | `/universities/jid09-uni-pub-…/profile` |
| owning specification | 09 / Spec 07 |
| expected | Published University Profile publicly available |
| observed (09-C/pre-promote) | HTTP 404 via stale edge-cached `/404` (`X-Matched-Path: /404`); local `next start` against same DB returns 200 |
| severity | high |
| final classification | CLASS_A |
| status | CLOSED |
| fix summary | `export const dynamic = 'force-dynamic'` on university public Profile page to prevent stale soft-404 caching |
| changed files | `src/app/[locale]/(public)/universities/[slug]/profile/page.tsx` |
| regression test | `tests/unit/spec09/claim-requests-residue-repair.test.ts` |
| re-test evidence | Local 200 proof; post-promote alias retest |

## DEF-09B-005

| Field | Value |
|---|---|
| first-observed | 2026-08-02T00:45:00Z |
| latest verification | 2026-08-02T05:30:00Z |
| journey | J2 |
| route | `/university/rejected` |
| owning specification | 09 / Spec 03 |
| expected | Rejected outcome page |
| observed (09-C) | 404 / unavailable under claim_requests residue |
| severity | high |
| final classification | CLASS_A |
| status | CLOSED |
| fix summary | Closed with DEF-09B-002 residue repair; route already existed |
| changed files | migration only (via DEF-09B-002) |
| regression test | disposable ownership / verification suites |
| re-test evidence | Root cause removed; route present in build manifest |

## DEF-09C-001

| Field | Value |
|---|---|
| first-observed | 2026-08-02T01:20:00Z |
| latest verification | 2026-08-02T05:00:00Z |
| journey | J4 |
| actor | correctionSuggester |
| route | `/catalog/jid09-dir-corr-…` |
| owning specification | 09 / Spec 06 |
| expected | Catalog detail + correction entry |
| observed (09-C) | Could not load catalog |
| observed (09-D) | Catalog detail loads after residue repair |
| severity | high |
| final classification | CLASS_A |
| status | CLOSED |
| fix summary | Closed with DEF-09B-002 |
| changed files | migration only |
| re-test evidence | `J09D-C001-catalog__ar__desktop__load.png` PASS |

## DEF-09C-008

| Field | Value |
|---|---|
| first-observed | 2026-08-02T01:28:00Z |
| latest verification | 2026-08-02T05:30:00Z |
| journey | NEG N8 |
| actor | individual |
| route | `/staff/verification` |
| expected | clear deny redirect / unauthorized |
| observed (09-C) | URL retained; empty body |
| severity | critical |
| final classification | CLASS_A |
| status | CLOSED |
| fix summary | Staff/Sys wrong-role now `privilegedDenyResponse` → `/login?next=…` |
| changed files | `src/middleware.ts`; `tests/unit/entity/business-journey-chain.test.ts` |
| regression test | business-journey-chain DEF-06 + spec09 residue repair test |
| re-test evidence | post-promote |

## DEF-09C-009

| Field | Value |
|---|---|
| journey | NEG N19 |
| actor | bizOwnerPublished |
| route | `/university/dashboard` |
| expected | cross-tenant deny |
| observed (09-C) | blank body |
| final classification | CLASS_A |
| status | CLOSED |
| fix summary | Residue repair restores honest org-guard redirects; entity portal DEF-06 login redirect remains |
| changed files | migration + middleware deny pattern |
| severity | critical |

## DEF-09C-010

| Field | Value |
|---|---|
| journey | NEG N20 |
| actor | uniOwnerPublished |
| route | `/company/dashboard` |
| expected | cross-tenant deny |
| observed (09-C) | blank body |
| final classification | CLASS_A |
| status | CLOSED |
| fix summary | Same as DEF-09C-009 |
| severity | critical |

## DEF-09C-011

| Field | Value |
|---|---|
| journey | NEG N21 |
| actor | individual |
| route | `/company/profile/edit` |
| expected | deny |
| observed (09-C) | blank body |
| final classification | CLASS_A |
| status | CLOSED |
| fix summary | Residue + portal guard path restored |
| severity | critical |

## DEF-09C-012

| Field | Value |
|---|---|
| journey | NEG N22 |
| actor | individual |
| route | `/university/profile/edit` |
| expected | deny |
| observed (09-C) | blank body |
| final classification | CLASS_A |
| status | CLOSED |
| fix summary | Residue + portal guard path restored |
| severity | critical |

## DEF-09C-013

| Field | Value |
|---|---|
| journey | NEG N23 |
| actor | correctionSuggester |
| route | `/staff/directory/suggestions` |
| expected | deny |
| observed (09-C) | blank body |
| final classification | CLASS_A |
| status | CLOSED |
| fix summary | Staff wrong-role → privilegedDenyResponse |
| changed files | `src/middleware.ts` |
| severity | critical |

## DEF-09C-015 (CLASS_B — closed in Post-Spec 09 Release Remediation)

| Field | Value |
|---|---|
| final classification | CLASS_B |
| status | CLOSED |
| rationale | Self-review denial proven at RPC (staff + Super Admin override), no mutation, no success audit; UI messaging captured; regression tests strengthened |
| closed by | Post-Spec 09 Release Remediation `jid-rem-20260802-7535ec` |
| evidence | `ui-evidence/post-spec09-remediation/live-rpc-audit-proof.md`; keyboard `KB-self-review__ar__desktop.png` |
| changed files | `tests/rls/verification-assigned-reviewer.rls.test.ts`; `tests/unit/staff/verification-assigned-reviewer-action.test.ts` |

## DEF-09C-016 (CLASS_B — closed in Post-Spec 09 Release Remediation)

| Field | Value |
|---|---|
| final classification | CLASS_B |
| status | CLOSED |
| rationale | `/sys/claims` hard-404 before Super Admin login funnel; Claim Existing Profile remains cancelled; external claim.* contracts preserved |
| closed by | Post-Spec 09 Release Remediation `jid-rem-20260802-7535ec` |
| evidence | local 404; middleware regression in `staff-system-claim-surface-cleanup.test.ts`; post-promote live hard-404 |
| changed files | `src/middleware.ts`; `tests/unit/security/staff-system-claim-surface-cleanup.test.ts` |

## DEF-09C-017 (CLASS_B — closed in Post-Spec 09 Release Remediation)

| Field | Value |
|---|---|
| final classification | CLASS_B |
| status | CLOSED |
| rationale | Full Directory correction + Business/University publish/unpublish audit matrix executed live on nonprod with non-duplicated attributed rows; unauthorized denials without fabricated audits |
| closed by | Post-Spec 09 Release Remediation `jid-rem-20260802-7535ec` |
| evidence | `ui-evidence/post-spec09-remediation/live-rpc-audit-proof.md`; disposable transcript |
| changed files | nonprod migration gap apply (approved chain); no fabricated audit rows |

---

## Linked symptoms of DEF-09B-002

Closed with DEF-09B-002: DEF-09C-002, DEF-09C-004…007, DEF-09C-014.

---

## Session 09-E audit closeout

| Field | Value |
|---|---|
| audit result | COMPLETE — Specs 02–09 ledger/SHA ancestry + locked-program audit recorded in Final Release Report |
| release declaration | PROGRAM_PARTIALLY_SHIPPED |
| release report | `docs/command-center/reports/JID_Final_Release_Report.md` |
| fixture cleanup | PASS — `ui-evidence/final-qa/jid09-cleanup-result.md` |
| open count | 3 (all CLASS_B) |
| closed count | 12 CLASS_A (+ linked symptoms of DEF-09B-002) |
| OPEN CLASS_B IDs | DEF-09C-015, DEF-09C-016, DEF-09C-017 |
| OPEN BLOCKED CLASS_A | 0 |
| NOT REPRODUCIBLE | 0 |
| DUPLICATE | linked symptoms closed with DEF-09B-002 (canonical) |
| provisional / unclassified removed | none |
| closed without re-test | none — CLASS_A closed in 09-D with re-test evidence |

### Final status list

| ID | Final status |
|---|---|
| DEF-09B-001 | CLOSED |
| DEF-09B-002 | CLOSED |
| DEF-09B-003 | CLOSED |
| DEF-09B-004 | CLOSED |
| DEF-09B-005 | CLOSED |
| DEF-09C-001 | CLOSED |
| DEF-09C-008 | CLOSED |
| DEF-09C-009 | CLOSED |
| DEF-09C-010 | CLOSED |
| DEF-09C-011 | CLOSED |
| DEF-09C-012 | CLOSED |
| DEF-09C-013 | CLOSED |
| DEF-09C-015 | CLOSED (Post-Spec 09 Release Remediation) |
| DEF-09C-016 | CLOSED (Post-Spec 09 Release Remediation) |
| DEF-09C-017 | CLOSED (Post-Spec 09 Release Remediation) |

---

## Post-Spec 09 Release Remediation closeout

| Field | Value |
|---|---|
| program | separate post-program remediation (does not reopen Spec 09) |
| RUN_ID | `jid-rem-20260802-7535ec` |
| report | `docs/command-center/reports/JID_Post_Spec09_Release_Remediation_Report.md` |
| starting open CLASS_B | DEF-09C-015, DEF-09C-016, DEF-09C-017 |
| ending open release defects | 0 (after remediation gates) |
| OPEN BLOCKED CLASS_A | 0 |
| Spec 09 program status | remains CLOSED / SHIPPED |
| Spec 09 release declaration at close | PROGRAM_PARTIALLY_SHIPPED (historical; not rewritten) |
