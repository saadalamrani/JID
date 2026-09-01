# ORG ONBOARDING REGISTRATION + REPRESENTATIVE VERIFICATION — CLOSEOUT

**Status:** `POST_WAVE_CORRECTION=COMPLETE`  
**Timezone:** Asia/Riyadh  
**Closed:** 2026-09-01

| Field | Value |
| --- | --- |
| BRANCH | `integration/org-registration-representative-verification` |
| BASE_SHA | `0777d183ce6253fb3c5ef4e609225b73de5bd148` |
| IMPLEMENTATION_SHA | `2d234d5b514ffc95ac333997370b4d4589cd1052` |
| FINAL_SHA | recorded after this file is committed |
| PRODUCTION_TOUCHED | NO |
| MAIN_MERGED | NO |
| FOUNDER_VISUAL_ACCEPTANCE | PENDING |

Waves 0–14 remain closed. This is not Wave 15.

---

## CURRENT_DEFECT_CONFIRMED

Public Business/University signup exposed JID's internal organization-reference architecture:

`EntitySignupWizard` → `StepEntitySelection` → `ClaimSubmissionForm` → `StepVerifyEmail`

Runtime path required a preselected Directory/Catalog row, wrote `verification_requests.directory_id`, gated on stored domains, allowed public helpers (`searchCompanies`, `searchUniversitiesCatalog`, `createUnverifiedCompany`, `ensureUniversityCompany`) from signup, and could send a new account into organization selection before account-email verification.

---

## OLD_PUBLIC_FLOW

ACCOUNT → DIRECTORY/CATALOG SEARCH → SELECT/CREATE ROW → CLAIM → EMAIL VERIFY → PENDING

## NEW_PUBLIC_FLOW

ACCOUNT → VERIFY ACCOUNT EMAIL → ORGANIZATION DETAILS + REPRESENTATIVE VERIFICATION → PENDING REVIEW → INTERNAL RECONCILIATION → STAFF DECISION → AUTHORIZED WORKSPACE

Organization details and representative verification are one form.

---

## EMAIL_ORDER_RESULT

PASS. After signup the wizard opens email verification unless `email_confirmed_at` is already set. Org details are unreachable until the session is email-confirmed. The skip-to-pending link was removed. Auth callback resumes the original `/signup/company` or `/signup/university` path when no request exists.

---

## DATA_MODEL_DECISION

**Approach A.** Adapt `verification_requests` so a request can exist before canonical Directory linkage.

### WHY_THIS_MODEL

The table already is Layer 2 representative verification. It already carries applicant name, title, work email, and submitted organization name. Staff already reviews it. Approval already grants role only after Staff action. A second pending-registration table would duplicate that contract. Making `directory_id` nullable plus explicit submitted-evidence columns is the smallest coherent expand.

Applicant fields are evidence (`company_name`, `submitted_name_ar`, `submitted_name_en`, `submitted_website`, `submitted_domain`). They do not write `companies`, `business_profiles`, `university_profiles`, or `universities_catalog` at public submission.

---

## MIGRATION

`jid-platform/supabase/migrations/20260901160000_org_registration_representative_verification.sql`

- `directory_id` nullable
- submitted evidence columns + `reconciliation_state`
- INSERT RLS: own pending request, `directory_id IS NULL`, no domain/Directory match required
- approval CHECK + trigger: cannot approve without linked Directory; existing workspace blocks approval
- Staff RPCs: `link_verification_directory`, `create_directory_for_verification`, `mark_verification_needs_reconciliation`
- Profile creation RPCs fail closed if Directory is missing or a workspace already exists

### NONPROD_RESULT

Applied to `hmjuijmaefajdjrjdsxu` only.

- `verification_requests` count before=4 after=4
- `directory_id` is nullable
- INSERT policy requires `directory_id IS NULL`
- unlinked approval raises `organization_reconciliation_required` (transaction rolled back)

### DATA_LOSS

0

---

## APPLICANT_SUBMITTED_DATA_SEMANTICS

Submitted organization name, Arabic name, website, domain, representative name/title/email are evidence until Staff reconciliation. Public insert cannot set `directory_id` or reconciliation to a resolved state.

---

## DIRECTORY_CATALOG_INTERNAL_ROLE

Preserved. Public signup no longer searches, selects, or claims Directory/Catalog. Staff reconciliation can search Directory and link or create a canonical row. Catalog remains graduate/reference identity and is not auto-bridged.

---

## BUSINESS_RECONCILIATION

