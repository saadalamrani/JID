# JID-102D1 — Staff and System Claim Surface Cleanup

## Report

**Base:** `e360c2b` on `cursor/jid-102d1-staff-system-claim-cleanup` (clean fresh worktree,
`C:\Users\saada\Downloads\Desktop\JID-worktrees\jid-102d1-staff-system-claim-cleanup-fresh`).
**Execution mode:** mechanical rename/cleanup implemented directly against the live tree, not
via `git apply` of the delivered `JID-102D1-CLAUDE.patch`.

## Reference patch validation

`JID-102D1-CLAUDE.patch` (present untracked at the repo root) was written against a different
base commit (`claude/jid-102a2-claim-api-retirement`, pre-JID-102B). A cold `git apply --check`
against this worktree's actual base (`e360c2b`) was attempted first:

- `git apply --check JID-102D1-CLAUDE.patch` from `jid-platform/` — **failed**, as expected,
  because the patch's paths are rooted one level up (`jid-platform/src/...` vs. this repo's
  `src/...` when run from inside `jid-platform/`) and because line-ending/context drift exists
  between the patch's base and `e360c2b`. No trailing-LF-only mechanical fix made it applicable
  cleanly; the instruction to attempt `git apply --check` and adapt mechanically was honored by
  reading the entire patch as a **reference for exact before/after content** and re-implementing
  every change by hand against the real current file contents (each file was read and diffed
  against the patch's "before" hunk before editing — all matched byte-for-byte except where noted
  below), rather than forcing a partial/corrupt apply.
- Patch file checksum actually computed in this environment:
  `sha256(JID-102D1-CLAUDE.patch) = 0af040c1a35fa48e2747bbd895ec66b2b5b32bc5ad05c91072222d94267cb158`
  (Windows `Get-FileHash`, SHA256). This does **not** match the `4c847842...` prefix given in the
  task instructions, nor the `ca3614721ef3f7f26b17d2bc06e920ee6a8971445244d6717a29f95b9e49ac98`
  value the patch's own embedded report claims for itself — flagging this discrepancy rather than
  silently asserting a match. It did not block the work since the patch was used only as a
  read-only reference, never applied.

## Files renamed (`git mv`)

| Before | After |
|---|---|
| `src/app/[locale]/(staff)/staff/claims/_components/claim-card.tsx` | `src/app/[locale]/(staff)/staff/verification/_components/verification-card.tsx` |
| `src/app/[locale]/(staff)/staff/claims/_components/claims-filters.tsx` | `src/app/[locale]/(staff)/staff/verification/_components/verification-filters.tsx` |
| `src/app/[locale]/(staff)/staff/claims/_components/claims-list.tsx` | `src/app/[locale]/(staff)/staff/verification/_components/verification-list.tsx` |
| `src/app/[locale]/(staff)/staff/claims/_components/realtime-claims-updater.tsx` | `src/app/[locale]/(staff)/staff/verification/_components/realtime-verification-updater.tsx` |
| `src/app/[locale]/(staff)/staff/claims/[id]/_components/checklist-panel.tsx` | `src/app/[locale]/(staff)/_components/checklist-panel.tsx` (shared — also used by mentor-applications workspace) |
| `src/app/[locale]/(staff)/staff/claims/[id]/_components/related-history-panel.tsx` | `src/app/[locale]/(staff)/staff/verification/[id]/_components/related-history-panel.tsx` |
| `src/lib/staff/claim-urgency.ts` | `src/lib/staff/verification-urgency.ts` |
| `src/lib/staff/claim-review-shared.ts` | `src/lib/staff/verification-review-shared.ts` |
| `src/lib/staff/claim-review-queries.ts` | `src/lib/staff/verification-review-queries.ts` |
| `src/lib/staff/notify-claim-decision.ts` | `src/lib/staff/notify-verification-decision.ts` |
| `src/app/[locale]/(sys)/sys/dashboard/_components/claims-queue-widget.tsx` | `src/app/[locale]/(sys)/sys/dashboard/_components/verification-queue-widget.tsx` |

## Files deleted (`git rm`) — confirmed zero live callers by exhaustive grep before removal

