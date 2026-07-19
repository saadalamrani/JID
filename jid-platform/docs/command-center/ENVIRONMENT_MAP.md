# JID Environment Map

Audited: 2026-07-19 (Asia/Riyadh) — repository evidence only.

| Concern | Verified repository truth | JID-000 access |
|---|---|---|
| Repository | `C:/Users/saada/Documents/Codex/JID-Project`; origin `https://github.com/saadalamrani/JID.git` | Read; documentation commit/push only |
| Application | `jid-platform/` | Read; audit documents only |
| Branch | `agent/nonprod-signup-fix`, tracking `origin/agent/nonprod-signup-fix` | Non-production only |
| Checkout parity | `git rev-list --left-right --count @{u}...HEAD` = `0 0` before JID-000 edits | Verified before audit commit |
| Package/runtime | pnpm 9.15.4; Next 14.2.15; React 18.3.1; TypeScript 5.9.3; Node types 20.19.43 | Locked by `package.json`/lockfile; runtime execution not established |
| Production | Vercel `jid-platform`; Supabase `znfhladafpajyjwcfzvv`; branch `main` | Prohibited; not contacted |
| Non-production | Vercel `jid-dev`; Supabase `hmjuijmaefajdjrjdsxu` | Not contacted during JID-000 |
| Local Supabase | `supabase/config.toml`, 120 migrations, seed tooling, 18 Edge Function directories | Inspected as files only; not started/reset/seeded |
| Environment templates | `.env.example`, `.env.seed.nonprod.example` | Presence verified; no secrets read or modified |
| Deployment config | `next.config.mjs`, `vercel.json` | Static inspection only; no deployment |

## Safe-check boundary

`git diff --check` is safe and passed. Package scripts are repository-defined and database-safe by intent for `type-check`, `lint`, `build`, and unit tests. They could not be executed because `node_modules` was absent and the managed pnpm runtime repeatedly attempted to recreate it. A frozen install completed once from the approved cache without changing the lockfile, but subsequent pnpm commands still triggered recreation; the second check attempt timed out after 300 seconds. Per the two-attempt rule, no further repair was attempted.

Runtime state, live RLS state, deployed configuration, credentials, test accounts, browser behavior, Supabase schema parity, and Vercel readiness remain unverified.
