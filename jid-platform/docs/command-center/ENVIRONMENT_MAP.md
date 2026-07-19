# JID Environment Map

Audited: 2026-07-19 (Asia/Riyadh) — updated by JID-101.

| Concern | Verified repository truth | JID-000 access |
|---|---|---|
| Repository | `C:/Users/saada/Documents/Codex/JID-Project`; origin `https://github.com/saadalamrani/JID.git` | Read; documentation commit/push only |
| Application | `jid-platform/` | Read; audit documents only |
| Branch | `agent/nonprod-signup-fix`, tracking `origin/agent/nonprod-signup-fix` | Non-production only |
| Checkout parity | `git rev-list --left-right --count @{u}...HEAD` = `0 0` before JID-000 edits | Verified before audit commit |
| Package/runtime | Repository pin pnpm 9.15.4; Codex fallback pnpm 11.9.0; Node 24.18.0; Next 14.2.15; React 18.3.1; TypeScript 5.9.3 | Use checkout-local Corepack cache and `corepack pnpm`; quality gates executed |
| Production | Vercel `jid-platform`; Supabase `znfhladafpajyjwcfzvv`; branch `main` | Prohibited; not contacted |
| Non-production | Vercel `jid-dev`; Supabase `hmjuijmaefajdjrjdsxu` | Not contacted during JID-000 |
| Local Supabase | CLI 2.20.12; repository config on 5432x; 120 migrations; 18 Edge Function directories | JID-105 used isolated project `jid-105-disposable` on loopback 5532x; all migrations applied; stack fully deleted |
| Environment templates | `.env.example`, `.env.seed.nonprod.example` | Presence verified; no secrets read or modified |
| Deployment config | `next.config.mjs`, `vercel.json` | Static inspection only; no deployment |

## Reproducible local workflow

From `jid-platform/` in PowerShell:

```powershell
$env:COREPACK_HOME='C:\Users\saada\Documents\Codex\JID-Project\.corepack'
$env:CI='true'
corepack pnpm install --frozen-lockfile
corepack pnpm type-check
corepack pnpm lint
corepack pnpm build
corepack pnpm test -- tests/unit src/lib/auth/organization-profile.test.ts
```

Corepack must report pnpm 9.15.4. The unqualified `pnpm` fallback reports 11.9.0 and must not be used for this checkout. Build needs outbound access to Google Fonts. The safe unit/auth selection performs no database writes. Do not run `tests/rls` during a no-database-write task: its fixtures create and delete users and rows and invoke write RPCs.

JID-101 results: diff check, frozen install, type-check, lint, approved-network build, and 29 safe tests passed. Live RLS state, deployed configuration, credentials, test accounts, browser behavior, Supabase schema parity, and Vercel readiness remain unverified.

## Disposable RLS workflow

JID-105 copied the repository config and 120 migrations into an untracked checkout-local workdir, changed only the temporary project ID/ports, disabled automatic seeds, and started the minimal stack on a Docker network bound to `127.0.0.1`. The pre-existing `jid-platform` local stack was not used.

The disposable schema applied all migrations. `tests/rls/profiles.rls.test.ts` passed 2 assertions. The ownership-law and jobs-reanchor suites skipped 12 assertions after their shared fixture supplied enum value `complete`, which the applied `profile_state_enum` rejects. Cleanup removed every disposable container, volume, network, and temporary file. See `JID-105_DISPOSABLE_RLS_GATE_REPORT.md`.

Cloud production, cloud non-production, and deployed RLS parity remain unverified.

## JID-106 disposable RLS result

JID-106 used disposable project `jid-106-disposable` on loopback ports 56320–56329. All 120 repository migrations applied. The fixture now uses repository-valid `profile_state_enum` value `active`; teardown and final-schema job fixtures were aligned without changing a migration or policy. All 14 assertions executed: 13 passed and 1 failed because an owner can directly change a suspended Business Profile to `draft` under migration 110's update policy.

The disposable containers, network, workdir, and database data were deleted without backup. The existing shared `jid-platform` stack was preserved and never targeted. Cloud production, cloud non-production, and deployed RLS parity remain unverified and were not contacted. See `JID-106_RLS_FIXTURE_SCHEMA_DRIFT_REPORT.md`.

## JID-107 suspended-profile boundary result

JID-107 used fresh disposable project `jid-107-disposable` on loopback ports 57320–57329. It applied all 121 migrations, including `20260719100425_enforce_suspended_profile_transition_boundary.sql`, with repository seeds disabled. Both owned-Profile update policies and boundary triggers were verified in the local catalog. The complete RLS gate passed 24/24 tests: the previous 14 plus 10 Business/University moderation assertions, with zero failures or skips.

Test fixtures cleaned to zero users and owned Profiles before teardown. Disposable containers, network, workdir, and database data were deleted without backup. The shared `jid-platform` stack remained present with 10 containers and was never targeted. Cloud production, cloud non-production, Vercel, and deployed schema parity remain unverified and were not contacted. See `JID-107_SUSPENDED_PROFILE_BOUNDARY_REPORT.md`.