- `src/app/[locale]/(staff)/staff/claims/[id]/_components/claim-review-workspace.tsx`
- `src/app/[locale]/(staff)/staff/claims/[id]/_components/claim-decision-form.tsx`
- `src/app/[locale]/(staff)/staff/claims/actions.ts`
- `src/app/[locale]/(staff)/_components/claim-review-modal.tsx`
- `src/app/[locale]/(staff)/_components/claims-list.tsx` (a second, unrelated `ClaimsList` — not the one reused by the live verification pages)
- `src/app/[locale]/(staff)/_components/claim-checklist.tsx`
- `src/hooks/use-claims-queue.ts`
- `src/lib/staff/review-claim.ts`

## Symbol/export renames and import fixes across `src`

- `ClaimCard` → `VerificationCard`; `ClaimCardProps` → `VerificationCardProps`
- `ClaimsFilters` → `VerificationFilters`; `filterClaimsItems` → `filterVerificationItems`; `ClaimsFilterState` → `VerificationFilterState`
- `ClaimsList`/`ClaimsListWithFilters` → `VerificationList`/`VerificationListWithFilters`
- `RealtimeClaimsUpdater` → `RealtimeVerificationUpdater`; internal type `ClaimRealtimeRow` → `VerificationRealtimeRow`; Realtime channel name `'staff-claims-queue'` → `'staff-verification-queue'`
- `getClaimUrgencyTier` → `getVerificationUrgencyTier`; `ClaimUrgencyTier` → `VerificationUrgencyTier`; `ClaimUrgencyFilter` → `VerificationUrgencyFilter`
- `RelatedClaimHistoryItem` → `RelatedVerificationHistoryItem`; its `claim_type` field → `verification_type` (rendered directly to staff, so the underlying rename is safe)
- `buildDefaultClaimChecklist` → `buildDefaultVerificationChecklist`; `isClaimPendingReview` → `isVerificationPendingReview` (`MENTOR_CHECKLIST_KEYS`/`buildDefaultMentorChecklist` unchanged — not claim-named)
- `notifyClaimDecision` → `notifyVerificationDecision`; internal type `NotifyClaimInput.claimId` → `NotifyVerificationInput.verificationId`
- `ClaimsQueueWidget` → `VerificationQueueWidget`; prop `claims` → `items`; removed the dead "view all" link to the never-existent `/sys/claims` route (documented in-file)
- `PendingClaimPreview` → `PendingVerificationPreview`; `SysDashboardData.claims` → `SysDashboardData.pendingVerifications`
- `fetchPendingClaimsPreview` → `fetchPendingVerificationsPreview`; local `PENDING_CLAIM_STATUSES` (in `dashboard-queries.ts`) → `PENDING_VERIFICATION_STATUSES`
- Dropped the deprecated `ClaimReviewWorkspaceData` type and `fetchClaimReviewWorkspace()` back-compat alias from `verification-review-queries.ts` (confirmed its only caller was the now-deleted `claim-review-workspace.tsx`)

Import-site updates (no symbol rename, path/reference fix only):
- `src/lib/staff/claims-queue.ts` — `resolveSlaDueAt` import now from `verification-urgency`
- `src/app/[locale]/(staff)/staff/verification/actions.ts` — `notifyVerificationDecision` import/call sites (2)
- `src/app/[locale]/(staff)/staff/verification/page.tsx`, `my-queue/page.tsx`, `history/page.tsx` — `VerificationListWithFilters` import path + JSX usage
- `src/app/[locale]/(staff)/staff/verification/_components/verification-kanban.tsx` — `VerificationCard` import (relative, same directory now)
- `src/app/[locale]/(staff)/staff/verification/[id]/page.tsx` — `verification-review-queries` import path
- `src/app/[locale]/(staff)/staff/verification/[id]/_components/verification-review-workspace.tsx` — all four renamed imports + two call sites
- `src/app/[locale]/(staff)/staff/verification/[id]/_components/related-history-panel.tsx` — renamed import + `verification_type` field
- `src/app/[locale]/(staff)/staff/mentor-applications/[id]/_components/mentor-application-workspace.tsx` — relocated `checklist-panel` + renamed `verification-review-shared` imports
- `src/lib/sys/nav.ts` — removed `claims` entries from `SYS_NAV_SECTIONS` and `SYS_QUICK_ACTIONS`; removed now-unused `ClipboardList` icon import
- `src/lib/sys/dashboard-queries.ts` — renamed type imports/re-exports, function, local const, and `fetchSysDashboardData()`'s returned field
- `src/app/[locale]/(sys)/sys/page.tsx` — widget import/usage + `fetchPendingVerificationsPreview` call; `AlertsBar`'s `overdueClaims` prop and `metrics.overdue_claims` **left untouched** (materialized-view column, schema-bound, out of scope)
- `src/types/sys-dashboard.ts` — type rename + field rename + stale comment fix

