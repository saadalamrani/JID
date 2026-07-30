# JID Spec 06 — Session C Disposable Database Transcript

## Gate

| Check | Result |
|---|---|
| Integration tip `origin/agent/nonprod-signup-form` | `19cb0112b05752530da3a8dcd9fd89c5958869bc` |
| Session 06-B tip `origin/cursor/jid-06b-correction-implementation` | `45020bb37d652bf0f6362ce5fb95b03515ed75ce` |
| Ledger on 06-B tip | Session 06-B COMPLETE; unpromoted; disposable-DB is promotion gate |
| 06-B SHA matches tip | yes |
| 06-B validation CI | Quality Gate success run `30573578420` on `codex/jid-06b-ci-validation` |
| 06-B already promoted | no (integration still at Session A SHA) |
| Integration ancestor of 06-B tip | yes (`merge-base --is-ancestor` exit 0) |
| 06-B diff inside Spec 06 authorized scope | yes (correction apply hardening + notify + tests/UI) |
| Worktree | `C:\Users\saada\Downloads\Desktop\JID-1-wt-06c` at exact 06-B SHA |
| Session branch | `cursor/jid-06c-security-validation` |

## Disposable environment

| Field | Value |
|---|---|
| Project name | `jid-06c-disposable` |
| API | `127.0.0.1:58421` |
| DB | `127.0.0.1:58422` |
| Shadow | `58420` |
| Studio | `58423` |
| Inbucket | `58424` |
| Pooler | `58429` |
| Analytics (disabled) | `58427` |
| Cloud / linked project | none |
| Credentials | local demo JWT keys only (anon + service_role demo); no real personal/org data |
| Temporary config | `supabase/config.toml` project_id + ports + seed disabled; restored to HEAD before commit |

### Migration / reset

1. First `supabase start` applied the full migration chain through `20260730190001_directory_correction_apply_hardening.sql`, then failed during seed on missing `public._seed_local_auth_user` (seed `local-test-accounts.sql`). Containers stopped.
2. Seed disabled for disposable stack (`[db.seed] enabled = false`). Synthetic fixtures created by the matrix harness instead.
3. Second `supabase start`: **PASS** — migrations applied through Session 06-B tip (`20260730190000`, `20260730190001` present in `supabase_migrations.schema_migrations`).
4. Applied disposable-only helper `tests/rls/fixtures/rls-test-role-helper.sql` (role setter, audit clear, correction fixture helpers). **Not** a product migration.

## Fixtures (synthetic only)

| Fixture | Purpose |
|---|---|
| Staff user (`staff` role via helper) | Positive approve/reject; privileged RPC |
| Non-staff authenticated (`individual`) | Negative RPC + companies UPDATE + forge attempts |
| Suggester (`individual`, owns suggestions) | Own-read; notification recipient |
| Other suggester | Cannot read foreign private suggestion |
| Anonymous client | Privileged RPC + private suggestion SELECT denial |
| Pending suggestion (approve) | POSITIVE A |
| Pending suggestion (reject) | POSITIVE B |
| Already-decided suggestion | Double-decision / already-reviewed denial |
| Whitelist-violating suggestion (`claimed_by`) | `field_not_allowed` |
| Ownership/Verification field suggestion (`is_verified`) | Profile/ownership/Verification denial |
| Orphan-directory pending suggestion | `directory_missing` + no orphan write |
| Second orphan pending suggestion | Atomicity failing approval |

## Positive matrix

| Cell | Result | Evidence |
|---|---|---|
| POSITIVE A — staff approves pending | **PASS** | `approve_correction_suggestion` null error; status `approved`; `reviewed_by` = staff |
| POSITIVE A — exactly one whitelist field (`city`) | **PASS** | city → `Jeddah`; website_url / career_portal_url / linkedin_url / twitter_url / sector_id / region_id unchanged |
| POSITIVE A — no Profile/ownership/Verification/status fields | **PASS** | `is_verified`, `is_active`, `claimed_by`, `name`, `name_ar` unchanged |
| POSITIVE A — suggestion decided | **PASS** | status `approved` |
| POSITIVE A — audit row | **PASS** | `audit_logs.action = directory.corrected`, entity = directory, actor = staff |
| POSITIVE A — suggester notification | **PASS** | Session 06-A `suggester_identity_supported=yes`; row `directory.correction_approved` with idempotency `directory.correction:<id>:approved` |
| POSITIVE B — staff rejects pending | **PASS** | `reject_correction_suggestion` null error |
| POSITIVE B — no companies field changes | **PASS** | city/website_url/is_verified/claimed_by equal before/after |
| POSITIVE B — decision recorded | **PASS** | status `rejected` |
| POSITIVE B — audit row | **PASS** | `directory.correction_rejected` on suggestion entity_id |
| POSITIVE B — notification | **PASS** | `directory.correction_rejected` idempotency key present |

