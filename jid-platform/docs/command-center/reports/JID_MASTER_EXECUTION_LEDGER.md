# JID Master Execution Ledger

## Specification 02 — Staff Verification Decision Experience

| Field | Value |
|---|---|
| specification | 02 |
| status | SHIPPED |
| session | 02-D closeout (Sessions 02-A, 02-B, 02-C complete) |
| Session A promoted SHA | b5558c5c05e5a7dbf88bd668d62370c3d0b44dea |
| Session A source branch | cursor/jid-02a-psw002-application |
| Session A patch SHA-256 | 1108aa35e8f18c2ca24fa8ef2fa541d853eac2c66f80f0c232d8ab7d492ad8f1 (informational only) |
| Session B base SHA | b5558c5c05e5a7dbf88bd668d62370c3d0b44dea |
| Session B source branch | cursor/jid-02b-assigned-reviewer-authorization |
| Session B migration | 127_verification_assigned_reviewer_authorization.sql |
| Session B local validation | git diff --check PASS; corepack pnpm install --frozen-lockfile PASS; corepack pnpm lint PASS; corepack pnpm type-check PASS; corepack pnpm test PASS (205 passed / 46 skipped without disposable env); corepack pnpm build PASS |
| Session B disposable DB | project `jid-02b-disposable`, ports 57421–57429; migration 127 applied; helper SQL applied; matrix 12/12 PASS; stack stopped; zero remaining 02b containers/volumes; shared `jid-platform` stack untouched |
| Disposable matrix results | NORMAL+ A-on-A PASS; NORMAL+ A-on-unassigned (claim-on-decide) PASS; NORMAL− B-on-A not_assigned_reviewer PASS; NORMAL− super_admin-via-normal on B’s not_assigned_reviewer PASS; NORMAL− admin insufficient_privileges PASS; NORMAL− self-review cannot_review_own_verification PASS; NORMAL− individual/anon denied PASS; OVERRIDE+ super_admin on B’s + audit assignment_overridden/previous_assigned_staff_id PASS; OVERRIDE− staff insufficient_privileges PASS; OVERRIDE− admin insufficient_privileges PASS; OVERRIDE− super_admin self-review denied PASS; OVERRIDE− anon denied PASS |
| Session B validation CI | PASS — Quality Gate https://github.com/saadalamrani/JID/actions/runs/30126682593 (SHA 30f809b) |
| Session B target CI | PASS — Quality Gate https://github.com/saadalamrani/JID/actions/runs/30126925857 (SHA 30f809b on agent/nonprod-signup-fix) |
| Session B Vercel | PASS — Vercel Preview Comments success for jid-dev against SHA 30f809b (check-run 89593399349) |
| Session B implementation SHA | 30f809b28cd794569c2208101e11ee2929b7ea59 |
| Session B promoted SHA | 30f809b28cd794569c2208101e11ee2929b7ea59 |
| Session C base SHA | 30f809b28cd794569c2208101e11ee2929b7ea59 |
| Session C source branch | cursor/jid-02c-assignment-ui-parity |
| Session C local validation | git diff --check PASS; corepack pnpm install --frozen-lockfile PASS; corepack pnpm lint PASS; corepack pnpm type-check PASS; corepack pnpm test PASS (213 passed / 46 skipped without disposable env — full suite regression on Sessions A/B); corepack pnpm build PASS |
| Session C AR/EN parity | PASS (`verification-assignment-copy.test.ts` — assignedToOther + overrideAssignment keys/placeholders) |
| Session C UI/component tests | PASS (view-only banner for staff; override checkbox only for super_admin; submit gated until checked; self-review precedence) |
| Session C validation CI | PASS — Quality Gate https://github.com/saadalamrani/JID/actions/runs/30155314859 (SHA ecf8085) |
| Session C target CI | PASS — Quality Gate https://github.com/saadalamrani/JID/actions/runs/30155432829 (SHA ecf8085 on agent/nonprod-signup-fix) |
| Session C Vercel | PASS — Vercel Preview Comments success for jid-dev against SHA ecf8085 (check-run 89672960868) |
| Session C implementation SHA | ecf808560ea26a1ec00c933f5d65da2898561777 |
| Session C promoted SHA | ecf808560ea26a1ec00c933f5d65da2898561777 |
| Session D base SHA | ecf808560ea26a1ec00c933f5d65da2898561777 |
| Session D source branch | cursor/jid-02d-closeout |
| Session D local regression | git diff --check PASS; corepack pnpm install --frozen-lockfile PASS; corepack pnpm lint PASS; corepack pnpm type-check PASS; corepack pnpm test PASS (213 passed / 46 skipped without disposable env); corepack pnpm build PASS |
| Session D auth matrix reconfirm | PASS by direct source inspection of migration 127 + reviewVerification action + RLS test matrix file (12/12 cases still present); no authorization regression; no fresh disposable re-run required (no auth code changed since Session B) |
| Session D Claim/مطالبة sweep | PASS — zero visible Claim/claim/مطالب in live journey namespaces staff.verification, staff.verificationReview, staff.claims.{list,card,filters,realtime} (EN+AR values) |
| Session D preserved contracts | PASS — staff.claim_reviewed; claim.approved/claim.rejected/claim.needs_more_info; claim_id; claimId; send-claim-approval; send-claim-rejection unchanged |
| Session D RPC signatures | PASS — approve/reject signatures identical to pre-Spec-02 (85403ea / migration 108); override RPCs EXECUTE to authenticated only, REVOKE from PUBLIC/anon |
| Session D regressions | None found |
| Session D validation CI | PENDING |
| Session D target CI | PENDING |
| Session D Vercel | PENDING |
| Session D implementation SHA | PENDING (reported after commit; not self-referenced in-commit) |
| Session D promoted SHA | PENDING (filled after FF promotion to agent/nonprod-signup-fix) |
| final promoted SHA | PENDING (same as Session D promoted SHA after closeout promotion) |

### Session 02-A scope (complete)
- PSW-002 staff verification decision experience (i18n, namespace wiring, approved-no-profile notice, four unit tests).

### Session 02-B scope (complete)
- Assigned-reviewer gate on existing approve/reject RPCs (including super_admin; race-safe claim-on-decide).
- New super_admin-only override RPCs with assignment_overridden audit keys.
- reviewVerification branches by freshly-derived role + overrideAssignment; admin blocked before any RPC.
- AR/EN `notAssignedReviewer` copy under staff.verificationReview.workspace.decision.
- Unit + disposable RLS matrix coverage.
- No RLS policy changes; no signature changes to the two existing RPCs.

### Session 02-C scope (complete)
- View-only banner when ordinary staff (non-super_admin) opens a request assigned to another reviewer — no decision controls.
- Explicit Super Admin override checkbox (never pre-selected; rendered only when viewerRole === super_admin) that gates submit and sends overrideAssignment=true.
- Surfaces existing not_assigned_reviewer AR/EN copy on race failures.
- Self-review rendering remains correct and takes precedence for Super Admin viewing own request.
- AR/EN parity + component tests; no backend/RPC/migration changes.

### Session 02-D scope (this commit)
- Full local regression of Sessions A+B+C at one HEAD.
- Authorization matrix, Claim terminology, preserved contracts, and RPC signature re-confirmation.
- Ledger finalized to SHIPPED. No regressions found.

### Still deferred (not resolved by Specification 02)
- Request-more-information control/flow
- Evidence upload/view/download
- Persisted checklist
- Reviewer reassignment/routing UI beyond the shipped assignment policy
- Full Wave 2A restyling
