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
| Local Supabase | `supabase/config.toml`, 120 migrations, seed tooling, 18 Edge Function directories | Inspected as files only; not started/reset/seeded |
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