## Test added

- `tests/unit/security/staff-system-claim-surface-cleanup.test.ts` — 6 describe blocks / 34
  individual assertions (many via `it.each`) proving: no `/sys/claims` nav/quick-action entries,
  no dead `/sys/claims` links anywhere in `src`, all live `/staff/verification/*` routes and their
  renamed dependencies exist, all 5 `/staff/claims` redirect stubs still redirect correctly and no
  other file remains under that directory, no deleted file path or deleted identifier is referenced
  anywhere in `src`, and the explicitly out-of-scope surfaces (public claim submission flow,
  `/api/catalog/claim` retirement, Directory `claimed_by` ownership model) are unchanged. A 7th
  check was added beyond the reference patch to permanently guard the preserved contracts below
  (`staff.claim_reviewed`, `claim.*` categories, `claim_id`, edge function names, `claimId` body key).

## MUST-PRESERVE contracts — verified intact, byte-identical

Per this task's explicit instructions (which take precedence over the reference patch, which had
renamed some of these):

- **Analytics event `staff.claim_reviewed`** — **left unchanged**, in both
  `src/lib/analytics/staff-events.ts` (`STAFF_ANALYTICS_EVENTS` union) and its only call site
  (`src/app/[locale]/(staff)/staff/verification/actions.ts`'s `trackServer('staff.claim_reviewed', ...)`,
  including its `claim_id` payload field). This is a deliberate deviation from the reference
  `JID-102D1-CLAUDE.patch`, which had renamed this event to `staff.verification_reviewed` — that
  rename was explicitly reverted/not-applied here per this task's MUST-PRESERVE list.
- **External notify categories** `claim.approved` / `claim.rejected` / `claim.needs_more_info` — unchanged in `notify-verification-decision.ts`.
- **Payload field `claim_id`** in the `email_outbox` insert — unchanged.
- **Edge Function names** `send-claim-approval` / `send-claim-rejection` — unchanged.
- **Invoke body shape `{ claimId }`** — unchanged (the internal `NotifyVerificationInput.verificationId` is mapped to `claimId` at the call boundary, exactly as before).

Grep-verified after all edits: zero remaining references anywhere in `src` to any deleted file
path or deleted identifier (`ClaimCard`, `ClaimsFilters`, `filterClaimsItems`, `ClaimsFilterState`,
`ClaimsListWithFilters`, `RealtimeClaimsUpdater`, `ClaimReviewWorkspace`, `ClaimDecisionForm`,
`ClaimReviewModal`, `ClaimChecklist`, `ClaimsQueueWidget`, `PendingClaimPreview`,
`fetchPendingClaimsPreview`, `fetchClaimReviewWorkspace`, `ClaimReviewWorkspaceData`,
`notifyClaimDecision`, `getClaimUrgencyTier`, `buildDefaultClaimChecklist`,
`isClaimPendingReview`, `RelatedClaimHistoryItem`, `useClaimsQueue`, `reviewClaimRequest`,
`ClaimUrgencyTier`, `ClaimUrgencyFilter`).

## Deliberately out of scope — untouched, confirmed by grep and the added tests

- `lib/staff/claims.ts`, `lib/staff/claims-queue.ts` (its own exports/types), `lib/staff/types.ts`
  (`ClaimQueueItem`, `StaffClaimsQueueItem`, `StaffDashboardClaimRow`, `ClaimReviewDecision`,
  `ReviewClaimRpcInput`) and their consuming dashboard widgets (`assigned-claims.tsx`,
  `unassigned-queue.tsx`) — live, claim-named, but not part of this task's renamed-component list.
