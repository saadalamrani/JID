# JID-102A — Verification and Claim Security Closure Report

Date: 2026-07-20 (Asia/Riyadh)

## Result

JID-102A is locally complete. Applicant INSERT authority on `verification_requests` is restricted to a legitimate initial request, Staff decision fields remain RPC/database-controlled, the legacy privileged catalog Claim API is retired, and the legitimate Business/University verification wizard remains independent and functional.

This report does not mark the full JID-102 package complete. GitHub Actions validation is recorded in the delivery response after the branch push.

No Supabase cloud project, remote database, Vercel project, production resource, non-production cloud resource, real user/organization data, secret, `main`, or shared local `jid-platform` stack was contacted or modified.

## Step 0 and pre-fix evidence

- Required base and refreshed remote: `8772951a92c1e46b968d682ed3aad89ae99c9e20`.
- Isolated branch/worktree: `codex/jid-102a-verification-claim-security`.
- Isolated tracked state was clean before implementation.
- Effective `verification_requests` schema had 26 columns. `status` defaulted to `pending`; the legitimate `EntitySignupWizard` submission service explicitly used `pending_review`, which is therefore the current legitimate initial state.
- Status enum values were `pending`, `submitted`, `pending_review`, `under_review`, `needs_more_info`, `approved`, `rejected`, and `cancelled`. Verification types were `business` and `university`.
- The effective applicant INSERT policy checked only `applicant_user_id = auth.uid()`. Authenticated users retained full-table INSERT privilege. There was no INSERT trigger and no column-level submission boundary.
- A synthetic disposable defensive regression assertion confirmed that the pre-fix policy incorrectly accepted Staff-controlled verification values. No reusable bypass procedure or real data was used or retained.
- Direct UPDATE remained unavailable by design. Staff approval/rejection used the existing security-definer `approve_verification_request` and `reject_verification_request` RPCs with role checks and audit logging.
- Approval granted the appropriate organization role but did not insert a Business or University Profile. Profile creation remained a separate `create_business_profile` / `create_university_profile` RPC action requiring an approved matching verification.
- Legitimate submission traced end to end as `EntitySignupWizard` → `ClaimSubmissionForm` → `submitClaimRequest` → authenticated `verification_requests` INSERT. It did not call `/api/catalog/claim` or `src/lib/catalog/claim.ts`.
- Rejection/reapplication behavior used the Staff rejection RPC's 7-day `can_reapply_after` value and the existing submission-service gate.
- The legacy `/api/catalog/claim` route alone imported `src/lib/catalog/claim.ts`; that helper used an admin client to update `companies.entity_state`, `companies.claimed_by`, and `companies.claim_requested_at` after creating a verification row.
- The directly connected public entry point was `UnclaimedCTA`, rendered by `CompanyProfileView` and linking to a Directory-claim path.
- The next migration was created with the repository Supabase CLI as `20260720072615_harden_verification_request_insert_boundary.sql`.
- The JID-107 migration and focused moderation test were unchanged.

## Verification INSERT boundary

The forward-only migration creates `verification_applicant_insert_initial_own` and narrows authenticated INSERT privileges to the nine fields used by the legitimate submission service.

The resulting applicant boundary requires:

- `applicant_user_id = auth.uid()`;
- status exactly `pending_review`;
- empty/default applicant evidence state;
- null/default reviewer, decision, moderation, audit, verified-domain, and resulting-Profile state;
- an existing active Directory record whose ID, canonical name, and Business/University type match the request;
- an institutional email domain matching the Directory domain list;
- no existing active verification for the applicant;
- no active rejection/reapplication cooldown.

Authenticated applicants have column-level INSERT permission only for `applicant_user_id`, `directory_id`, `company_name`, `business_email`, `claimant_name`, `claimant_title`, `evidence_urls`, `status`, and `verification_type`. Anonymous INSERT remains denied.

The duplicate-active/cooldown check is implemented by a non-callable security-definer trigger function. It reads request state only, does not mutate Directory/Profile data, and has EXECUTE revoked from `PUBLIC`, `anon`, and `authenticated`.

Staff decision RPC definitions and grants are unchanged. Approval remains audited and creates no Profile automatically.

## Legacy API retirement

Removed:

- `src/app/api/catalog/claim/route.ts`;
- `src/lib/catalog/claim.ts`;
- `src/components/profile/unclaimed-cta.tsx`;
- the `UnclaimedCTA` import and render path in `CompanyProfileView`.

The removed route is absent and therefore resolves through normal Next.js not-found behavior. No application source calls `/api/catalog/claim`, `submitCatalogClaim`, or `checkClaimableProfile`. The retired path can no longer invoke an admin client, write Directory ownership/state fields, create a verification request, or redirect to another claim workflow.

The independent signup submission service and both Business and University signup pages remain unchanged.

## Test evidence

### Defensive pre-fix regression