## Negative matrix

| Cell | Result | Evidence |
|---|---|---|
| Non-staff RPC denied | **PASS** | `insufficient_privileges` |
| Non-staff server/action path denied | **PASS** | unit: `requireStaffShellAccess` fails before approve/reject RPC (`directory-correction-action.test.ts`) |
| Anonymous privileged invocation denied | **PASS** | anon RPC error |
| Non-whitelisted field denied | **PASS** | `field_not_allowed`; companies unchanged |
| Profile/ownership/Verification/status field denied | **PASS** | `is_verified` suggestion → `field_not_allowed`; companies ownership fields unchanged |
| Double-decision / already-decided denied | **PASS** | second approve + already-rejected → `invalid_or_reviewed` |
| Missing Directory honest failure | **PASS** | orphan `directory_id` → `directory_missing` |
| Missing target creates no orphan write | **PASS** | suggestion stays `pending`; no company row; no audit/notification for that suggestion |
| Suggester selects only own | **PASS** | own SELECT returns 1 row |
| Suggester cannot select another user’s private suggestion | **PASS** | other suggester SELECT returns `[]` |
| Anonymous reads no private suggestion data | **PASS** | anon SELECT returns `[]` |
| Direct unauthorized companies mutation denied | **PASS** | individual UPDATE city → no change |
| Audit/notification forge denied for ordinary client | **PASS** | INSERT errors on both tables (no INSERT policies) |

## Atomicity

| Cell | Result | Evidence |
|---|---|---|
| Failing approval (directory_missing) | **PASS** | error `directory_missing`; suggestion remains `pending` with null `reviewed_by`/`reviewed_at`; no company row created; no audit `new_data.suggestion_id`; no notification idempotency key |

Harness: `tests/rls/directory-correction-apply.rls.test.ts` — **13/13 passed** against disposable env.

## Security advisor / lint

| Tool | Result |
|---|---|
| `supabase inspect db advisors` | **not available** on CLI v2.20.12 |
| `supabase db lint --local` | Ran; reported **pre-existing** schema lint issues (e.g. legacy `claim_requests` references, unused params). **No new Spec 06 correction-path findings** requiring Session C product repair. |

## Scoped repairs

None required for product RPCs/migrations. Session C changes are evidence + matrix coverage only:

- Expanded disposable RLS matrix test
- Extended disposable-only RLS fixture helper SQL
- Unit assertion: non-staff action path denied before RPC

## Cleanup / destruction

| Check | Result |
|---|---|
| `supabase stop --no-backup` | success |
| Containers matching `jid-06c` | **zero** |
| Volumes matching `06c` | **zero** |
| Networks matching `jid-06c` | **zero** |
| Listeners on 58420–58429 | **none** (only brief TIME_WAIT from prior clients) |
| Cloud project created/changed | **no** |
| Real credentials/data used | **no** |
| `config.toml` restored to repository HEAD | **yes** (not committed disposable ports/project_id) |

## Local validation (from `jid-platform/`)

| Check | Result |
|---|---|
| `git diff --check` | PASS |
| `corepack pnpm install --frozen-lockfile` | PASS |
| `corepack pnpm lint` | PASS |
| `corepack pnpm type-check` | PASS |
| `corepack pnpm exec vitest run --testTimeout=30000` | PASS — 294 passed / 74 skipped (RLS suites skipped without disposable env; disposable env vars cleared after destruction) |
| `corepack pnpm build` | PASS |

Disposable matrix (with env live): `tests/rls/directory-correction-apply.rls.test.ts` **13/13 PASS**.
