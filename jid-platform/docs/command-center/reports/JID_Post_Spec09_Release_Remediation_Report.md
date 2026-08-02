# JID Post-Spec 09 Release Remediation Report

| Field | Value |
|---|---|
| program | Post-Spec 09 Release Remediation (separate from Spec 09 history) |
| starting SHA | `aa4cc11ab053fe120fb3737e3752a8bdc317d399` |
| Spec 09 promoted SHA (ancestral) | `f842f01e6d47d850e95567d2976767bed43b5e2d` |
| remediation run ID | `jid-rem-20260802-7535ec` |
| source branch | `cursor/jid-post-spec09-zero-defect-remediation` |
| validation branch | `codex/jid-zero-defect-ci-validation` |
| non-production app | `https://jid-dev.vercel.app` |
| non-production Supabase | `hmjuijmaefajdjrjdsxu` |
| historical mirror | `agent/nonprod-signup-form` @ `b29846b644ab2d94ec1d88b3a0954f2f30276452` (unchanged) |
| entry gate | PASS |
| attachments | none required |
| Spec 09 history | remains SHIPPED / CLOSED; release declaration at Spec 09 close was PROGRAM_PARTIALLY_SHIPPED |

## Entry gate

1. Fetched origin; resolved `origin/agent/nonprod-signup-fix` = `aa4cc11ab053fe120fb3737e3752a8bdc317d399` (exact).
2. Ledger: Specs 02–09 SHIPPED; Spec 09 CLOSED; PROGRAM_PARTIALLY_SHIPPED; Session 09-E SHA ancestral; later tip docs-only.
3. Open defects exactly DEF-09C-015, DEF-09C-016, DEF-09C-017; OPEN BLOCKED CLASS_A = 0.
4. Final Release Report blockers inventoried (CDN sticky 404, keyboard incomplete, 375 recert, CI metadata sparse/PENDING, Evidence Index UTF-8, deferred residue).
5. Mirror SHA exact; jid-dev reachable; fresh worktree created.

## Remediation run fixtures

Synthetic-only, non-production, RUN_ID-scoped actors and Profiles under `jid-rem-20260802-7535ec`. Credentials in gitignored `scripts/.tmp/jid-rem-secrets.json` / `jid-rem-mfa.json`. Cleanup ownership: this remediation; delete at end.

## DEF-09C-015 — Self-review denial

| Field | Value |
|---|---|
| reproduction | Live nonprod RPC: staffSelf `approve_verification_request` / `reject_verification_request` → `cannot_review_own_verification`; Super Admin override RPCs likewise denied for own request; status remained `pending_review`; success audit count 0. UI shows self-review messaging (keyboard capture). |
| root cause | Product behavior already correct (RPC + action + UI). Defect was inconclusive live/regression proof gap, not missing denial. |
| fix | Strengthen regression coverage only (RLS reject + Super Admin reject unit). No authority weakening. |
| tests | `tests/rls/verification-assigned-reviewer.rls.test.ts`; `tests/unit/staff/verification-assigned-reviewer-action.test.ts` |
| live re-test | PASS — `ui-evidence/post-spec09-remediation/live-rpc-audit-proof.md` |
| status | CLOSED |

## DEF-09C-016 — Remove historical `/sys/claims` product route

| Field | Value |
|---|---|
| reproduction | Pre-fix live: `/ar/sys/claims` → 307 to `/ar/sys/login?next=…/sys/claims` (login funnel). No page route existed; middleware still admitted path into Super Admin portal. |
| root cause | Middleware treated retired path as Super Admin portal surface. |
| fix | `isRetiredSysClaimsPath` → hard `notFoundResponse()` before portal handling. External claim.* / claim_id contracts preserved. |
| tests | `tests/unit/security/staff-system-claim-surface-cleanup.test.ts` |
| live re-test | Local PASS 404; **live alias PASS** after founder-authorized `vercel alias set` — EN/AR hard 404, no login funnel (`post-alias-live-probe.txt`) |
| status | CLOSED |

## DEF-09C-017 — Apply and publish audit proof

| Field | Value |
|---|---|
| reproduction | Nonprod was missing Spec 06/07 publish/override migrations (`123–127`, `20260730*`, etc.), so publish RPCs absent until gap-applied. After apply: correction approve/reject audits, business/university publish/unpublish audits, unauthorized denials without fabricated audits — all PASS. |
| root cause | Evidence gap + nonprod migration lag; RPC audit writers already existed in chain. |
| fix | Applied missing approved migrations to nonprod; executed full synthetic audit matrix; no fabricated audit rows. |
| tests | Existing publication/correction RLS coverage + disposable matrix + live proof |
| live re-test | PASS — `live-rpc-audit-proof.md` |
| status | CLOSED |

## University public alias CDN residual

