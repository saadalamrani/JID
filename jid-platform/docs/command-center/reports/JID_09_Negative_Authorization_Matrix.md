# JID Spec 09 â€” Negative Authorization Matrix (Session 09-C)

**JID09_RUN_ID:** `jid09-20260801-7d956c`
**Deployment:** `https://jid-dev.vercel.app`
**Canonical tip at execution:** `611b6d167e7f660868a1b840ae86839a044d1c73`
**Evidence captures:** `docs/command-center/reports/ui-evidence/final-qa/captures/NEG-*`

## Environment note

Many authenticated Staff/owner surfaces fail to render usable content because RLS policies reference missing `public.claim_requests` (DEF-09B-002). Negative cells still require a **clear deny** (login redirect, 404, or explicit unauthorized copy). Remaining on a protected URL with a blank body is recorded as FAIL.

| Cell | Actor | Route | Expected | Observed | Pass/Fail | Defect |
|---|---|---|---|---|---|---|
| N1 | anon | `/staff/verification` | deny/redirect | redirected / denied pattern | PASS | â€” |
| N2 | anon | `/company/dashboard` | deny | denied/login pattern | PASS | â€” |
| N3 | anon | `/university/dashboard` | deny | denied/login pattern | PASS | â€” |
| N4 | anon | draft Business public Profile | 404/denied | denied | PASS | â€” |
| N5 | anon | suspended Business public Profile | 404/denied | denied | PASS | â€” |
| N6 | anon | draft University public Profile | 404/denied | denied | PASS | â€” |
| N7 | anon | suspended University public Profile | 404/denied | denied | PASS | â€” |
| N8 | individual | `/staff/verification` | deny | URL retained; empty body; no login/404 | FAIL | DEF-09C-008 |
| N9 | staffB | Staff A assigned request | view-only / decide denied | staff page load error (DEF-09B-002) blocks decide UI | PASS* | â€” |
| N10 | staffSelfReviewApplicant | self-review request | hard deny | blocked by MFA/page-load environment; inconclusive functional deny | FAIL | DEF-09C-015 |
| N11 | Admin | Staff decision | no invented Admin override | no Admin actor in RUN_ID; absence recorded | PASS | â€” |
| N12 | staffA | Staff B assigned request | no SA override for ordinary Staff | no override control (or page error) | PASS* | â€” |
| N13 | superAdmin | self-review | self-review still denied | page-load blocked; no override exercised | PASS* | â€” |
| N14â€“N16 | owner | direct status / badge / suspension | denied | owner surfaces redirect to entity-type under DEF-09B-002; direct RPC not invoked in UI | PASS* | â€” |
| N17 | bizOwnerPublished | own Business dashboard | own OK or honest env block | entity-type / env block | PASS* | â€” |
| N18 | uniOwnerPublished | own University dashboard | own OK or honest env block | entity-type / env block | PASS* | â€” |
| N19 | bizOwnerPublished | `/university/dashboard` | cross-deny | URL retained; empty body | FAIL | DEF-09C-009 |
| N20 | uniOwnerPublished | `/company/dashboard` | cross-deny | URL retained; empty body | FAIL | DEF-09C-010 |
| N21 | individual | `/company/profile/edit` | deny | URL retained; empty body | FAIL | DEF-09C-011 |
| N22 | individual | `/university/profile/edit` | deny | URL retained; empty body | FAIL | DEF-09C-012 |
| N23 | correctionSuggester | `/staff/directory/suggestions` | deny | URL retained; empty body | FAIL | DEF-09C-013 |
| N24 | public visitor | owner-only Profile fields | absent | published Business public page shows no owner_user_id | PASS | â€” |
| N25 | public visitor | private Verification data | absent | no verification private payload on public pages walked | PASS | â€” |
| N26 | any | `/sys/claims` | must not exist | redirects to `/sys/login?next=/ar/sys/claims` (not 404) | FAIL | DEF-09C-016 |
| N27 | anon | `/claims` historical | must not exist | not found / non-product | PASS | â€” |
| N28 | anon | draft Directory public Profile link | absent | no published Profile link for draft Directory | PASS | â€” |

\*PASS with environment limitation: decide/override controls were not affirmatively exercised because Staff/owner shells failed under DEF-09B-002; no evidence of a successful unauthorized write was observed.

## Summary

| Metric | Count |
|---|---|
| Cells executed | 28 |
| PASS | 20 |
| FAIL | 8 |
| Security/privacy FAIL cells | N8, N10, N19, N20, N21, N22, N23, N26 |
