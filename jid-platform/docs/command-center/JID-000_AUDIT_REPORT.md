# JID-000 Repository and Runtime Truth Audit

Date: 2026-07-19 (Asia/Riyadh)
Scope: static repository audit plus safe local checks. No Supabase, database, Vercel, deployment, production, or browser runtime was contacted.

## Executive result

The repository contains a broad implementation surface, but runtime truth is not established. The audit records zero `VERIFIED_WORKING` features. The most urgent findings are: an active constitutionally forbidden claim-existing-profile system; operational code still tied to Directory ownership fields; unverified privacy/RLS boundaries; visible fabricated/placeholder Lammah, Career Canvas, and CV editor content; hardcoded bilingual UI strings; and a non-reproducible managed pnpm check environment.

## Step 0 reconciliation

- Repository root: `C:/Users/saada/Documents/Codex/JID-Project`.
- Application root: `jid-platform/`.
- Branch: `agent/nonprod-signup-fix`, tracking the same origin branch.
- Initial tracked divergence: 0 behind / 0 ahead at `6f0ed77225dba07b37abca6a5f580576dda99011`.
- Initial status contained untracked bootstrap inputs: `AGENTS.md`, `FIRST_PROMPT_JID-000.txt`, `JID_CODEX_SETUP_REPORT.txt`, and `jid-platform/docs/command-center/`.
- Origin: `https://github.com/saadalamrani/JID.git`.
- Package manager: pnpm 9.15.4. Scripts include dev/build/lint/type-check/env/format/test/RLS/E2E and Supabase/seed commands.
- Repository versions: Next 14.2.15, React 18.3.1, TypeScript 5.9.3; strict TypeScript configured by project policy.
- Operating documents found: root `AGENTS.md`; Constitution; `CODEX_OPERATING_MODEL.md`; `MASTER_PLAN.md`. The expected `docs/command-center/tasks/` directory is absent; `FIRST_PROMPT_JID-000.txt` served as the current task packet.
- Safe checks can conceptually run without database writes, but package execution was blocked by dependency/runtime setup. Database-writing scripts were not invoked.

## Repository inventory

- 143 pages, 62 API route handlers, 24 action files.
- 120 migrations spanning foundation, auth/RLS, catalog, jobs/applications, mentorship, notifications, billing/entitlements, smart features, organization profiles, and security closure.
- 18 Edge Function directories excluding `_shared`.
- Generated Supabase types and server/client query utilities are present.
- Middleware/auth guards, feature flags, entitlements, locale files, seeds/fixtures, environment templates, Vercel config, Vitest, Playwright, RLS tests, and ad-hoc integration scripts are present.
- Feature-level evidence, dependencies, tests, risks, owners, and next actions are recorded in `FEATURE_LEDGER.md`.

## Critical findings

1. Constitution Articles 2, 6, and 8 are directly contradicted by `/api/catalog/claim`, `lib/catalog/claim.ts`, company claim routes, `unclaimed-cta.tsx`, `claim_requests` naming/copy, and Directory fields such as `claimed_by`. Some newer migrations introduce separate profiles and lockdown, but active application paths still preserve the extinct model.
2. Lammah renders `PLACEHOLDER_ITEMS`; Career Canvas announces a future module; CV workspace locale copy says its editor is coming soon. These must not appear as complete, real features.
3. Privacy code and RLS migrations exist, but static files cannot establish deployed policy parity or prove that private fields never cross non-owner read paths.
4. `realtime-search-input.tsx` hardcodes Arabic; other component placeholders are hardcoded. This violates i18n discipline and blocks verified AR/EN parity.
5. Operational access helpers/billing still query Directory ownership fields. Jobs have later business-profile re-anchoring migrations, but application paths require reconciliation.
6. Tests exist but are sparse relative to 143 pages, 62 APIs, 120 migrations, and the actor/role/privacy matrix. No check result can be promoted to PASS except `git diff --check`.
7. Storage bucket/policy truth, Edge Function auth/deployment, provider integrations, environment values, live schema parity, preview health, and mobile/RTL behavior remain unverified because external/runtime access was intentionally excluded.

## Data-truth and reuse report

Dynamic surfaces observed are backed nominally by Supabase tables/views/RPCs for profiles, companies, jobs, applications, verification, mentorship, notifications, subscriptions, flags, and smart-feature records. Exact sources are listed per feature in the ledger. The Lammah teaser is the explicit exception: it uses in-component placeholder records and is therefore classified `PLACEHOLDER`.

Existing foundations reused by future work should include auth guards, Supabase clients/types, profile queries/visibility rules, shared loading/error/empty shells, catalog filters/cards, organization lifecycle helpers, tier badge, notification dispatcher/templates, audit/RBAC functions, and existing domain validators. JID-000 created no application components or functions and changed no reference implementation.

## Verification evidence

| Check | Result | Evidence |
|---|---|---|
| `git diff --check` | PASS | Exit 0 before document creation |
| `pnpm install --frozen-lockfile` | PASS with environment warning | Locked 829 packages restored from approved cache; lockfile unchanged; Husky reported `.git` unavailable from app subdirectory |
| `pnpm type-check` attempt 1 | BLOCKED | Managed wrapper aborted module-directory removal without TTY |
| `CI=true pnpm type-check` attempt 2 | BLOCKED | Managed wrapper spent 300 seconds recreating `node_modules`, then timed out |
| `pnpm lint` | NOT RUN | Same two-attempt root cause; stopped by operating rule |
| `pnpm build` | NOT RUN | Same two-attempt root cause; stopped by operating rule |
| Unit/RLS/E2E tests | NOT RUN | Same dependency/runtime blocker; E2E also requires controlled runtime |

## Files created or included

- Root bootstrap: `AGENTS.md`, `FIRST_PROMPT_JID-000.txt`, `JID_CODEX_SETUP_REPORT.txt` (pre-existing untracked inputs, preserved).
- Operating bootstrap: `docs/command-center/CODEX_OPERATING_MODEL.md`, `MASTER_PLAN.md` (pre-existing untracked inputs, preserved).
- JID-000 outputs: `FEATURE_LEDGER.md`, `TASK_BOARD.md`, `ENVIRONMENT_MAP.md`, `JID-000_AUDIT_REPORT.md`.

No application behavior, SQL, migration, seed, environment file, dependency manifest, lockfile, database, Supabase project, or Vercel project was modified.

## Gaps and judgments

- Runtime classifications deliberately do not infer health from code presence.
- Closed mentorship/security migrations were not reopened as defects without direct regression evidence; only their UI/runtime verification is scheduled.
- The missing task directory is reported, not fabricated.
- First execution wave is limited to three packages with separated ownership surfaces.
- All production writes/deployments are deferred into later approval bundles.

## Completion condition

JID-000 documentation is complete when this report and companion ledgers are committed and pushed to the designated non-production branch. The quality-check blocker is an audited repository finding, not an authorization to repair application behavior in this task.