- The staff command-palette "claims" search category (`lib/staff/nav.ts`, `lib/staff/search.ts`,
  `staff-command-palette.tsx`) and `lib/staff/constants.ts`'s `'claims'` search keyword.
- i18n namespace keys under `staff.claims.*` / `staff.claimReview.*` in `messages/en.json` /
  `messages/ar.json` — internal lookup keys, not renamed.
- `lib/entity/claims.ts` (public claim submission — `submitClaimRequest`), `components/entity/claim-submission-form.tsx`, `components/entity/entity-signup-wizard.tsx`.
- `app/[locale]/(sys)/sys/entities/actions.ts` — Directory `claimed_by` / `entity_state: 'unclaimed'` ownership model, confirmed still present and unchanged in shape.
- `mv_sys_dashboard_metrics.overdue_claims` (materialized-view column) and `AlertsBar`'s `overdueClaims` prop.
- `supabase/migrations/**` — no changes.

## Redirect stubs preserved

All 5 stubs under `src/app/[locale]/(staff)/staff/claims/` kept exactly as-is and confirmed by the
build and the added test to still redirect into `/staff/verification`:
`page.tsx`, `queue/page.tsx`, `my-queue/page.tsx`, `history/page.tsx`, `[id]/page.tsx`.

## Gate results

Run from `jid-platform/` on this fresh worktree (Windows/PowerShell, Node v24.18.0, corepack pnpm):

| Command | Result |
|---|---|
| `corepack pnpm install --frozen-lockfile` | **PASS** — lockfile up to date, 829 packages resolved, install completed in ~53s. (`husky` prepare script printed a harmless `.git can't be found` notice — expected in this worktree layout, non-fatal, exit code 0.) |
| `corepack pnpm lint` | **PASS** — `✔ No ESLint warnings or errors`. |
| `corepack pnpm type-check` (`tsc --noEmit`) | **PASS** — zero TypeScript errors, exit code 0. |
| `corepack pnpm test` (`vitest run`) | **PASS** — 126 passed, 34 skipped (pre-existing skips, unrelated to this change), 0 failed, across 12 run test files. One self-inflicted failure was found and fixed during this run: the new regression test's own directory-walk helper produced Windows (`\`) path separators, which failed a string-equality assertion against POSIX-style expected paths; fixed by normalizing separators in the test helper — not a product bug. |
| `corepack pnpm build` (`next build`, with `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321` + a local Supabase demo anon JWT) | **PASS** — compiled successfully, 268 static pages generated, zero build errors. `/staff/verification`, `/staff/verification/[id]`, `/staff/verification/history`, `/staff/verification/my-queue`, `/staff/verification/queue` all present in the route manifest; all 5 `/staff/claims` redirect routes also present and generated; **no `/sys/claims` route exists in the manifest** (confirms it was correctly a dead nav target before this cleanup and remains absent now). |

No failures caused by this cleanup were found; the one test failure encountered was in the new
test file added by this task and was fixed as part of it.

## Confirmation: `staff.claim_reviewed` preserved

Confirmed unchanged, exact string match, in:
1. `src/lib/analytics/staff-events.ts` — still present verbatim in `STAFF_ANALYTICS_EVENTS`.
2. `src/app/[locale]/(staff)/staff/verification/actions.ts` — still the exact string passed to
   `trackServer(...)`, with its `claim_id` payload field also unchanged.
3. Encoded permanently as a regression assertion in the new test file (describe block 6, last test).

## Remaining issues / follow-ups (not blocking, none introduced by this cleanup)

- The reference `JID-102D1-CLAUDE.patch` file and the stray `cursor-jid-102d1-aborted.diff` at the
  repository root are leftover artifacts from prior aborted attempts (per the task's own framing)
  and were left untouched/unstaged, as instructed ("Do NOT commit"). They were not deleted since
  the task did not ask for repository-root cleanup, only the `src`/`docs`/`tests` cleanup described
  above.
- Everything the reference patch itself flagged as pre-existing, deferred work (command-palette
  "claims" category, `lib/staff/claims.ts`/`claims-queue.ts` type layer, i18n key namespaces) is
  still open and was intentionally not touched — it is outside this task's explicit rename list.

## Final state

`CODE_COMPLETE`
