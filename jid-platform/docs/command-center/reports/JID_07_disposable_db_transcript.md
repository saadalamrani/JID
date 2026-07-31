# JID Spec 07 — Session C Disposable Database Transcript

## Gate

| Check | Result |
|---|---|
| Canonical tip `origin/agent/nonprod-signup-fix` | `b29846b644ab2d94ec1d88b3a0954f2f30276452` (exact expected) |
| Historical mirror `origin/agent/nonprod-signup-form` | equals canonical tip (not used/updated) |
| Session 07-B tip `origin/cursor/jid-07b-publication-backend` | `46244bd43f660f7ac046d23d114d0abb8b65cdcf` |
| Ahead/behind vs canonical | `0 1` — exactly one clean commit; not divergent |
| 07-B validation CI | Quality Gate **success** run `30602710065` on `codex/jid-07b-ci-validation` |
| 07-B already promoted | **no** |
| Diff scope | publication migration, wrappers/actions, published-profile queries, types, AR/EN errors, unit+RLS tests, ledger only |
| Worktree | `C:\Users\saada\Downloads\Desktop\JID-1-wt-07c` at exact 07-B SHA |
| Session branch | `cursor/jid-07c-security-validation` |

## Disposable environment

| Field | Value |
|---|---|
| Project name | `jid-07c-disposable` |
| API | `127.0.0.1:58721` |
| DB | `127.0.0.1:58722` |
| Shadow | `58720` |
| Studio | `58723` |
| Inbucket | `58724` |
| Pooler | `58729` |
| Analytics (disabled) | `58727` |
| Cloud / linked project | **none** (`supabase projects list` → no project ref / not linked for this stack) |
| Credentials | local demo JWT keys only (anon + service_role demo); no real personal/org data |
| Temporary config | `supabase/config.toml` project_id + ports + seed disabled for the run; restored to HEAD before commit |

### Migration / reset

1. Command: `corepack pnpm exec supabase start` from `jid-platform/` with disposable `config.toml`.
2. Result: **PASS** — full migration chain applied through `20260730190003_profile_publication_rpcs.sql`.
3. Final version in `supabase_migrations.schema_migrations`: **`20260730190003`** (also present: `20260730190000`…`20260730190002`).
4. Seed disabled (`[db.seed] enabled = false`); fixtures created by the matrix harness.
5. Applied disposable-only helper `tests/rls/fixtures/rls-test-role-helper.sql` (not a product migration).
6. No cloud project contacted.

## Fixtures (synthetic only)

| Fixture | Purpose |
|---|---|
| Business owner A (`company_admin`) | Positive publish/unpublish; content edit; owner reads |
| University owner B (`university_admin`) | University matrix parity |
| Authenticated non-owner C | Negative RPC + UPDATE denial |
| Ordinary Staff | Suspension + staff SELECT |
| Super Admin | Reinstate/suspend check (existing mechanism) |
| Anonymous client | Public SELECT + RPC EXECUTE denial |
| Business/University Directory references | Separate from Profiles; never owned |
| Draft Profiles (ready / missing name / missing about / missing both) | Positive + minimum-field cells |
| Published Profiles | Unpublish, public SELECT, Directory link |
| Suspended Profiles | Precedence + public invisibility |

All labels/domains use `07c` / `jid.local.test` synthetic values.

## Positive publish matrix

| Cell | Business | University |
|---|---|---|
| Owner publishes own draft | **PASS** | **PASS** |
| Only `display_name_ar` + `about_ar` required (optional fields null) | **PASS** | **PASS** |
| status draft → published | **PASS** | **PASS** |
| published_at non-null | **PASS** | **PASS** |
| exactly one new `profile.published` audit | **PASS** | **PASS** |
| Directory unchanged | **PASS** | **PASS** (Directory fixture untouched) |
| owner_user_id unchanged | **PASS** | **PASS** |
| no new Profile created | **PASS** | **PASS** |
| RPC safe result keys only (`id`,`status`,`published_at`) | **PASS** | **PASS** |
| anon SELECT published succeeds | **PASS** | **PASS** |

Harness: `tests/rls/profile-publication-matrix.rls.test.ts` + `tests/rls/profile-publication.rls.test.ts`.

## Positive unpublish matrix

| Cell | Business | University |
|---|---|---|
| Owner unpublishes own published | **PASS** | **PASS** |
| status published → draft | **PASS** | **PASS** |
| published_at null | **PASS** | **PASS** |
| one `profile.unpublished` audit | **PASS** | **PASS** |
| publicly invisible after | **PASS** | **PASS** |
| owner_user_id unchanged / row not deleted | **PASS** | **PASS** |

## Minimum-field failures