- Synthetic assertion: 1 passed.
- Result: current applicant policy incorrectly accepted Staff-controlled verification values.
- The initial command's suite teardown reported a missing local fixture helper; the assertion itself passed. The repository fixture helper was then loaded and all synthetic residue was removed before implementation testing.

### Focused post-fix gate

Command covered `verification-insert-boundary.rls.test.ts` and `claim-api-retirement.test.ts`:

- Test files: 2 passed.
- Tests: 13 passed.
- Failed/skipped: 0/0.

The focused RLS file alone passed 10/10 assertions after the final duplicate/cooldown boundary.

### Complete disposable RLS gate

- Fresh stack applied all 122 migration files, including the finalized JID-102A migration in repository order.
- Test files: 5 passed.
- Tests: 34 passed.
- Failed: 0.
- Skipped: 0.
- Existing pre-JID-102A assertions: 24/24 passed.
- New JID-102A assertions: 10/10 passed.
- Focused unchanged JID-107 moderation assertions: 10/10 passed.

The matrix covers anonymous denial; legitimate Business/University submission; all non-initial statuses; reviewer/decision/moderation/audit/result fields; cross-user, Directory type/name/domain checks; duplicate/cooldown checks; pending Business/University Profile denial; audited Staff approval/rejection; no automatic Profile creation; and valid reapplication after the cooldown expires.

## Quality gate

- `git diff --check`: PASS.
- `corepack pnpm --version`: PASS, `9.15.4`.
- `corepack pnpm install --frozen-lockfile`: PASS; 829 packages reused, 0 downloaded.
- Manifest/lockfile mutation check: PASS.
- `corepack pnpm lint`: PASS, 0 warnings and 0 errors.
- `corepack pnpm type-check`: PASS.
- `corepack pnpm test`: PASS; 10 files passed, 5 environment-gated RLS files skipped; 45 safe tests passed, 34 RLS tests skipped in this ordinary command, 0 failed.
- `corepack pnpm build`: PASS after outbound access was allowed solely for the repository-configured Google Fonts; compilation, lint/type validation, and 264/264 static pages succeeded. The retired `/api/catalog/claim` route is absent from the route manifest.
- Initial sandboxed build: failed only because Google Fonts network access was denied with `EACCES`; no application compiler defect was reported.
- Forbidden generated-file and tracked-path check: PASS before delivery.

## Disposable environment and cleanup

- Temporary project configuration: `jid-102a-disposable` (Docker normalized runtime resources to `jid-102a1-disposable`).
- Unique temporary port range: `57420–57429`; unused before startup.
- API/database ports: `57421` / `57422` on the developer machine under the task's explicit Docker Desktop publication authorization.
- Seeds: disabled.
- Cloud link/remote credentials: absent.
- Synthetic fixtures only; pre-cleanup Auth users, verification requests, Business Profiles, and University Profiles were each zero.
- Disposable containers remaining: 0.
- Disposable volumes remaining: 0.
- Disposable networks remaining: 0.
- Temporary workdir remaining: false.
- Shared `jid-platform` containers still running: 9; none were stopped, reset, or written.

The Supabase CLI returned success while leaving its normalized database container and two volumes running. Exact normalized resource names were inspected, constrained to the disposable suffix, removed explicitly, and re-verified at zero.

## Files changed

Created:

- `supabase/migrations/20260720072615_harden_verification_request_insert_boundary.sql`
- `tests/rls/verification-insert-boundary.rls.test.ts`
- `tests/unit/catalog/claim-api-retirement.test.ts`
- `docs/command-center/reports/JID-102A_VERIFICATION_CLAIM_SECURITY_REPORT.md`

Modified:

- `src/components/profile/company-profile-view.tsx`
- `tests/rls/fixtures/ownership-law.ts`
- `docs/command-center/TASK_BOARD.md`

Deleted:

- `src/app/api/catalog/claim/route.ts`
- `src/lib/catalog/claim.ts`
- `src/components/profile/unclaimed-cta.tsx`

## Reuse and scope decisions

- Reused the existing `EntitySignupWizard`, `ClaimSubmissionForm`, `submitClaimRequest`, Directory domain utilities, Staff decision RPCs, Profile-creation RPCs, RLS client helpers, role fixtures, and Directory fixtures.
- No dependency, application data source, dynamic UI content, locale copy, actor role, billing/jobs/team/dashboard behavior, Profile publication behavior, or JID-107 moderation definition changed.
- Broad claim terminology/internal identifier cleanup, the legacy `claimed_by` columns, and unrelated transitional organization routes remain assigned to later JID-102 phases.

## Remaining risks

- This phase proves only the bounded verification INSERT and retired catalog API boundaries. Other legacy claim-named internal routes/identifiers and retained Directory columns remain outside JID-102A.
- Cloud environments were intentionally not inspected; only the disposable local schema was verified.
- Supabase CLI 2.20.12 cleanup does not reliably identify its normalized resource suffix, so future disposable runs must verify containers, volumes, and networks independently rather than trusting the stop exit code alone.