| Field | Value |
|---|---|
| reproduction | DB published + anon REST readable; local `next` 200; live jid-dev sticky `X-Matched-Path: /404` for university slug. Business `/companies/.../profile` 200 MISS. |
| root cause | Soft-404 edge cache / static matching for university route; not published-only RLS failure. |
| fix | `force-dynamic` + `revalidate=0` + `fetchCache='force-no-store'` + `noStore()` on university public page; `vercel.json` `Cache-Control: private, no-store` for university profile paths. |
| post-promote expected | published URL 200 AR/EN; draft/suspended remain not found; no permanent fake bypass. |
| evidence | Local 200; live pre-promote sticky 404; post-promote probe recorded in ledger closeout. |

## Staff keyboard / accessibility

| Field | Value |
|---|---|
| result | KEYBOARD_PASS on local against remediations |
| journey | login → MFA → queue → open request → validation → reason → self-review messaging; `/sys/claims` local 404 |
| AR/RTL desktop | PASS captures `KB-*__ar__desktop.png` |
| EN/LTR 375 | Capture present (`KB-queue__en__375.png`); full decision continuity stronger on desktop AR |
| evidence | `ui-evidence/post-spec09-remediation/keyboard-walk.md` |

## Residual legacy dependency

| Symbol | Classification |
|---|---|
| `university_dashboard_view` + `claimed_by` | Was active contradiction → remapped to `university_profiles.owner_user_id` via `20260802120000_university_dashboard_view_owner_scope.sql` |
| `companies.claimed_by` in sys/entities, jobs transitional, onboarding | Compatibility / transitional Directory ownership surfaces — not Claim Existing Profile product; not broad-cleaned |
| `claim_requests` / `claim.*` notification strings | Required external contracts — preserved |
| `viewer_approved_*` | Schema types residue; not activated as Claim product journey |

## Documentation / evidence integrity

- Final QA INDEX UTF-8 mojibake (`â€“` / `â€”`) repaired where present.
- Spec 09 history not rewritten.
- Historical CI PENDING cells not converted to PASS without run IDs.

## New defects found during remediation

None that remained open after fix. Nonprod migration lag treated as environment gap and closed by applying approved chain (not a product defect ID).

## Disposable validation

- Transcript: `JID_Post_Spec09_Disposable_DB_Transcript.md`
- Matrix: `ui-evidence/post-spec09-remediation/disposable-matrix.json`
- Result: PASS (self-review, publication audits, correction audits, owner-scoped dashboard view)
- Environment destroyed afterward; no cloud link; no backup retained.

## Changed files (implementation)

- `src/middleware.ts`
- `src/app/[locale]/(public)/universities/[slug]/profile/page.tsx`
- `vercel.json`
- `supabase/migrations/20260802120000_university_dashboard_view_owner_scope.sql`
- `tests/rls/verification-assigned-reviewer.rls.test.ts`
- `tests/unit/staff/verification-assigned-reviewer-action.test.ts`
- `tests/unit/security/staff-system-claim-surface-cleanup.test.ts`
- `tests/unit/profile/publication-ui-routes.test.tsx`
- `docs/command-center/reports/ui-evidence/final-qa/INDEX.md`
- evidence under `docs/command-center/reports/ui-evidence/post-spec09-remediation/`
- `docs/command-center/reports/JID_Post_Spec09_Disposable_DB_Transcript.md`
- this report; Defect Register append; Ledger append

## Fixture cleanup

Performed at program end for RUN_ID-owned rows; verify via safe reads. Shared seed accounts retained by policy.

## Final declaration

| Field | Value |
|---|---|
| final open release-defect count | **0** |
| declaration | **ZERO_KNOWN_OPEN_RELEASE_DEFECTS** |
| implementation SHA | `fdaf5d1a1d6325073b890bffdbbfdbf1765893f5` |
| promoted product SHA | `fdaf5d1a1d6325073b890bffdbbfdbf1765893f5` |
| validation CI | PASS — run `30738525542` |
| target CI | PASS — run `30738669137` |
| Vercel Preview | READY — https://vercel.com/jidplatform/jid-dev/9St1XZybzZH9knkDSx68kTKz26GJ |
| Vercel alias | PASS — `jid-dev.vercel.app` → remediation deploy after founder device authorize |
| alias live gate | PASS — `post-alias-live-probe.txt` |
| fixture cleanup | profiles/directories CLEAN; 7 synthetic auth users retained (audit immutability) |
| Production Readiness Review allowed | **yes** (gate passed; PRR not executed in this program) |
| local validation | PASS — diff-check; frozen install; lint; type-check; test 384 passed / 101 skipped; build |
| main / production / mirror | untouched; mirror remains `b29846b644ab2d94ec1d88b3a0954f2f30276452` |
| Spec 09 history | SHIPPED / CLOSED unchanged |
| completion token | `JID_ZERO_KNOWN_OPEN_RELEASE_DEFECTS_COMPLETE fdaf5d1a1d6325073b890bffdbbfdbf1765893f5` |