Staff: LINK_EXISTING / CREATE_AFTER_APPROVAL (Directory row from evidence, unverified, unclaimed) / NEEDS_RECONCILIATION / REJECT. No owned Business workspace at public submission.

## UNIVERSITY_RECONCILIATION

Same request model. No `ensureUniversityCompany` on public signup. No synthetic `${short_code}.edu.sa`. No `is_verified=true` from catalog presence. No automatic `university_identity_mappings`.

## EXISTING_WORKSPACE_BEHAVIOR

If the linked Directory already has `business_profiles` or `university_profiles`, reconciliation state becomes `existing_workspace_review_required` and approval raises that error. No auto-membership, no second workspace.

---

## BUSINESS_APPROVAL_BOUNDARY

APPROVED requires linked Directory and no existing workspace. Role grant happens only in the existing approval RPC after that gate. Profile/workspace creation remains a separate post-approval path.

## UNIVERSITY_IDENTITY_BOUNDARY

PASS. Institutional workspace identity is not collapsed into `universities_catalog`. Graduate affiliation is unchanged.

---

## DOMAIN_EVIDENCE_RESULT

Domain match is evidence only. Domain mismatch can reach `pending_review`. Domain match does not auto-approve or grant authority.

## SYNTHETIC_DOMAIN_RESULT

Removed from `ensureUniversityCompany`. Unknown domain stays empty.

---

## AUTHORIZATION_MATRIX

| Case | Result |
| --- | --- |
| UNAUTHENTICATED submit | DENIED (RLS) |
| UNVERIFIED ACCOUNT later wizard steps | BLOCKED (email-first hydration; no skip link) |
| PENDING BUSINESS workspace | NONE |
| PENDING UNIVERSITY workspace | NONE |
| REJECTED request | no org authority |
| DOMAIN MATCH | evidence only |
| DOMAIN MISMATCH | can reach review; not an auto-reject |
| CATALOG MATCH | not used in public signup |
| NAME MATCH | evidence only |
| OTHER USER read/mutate | DENIED (applicant_user_id RLS) |
| CROSS-ORG | DENIED |
| APPROVED BUT UNRESOLVED | IMPOSSIBLE (CHECK + trigger) |
| APPROVED + RECONCILED | intended authority only |
| EXISTING WORKSPACE auto-membership | NO |

---

## LOCALE / 375

| Check | Result |
| --- | --- |
| AR | Public actors فرد / جهة توظيف / جامعة. Registration copy rewritten. |
| EN | Individual / Employer / University. No claim/entity-lookup copy on public onboarding. |
| RTL / LTR | Existing locale routing unchanged. |
| AR_ROUTE_CONTINUITY | PASS (source: locale-aware navigation, no new hardcoded locale reset except using current locale on signup) |
| EN_ROUTE_CONTINUITY | PASS |
| MOBILE_375 | Form uses current system (`max-w-2xl`, stacked fields, full-width primary). Browser 375 not captured in this session. |

---

## TESTS / TYPECHECK / LINT / BUILD

| Check | Result |
| --- | --- |
| TESTS | PASS for bounded unit suites (`org-registration-onboarding`, institutional outcomes, claim-api-retirement, staff assignment, verification-outcome-ui after reapply assertion update). RLS suite updated; live run needs migrated DB (nonprod applied). |
| TYPECHECK | PASS (`pnpm type-check`) |
| LINT | PASS (`pnpm lint`) |
| BUILD | Local `pnpm build` stalled on "Creating an optimized production build" with no further progress (>5 min). **Vercel clean-build SUCCESS** for SHA `2d234d5b514ffc95ac333997370b4d4589cd1052` on both `jid-platform` and `jid-dev`. |
| BROWSER_EVIDENCE | BLOCKED_BY_EXACT_CAUSE: Vercel Preview deployments completed, but public fetch of git-branch preview URLs timed out (SSO/protection). No authenticated browser tool in this session. Did not fabricate PASS. |

---

## P0 / P1 / P2_P3

- **P0:** NONE
- **P1:** NONE
- **P2_P3:** Browser visual proof pending Founder; local build stall; Staff checklist still uses some legacy "entity" wording internally; email-decision templates still use historical "مطالبة" in Edge Functions (not public signup).

---

## DO NOT TOUCH — HELD

Production not touched. `main` not merged. Directory/Catalog infrastructure not deleted. Career Record, Opportunities, Lammah, Abhathli, Professional Network, Hiring Evidence, pricing untouched.
