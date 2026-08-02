# JID Spec 09 — Final QA Evidence Index (Session 09-B)

**JID09_RUN_ID:** `jid09-20260801-7d956c`
**Deployment:** `https://jid-dev.vercel.app`
**Canonical starting SHA:** `781eda57be124b798d66b7492cd71484e5b9ebed`
**Session 09-A implementation SHA:** `5d2f66888b6771708dd0c03833976f1a2f305fb4`
**Defect register:** `docs/command-center/reports/JID_09_Defect_Register.md`
**Machine index:** `INDEX.json`

## Coverage summary

| Dimension | Result |
|---|---|
| Arabic | exercised |
| English | exercised |
| Desktop | exercised |
| 375px | exercised |
| Captures committed | 61 |
| PASS cells | 3 |
| FAIL cells | 58 |

## Privacy / synthetic-data review

- Captures use synthetic QA names embedding `jid09-20260801-7d956c`.
- No passwords, cookies, tokens, API keys, or connection strings in screenshots.
- Browser developer tools were not committed.

## Entries

| File | Journey | Actor | Locale | Viewport | Pass/Fail | Defect |
|---|---|---|---|---|---|---|
| `J1-biz-create-profile__ar__desktop__approved-no-profile.png` | J1 | bizOwnerNoProfile | ar | desktop | FAIL | DEF-09B-003 |
| `J1-biz-create-profile__en__desktop__approved-no-profile.png` | J1 | bizOwnerNoProfile | en | desktop | FAIL | DEF-09B-003 |
| `J1-biz-dashboard__ar__desktop__published-owner.png` | J1 | bizApplicant/bizOwner* | ar | desktop | FAIL | DEF-09B-002 |
| `J1-biz-dashboard__en__375__published-owner.png` | J1 | bizApplicant/bizOwner* | en | 375 | FAIL | DEF-09B-002 |
| `J1-biz-draft-edit__ar__desktop__draft.png` | J1 | bizApplicant/bizOwner* | ar | desktop | FAIL | DEF-09B-002 |
| `J1-biz-draft-reload__ar__desktop__draft-reloaded.png` | J1 | bizApplicant/bizOwner* | ar | desktop | FAIL | DEF-09B-002 |
| `J1-biz-nonowner__ar__desktop__denied.png` | J1 | individual | ar | desktop | FAIL | DEF-09B-002 |
| `J1-biz-pending__ar__375__pending.png` | J1 | bizApplicant/bizOwner* | ar | 375 | FAIL | DEF-09B-002 |
| `J1-biz-pending__ar__desktop__pending.png` | J1 | bizApplicant/bizOwner* | ar | desktop | FAIL | DEF-09B-002 |
| `J1-biz-pending__en__375__pending.png` | J1 | bizApplicant/bizOwner* | en | 375 | FAIL | DEF-09B-002 |
| `J1-biz-pending__en__desktop__pending.png` | J1 | bizApplicant/bizOwner* | en | desktop | FAIL | DEF-09B-002 |
| `J1-biz-public__ar__desktop__published-public.png` | J1 | anon | ar | desktop | PASS | — |
| `J1-biz-public__en__desktop__published-public.png` | J1 | anon | en | desktop | PASS | — |
| `J1-biz-reapply__ar__desktop__reapply.png` | J1 | bizApplicant/bizOwner* | ar | desktop | FAIL | DEF-09B-002 |
| `J1-biz-reapply__en__desktop__reapply.png` | J1 | bizApplicant/bizOwner* | en | desktop | FAIL | DEF-09B-002 |
| `J1-biz-rejected__ar__desktop__rejected.png` | J1 | bizApplicant/bizOwner* | ar | desktop | FAIL | DEF-09B-002 |
| `J1-biz-rejected__en__desktop__rejected.png` | J1 | bizApplicant/bizOwner* | en | desktop | FAIL | DEF-09B-002 |
| `J1-biz-staff-reject__ar__desktop__rejected-decision-v2.png` | J1 | staffA | ar | desktop | FAIL | DEF-09B-002 |
| `J1-biz-staff-reject__ar__desktop__rejected-decision.png` | J1 | staffA | ar | desktop | FAIL | DEF-09B-002 |
| `J1-biz-suspended-public__ar__desktop__public-denied.png` | J1 | anon | ar | desktop | PASS | — |
| `J2-uni-create-profile__ar__desktop__approved-no-profile.png` | J2 | uniApplicant/uniOwner* | ar | desktop | FAIL | DEF-09B-002 |
| `J2-uni-dashboard__ar__desktop__dashboard.png` | J2 | uniApplicant/uniOwner* | ar | desktop | FAIL | DEF-09B-002 |
| `J2-uni-dashboard__en__desktop__dashboard.png` | J2 | uniApplicant/uniOwner* | en | desktop | FAIL | DEF-09B-002 |
| `J2-uni-draft-edit__ar__desktop__draft.png` | J2 | uniApplicant/uniOwner* | ar | desktop | FAIL | DEF-09B-002 |
| `J2-uni-pending__ar__375__pending.png` | J2 | uniApplicant/uniOwner* | ar | 375 | FAIL | DEF-09B-002 |
| `J2-uni-pending__ar__desktop__pending.png` | J2 | uniApplicant/uniOwner* | ar | desktop | FAIL | DEF-09B-002 |
| `J2-uni-pending__en__desktop__pending.png` | J2 | uniApplicant/uniOwner* | en | desktop | FAIL | DEF-09B-002 |
| `J2-uni-public__ar__desktop__published-public.png` | J2 | uniApplicant/uniOwner* | ar | desktop | FAIL | DEF-09B-004 |
| `J2-uni-reapply__ar__desktop__reapply.png` | J2 | uniApplicant | ar | desktop | FAIL | DEF-09B-001 |
| `J2-uni-reapply__en__desktop__reapply.png` | J2 | uniApplicant/uniOwner* | en | desktop | FAIL | DEF-09B-005 |
| `J2-uni-rejected__ar__desktop__rejected.png` | J2 | uniApplicant/uniOwner* | ar | desktop | FAIL | DEF-09B-005 |
| `J2-uni-rejected__en__desktop__rejected.png` | J2 | uniApplicant/uniOwner* | en | desktop | FAIL | DEF-09B-005 |
| `J2-uni-snap-absent__ar__desktop__snapshot-absent-or-suspended.png` | J2 | uniApplicant/uniOwner* | ar | desktop | FAIL | DEF-09B-002 |
| `J2-uni-snap-present__ar__desktop__snapshot-present-attempt.png` | J2 | uniApplicant/uniOwner* | ar | desktop | FAIL | DEF-09B-002 |
| `J2-uni-staff-reject__ar__desktop__rejected-decision-v2.png` | J2 | staffB | ar | desktop | FAIL | DEF-09B-005 |
| `J2-uni-staff-reject__ar__desktop__rejected-decision.png` | J2 | staffB | ar | desktop | FAIL | DEF-09B-005 |
| `J3-staff-approved-terminal__ar__desktop__approved-terminal-v2.png` | J3 | staffA | ar | desktop | FAIL | DEF-09B-002 |
| `J3-staff-approved-terminal__ar__desktop__approved-terminal.png` | J3 | staffA | ar | desktop | FAIL | DEF-09B-002 |
| `J3-staff-assigned-a__ar__desktop__assigned-reviewer-v2.png` | J3 | staffA | ar | desktop | FAIL | DEF-09B-002 |
| `J3-staff-assigned-a__ar__desktop__assigned-reviewer.png` | J3 | staffA | ar | desktop | FAIL | DEF-09B-002 |
| `J3-staff-history__en__desktop__history.png` | J3 | staffA | en | desktop | FAIL | DEF-09B-002 |
| `J3-staff-keyboard__ar__desktop__keyboard-focus-INPUT.png` | J3 | superAdmin | ar | desktop | FAIL | DEF-09B-002 |
| `J3-staff-keyboard__ar__desktop__keyboard-v2.png` | J3 | superAdmin | ar | desktop | FAIL | DEF-09B-002 |
| `J3-staff-no-filter-match__ar__desktop__no-match-v2.png` | J3 | staffA | ar | desktop | FAIL | DEF-09B-002 |
| `J3-staff-queue__ar__375__queue-v2.png` | J3 | staffA | ar | 375 | FAIL | DEF-09B-002 |
| `J3-staff-queue__ar__375__queue.png` | J3 | staffA | ar | 375 | FAIL | DEF-09B-002 |
| `J3-staff-queue__ar__desktop__queue-v2.png` | J3 | staffA | ar | desktop | FAIL | DEF-09B-002 |
| `J3-staff-queue__ar__desktop__queue.png` | J3 | staffA | ar | desktop | FAIL | DEF-09B-002 |
| `J3-staff-queue__en__375__queue-v2.png` | J3 | staffA | en | 375 | FAIL | DEF-09B-002 |
| `J3-staff-queue__en__375__queue.png` | J3 | staffA | en | 375 | FAIL | DEF-09B-002 |
| `J3-staff-queue__en__desktop__queue-v2.png` | J3 | staffA | en | desktop | FAIL | DEF-09B-002 |
| `J3-staff-queue__en__desktop__queue.png` | J3 | staffA | en | desktop | FAIL | DEF-09B-002 |
| `J3-staff-rejected-terminal__ar__desktop__rejected-terminal-v2.png` | J3 | staffA | ar | desktop | FAIL | DEF-09B-002 |
| `J3-staff-rejected-terminal__ar__desktop__rejected-terminal.png` | J3 | staffA | ar | desktop | FAIL | DEF-09B-002 |
| `J3-staff-sa-override__ar__desktop__super-admin-override-v2.png` | J3 | superAdmin | ar | desktop | FAIL | DEF-09B-002 |
| `J3-staff-sa-override__ar__desktop__super-admin-override.png` | J3 | superAdmin | ar | desktop | FAIL | DEF-09B-002 |
| `J3-staff-self-review__ar__desktop__self-review-block-v2.png` | J3 | staffSelfReviewApplicant | ar | desktop | FAIL | DEF-09B-002 |
| `J3-staff-self-review__ar__desktop__self-review-block.png` | J3 | staffSelfReviewApplicant | ar | desktop | FAIL | DEF-09B-002 |
| `J3-staff-unassigned-firstview__ar__desktop__assign-v2.png` | J3 | staffA | ar | desktop | FAIL | DEF-09B-002 |
| `J3-staff-view-only__ar__desktop__view-only-v2.png` | J3 | staffB | ar | desktop | FAIL | DEF-09B-002 |
| `J3-staff-view-only__ar__desktop__view-only.png` | J3 | staffB | ar | desktop | FAIL | DEF-09B-002 |

## Journey outcome (honest)

- **Business:** Public published Profile PASS; owner/applicant authenticated surfaces largely FAIL under DEF-09B-002; create-profile i18n FAIL (DEF-09B-003); Claim terminology on entity-type (DEF-09B-001).
- **University:** Public published Profile FAIL 404 (DEF-09B-004); rejected route FAIL (DEF-09B-005); dashboards/create blocked by DEF-09B-002.
- **Staff:** MFA enrollment + login PASS; verification queue/workspace FAIL page-load after MFA (DEF-09B-002). View-only / self-review / override functional assertions blocked by the same load failure.