| Cell | Business | University |
|---|---|---|
| Missing `display_name_ar` only | **PASS** | **PASS** |
| Missing `about_ar` only | **PASS** | **PASS** |
| Both missing (exactly those two) | **PASS** | **PASS** |
| State remains draft; published_at null; no success audit | **PASS** | **PASS** |
| Optional fields not required | **PASS** (null en/tagline/cover/founded/employee_count / established) | **PASS** |

## RPC authorization

| Cell | Result |
|---|---|
| Anon EXECUTE denied (`has_function_privilege` false; RPC errors) | **PASS** |
| Non-owner publish/unpublish denied (`not_profile_owner`) | **PASS** |
| Cross-type RPC (Business RPC on University id / reverse) | **PASS** |
| No false success audit on denied attempts | **PASS** |
| EXECUTE granted to `authenticated` only among anon/authenticated/PUBLIC | **PASS** |
| No new global privileged role | **PASS** |

## Direct status-write prevention

| Cell | Result |
|---|---|
| Owner raw UPDATE draft→published denied (trigger) | **PASS** |
| Owner raw UPDATE published→draft denied | **PASS** |
| Owner raw UPDATE to suspended denied | **PASS** |
| Owner UPDATE on suspended: RLS silent deny and/or trigger; status stays suspended | **PASS** |
| Owner content field UPDATE still works | **PASS** |
| Non-owner / anon UPDATE denied | **PASS** |
| Staff suspension path unchanged | **PASS** |

## Public SELECT RLS

| Actor | published | draft | suspended |
|---|---|---|---|
| Anonymous | **PASS** visible | **PASS** no row | **PASS** no row |
| Authenticated non-owner | **PASS** | **PASS** no row | **PASS** no row |
| Owner | **PASS** | **PASS** readable | **PASS** readable |
| Staff | **PASS** (incl. suspended) | — | **PASS** |

Public application query foundation (Session 07-B) selects public-safe columns only (contract unit tests); RLS is authoritative.

## Suspension precedence

| Cell | Business | University |
|---|---|---|
| Staff can suspend | **PASS** | **PASS** |
| Owner cannot suspend / reinstate | **PASS** | **PASS** |
| Suspended cannot publish/unpublish | **PASS** | **PASS** |
| Suspended not publicly selectable / no Directory published link | **PASS** | **PASS** |
| Super Admin reinstate works (existing mechanism) | — | **PASS** (then re-suspended for isolation) |

## Audit

| Cell | Result |
|---|---|
| Successful publish/unpublish write exact actions | **PASS** |
| Failed/unauthorized attempts write no success audit | **PASS** |
| Ordinary client cannot INSERT forge `audit_logs` | **PASS** |

## Directory published-Profile lookup

| Cell | Result |
|---|---|
| Published → visible published row; Profile id ≠ Directory id | **PASS** (Business + University) |
| Draft / suspended / absent → no published link row | **PASS** |

## Atomicity / repeated operations

| Cell | Result |
|---|---|
| Republish published → `profile_already_published`; audit count unchanged | **PASS** |
| Unpublish draft → `profile_not_published` | **PASS** |
| Failed min-field publish leaves draft + null published_at | **PASS** |

## Security advisor / lint

| Tool | Result |
|---|---|
| `supabase inspect db advisors` | **not available locally** (CLI v2.20.12 — no `advisors` subcommand) |
| `supabase db lint --local` | Ran; **pre-existing** warnings only (e.g. `record_ssis_outcome`, `notify_claim_decision` type casts). **No Session 07-B publication-path finding** requiring product repair. |

## Scoped repairs

| Item | Notes |
|---|---|
| Product RPC/migration/RLS | **none** |
| Test harness | Expanded disposable matrix file `profile-publication-matrix.rls.test.ts`; one assertion corrected so suspended owner UPDATE denial recognizes RLS silent deny (status remains `suspended`) — does not weaken product security |

## Test evidence

```
vitest run tests/rls/profile-publication.rls.test.ts tests/rls/profile-publication-matrix.rls.test.ts
Test Files  2 passed (2)
Tests  21 passed (21)
```

Against disposable env `http://127.0.0.1:58721` with local demo keys only.

## Cleanup / destruction

| Check | Result |
|---|---|
| `supabase stop --no-backup` | success |
| Containers matching `jid-07c` | **zero** |
| Volumes/networks matching `07c` | **zero** |
| Ports 58720–58724 / 58727 / 58729 Listen | **none** (released) |
| `config.toml` restored to HEAD `jid-platform` defaults | **yes** |
| Cloud / linked project changed | **no** |
| Secrets committed | **no** |
| Real credentials used | **no** |
