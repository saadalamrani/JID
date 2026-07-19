# JID-101 Reproducible Quality Gate Report

Date: 2026-07-19 (Asia/Riyadh)

## Result

The local quality gate is reproducible when commands are executed through Corepack with a checkout-local cache. The repository pin is pnpm 9.15.4; Codex's fallback `pnpm.cmd` invokes bundled pnpm 11.9.0 directly and bypasses that pin. That version mismatch, combined with an interrupted partial `node_modules` tree, caused the repeated purge/recreation behavior observed in JID-000.

No dependency version, manifest, lockfile, application file, migration, environment secret, database, Supabase project, or Vercel project was changed.

## Root cause evidence

- `package.json`: `"packageManager": "pnpm@9.15.4"`.
- Active fallback: `C:/Users/saada/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback/pnpm.cmd`.
- The fallback hardwires bundled pnpm 11.9.0 on Node 24.18.0.
- The initial tree had no valid `node_modules/.modules.yaml`; the checkout-local store used pnpm v11 layout.
- Direct Corepack initially could not use its default cache because it is outside the writable checkout.
- With `COREPACK_HOME` inside the checkout, `corepack pnpm --version` returned 9.15.4 and frozen install/check commands stopped recreating modules.

## Stable workflow

Run from `jid-platform/` in PowerShell:

```powershell
$env:COREPACK_HOME='C:\Users\saada\Documents\Codex\JID-Project\.corepack'
$env:CI='true'
corepack pnpm --version
corepack pnpm install --frozen-lockfile
corepack pnpm type-check
corepack pnpm lint
corepack pnpm build
corepack pnpm test -- tests/unit src/lib/auth/organization-profile.test.ts
```

Expected pnpm version: `9.15.4`. Build requires outbound access to Google Fonts because `next/font` fetches Archivo, IBM Plex Sans Arabic, and JetBrains Mono during compilation.

Use the package script for Vitest. On this Windows runtime, `corepack pnpm exec vitest ...` failed to resolve the executable even though `node_modules/.bin/vitest.cmd` existed; `corepack pnpm test -- ...` is stable.

## Repair history

1. Checkout-local cleanup was attempted twice and then stopped: sandbox ACL denial followed by a Windows nested-path disappearance error. No further destructive cleanup was attempted.
2. Pinned frozen install reconciled the partial tree successfully.
3. A pinned forced frozen install was needed once to restore all executable links. It installed only lockfile-resolved packages and changed neither manifest nor lockfile.

## Check evidence

| Check | Result | Evidence |
|---|---|---|
| `git diff --check` | PASS | Exit 0 before documentation edits |
| pinned pnpm version | PASS | Corepack returned 9.15.4 |
| `pnpm install --frozen-lockfile` | PASS | 829 locked packages reconciled in 7.8s; no lockfile change |
| forced frozen relink | PASS | 942 lockfile-resolved package instances linked; no manifest/lockfile change |
| `pnpm type-check` | PASS | `tsc --noEmit`, exit 0 in 87.1s |
| `pnpm lint` | PASS WITH WARNINGS | Exit 0 in 44.8s; four `react-hooks/exhaustive-deps` warnings |
| sandboxed `pnpm build` | ENVIRONMENT FAILURE | Google Fonts connections denied with `EACCES` |
| approved-network `pnpm build` | PASS WITH WARNINGS | Exit 0 in 577.4s; compiled, type/lint stage passed, 265 static pages generated |
| safe unit/auth tests | PASS | 5 files, 29 tests, 13.94s Vitest duration |
| RLS tests | NOT RUN BY DESIGN | Fixtures create/delete users and rows and invoke write RPCs; database writes are forbidden in JID-101 |

## Existing code defects recorded, not fixed

Lint warnings:

- `src/app/[locale]/(public)/mentors/_components/mentor-filter-context.tsx:65`
- `src/app/[locale]/(public)/opportunities/_components/job-filter-context.tsx:72`
- `src/app/[locale]/(staff)/staff/verification/[id]/_components/verification-review-workspace.tsx:51`
- `src/lib/hooks/use-glow-state.ts:36`

These are grouped into follow-up package JID-104. The Vite output also reports that `vite-tsconfig-paths` is now redundant; no dependency or configuration change was made because removal is not required for this gate and dependency churn is constitutionally constrained.

## Files changed

- `docs/command-center/JID-101_QUALITY_GATE_REPORT.md`
- `docs/command-center/TASK_BOARD.md`
- `docs/command-center/ENVIRONMENT_MAP.md`

No component or function was created or reused because JID-101 changed tooling documentation only. No dynamic content or reference visual was involved.

## Remaining constraints

- The three RLS suites require an explicitly authorized disposable database because they perform writes.
- Build requires network access while the repository uses remote `next/font` sources.
- Checkout-local `.corepack/` and `.pnpm-store/` are generated caches and must remain untracked.
