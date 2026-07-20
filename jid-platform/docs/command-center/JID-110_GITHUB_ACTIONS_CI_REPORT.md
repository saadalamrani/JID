# JID-110 GitHub Actions CI Quality Gate Report

Date: 2026-07-20 (Asia/Riyadh)

## Result

Implementation and local validation are in progress. GitHub-hosted validation will be recorded after the first branch push; JID-110 is not complete until `.github/workflows/ci.yml` succeeds on GitHub.

## Step 0 inventory

- Required base: `origin/agent/nonprod-signup-fix` at `77c9f9a2aa39dc5337d6b057c777a0ead541bbfb`, refreshed and verified before branch creation.
- Isolated branch: `codex/jid-110-github-actions-ci`.
- Initial Git state: tracked files clean; untracked checkout-local `.corepack/`, `.pnpm-store/`, `.worktrees/`, and `codex-tasks/` were present and preserved.
- Existing workflow: `.github/workflows/ci.yml` existed. It ran on `main` pushes and pull requests, used floating action tags and `pnpm/action-setup`, injected placeholder Supabase values, allowed E2E and RLS jobs to fail, and did not start or clean an isolated RLS stack.
- Runtime: local Node 24.18.0 and Corepack 0.35.0; checkout-local Corepack resolves the package pin `pnpm@9.15.4`. CI intentionally uses Node 20.
- Application and lockfile: `jid-platform/`, with `jid-platform/pnpm-lock.yaml` and frozen installation.
- Established scripts: `lint`, `type-check`, `test`, `build`, and environment-gated `test:rls`.
- Safe test behavior: ordinary `corepack pnpm test` skips the four RLS files when local-only Supabase variables are absent; non-RLS tests execute normally and any failure fails the command.
- Never-commit paths: `.corepack/`, `.pnpm-store/`, `node_modules/`, `.next/`, Supabase local runtime data, Docker data directories, and non-example environment files. Root ignore rules now protect checkout-local caches and runtime data; the workflow independently rejects tracked forbidden paths.

## Workflow created

`.github/workflows/ci.yml` is the official repository-native quality gate.

Triggers:

- every `pull_request`;
- pushes to `agent/nonprod-signup-fix`;
- pushes to `codex/**`;
- `workflow_dispatch`.

The workflow grants only `contents: read`, cancels superseded runs for the same PR/ref, uses `ubuntu-latest`, and works from `jid-platform/`. It uses Node 20 and Corepack to enforce the exact package-manager pin pnpm 9.15.4. Official GitHub actions are pinned to verified immutable SHAs: `actions/checkout` v4.3.0 (`08eba0b27e820071cde6df949e0beb9ba4906955`) and `actions/setup-node` v4.4.0 (`49933ea5288caeca8642d1e84afbd3f7d6820020`). No third-party action is used.

The required `CI / Quality Gate` job includes:

1. changed-file whitespace validation against the PR base, push-before commit, or non-production base fallback;
2. tracked-path hygiene, lockfile presence, and the exact `pnpm@9.15.4` manifest pin;
3. frozen dependency installation followed by a manifest/lockfile mutation check;
4. `corepack pnpm lint`, with an explicit zero-warning/zero-error assertion;
5. `corepack pnpm type-check`;
6. `corepack pnpm test` without RLS credentials;
7. `corepack pnpm build`, with a 20-minute step timeout.

The workflow supplies no Supabase or production secrets, suppresses no failure, and has no deployment step.

## RLS CI decision

`rls-local.yml` was not created. The tests themselves reject non-loopback Supabase URLs, and JID-107 proved a safe disposable local run with all migrations, disabled seeds, isolated loopback ports/network, cleanup, and 24/24 passing assertions. However, that provisioning and teardown procedure is not a committed reusable repository harness: JID-107 created a temporary copied config/workdir, while the committed `supabase/config.toml` uses the shared `jid-platform` project/5432x ports and enables broad repository seeds. The existing legacy workflow merely supplied secret-backed local-looking variables without starting, migrating, isolating, or cleaning a database.

The exact follow-up requirement is a repository-native disposable RLS runner that creates a unique temporary Supabase workdir and loopback-bound Docker network, assigns collision-free local ports, disables all seeds, applies every migration in repository order, captures only ephemeral local keys without logging them, runs the complete `tests/rls` suite with zero skips, and guarantees removal of every container, volume, network, and temporary file on success, failure, or cancellation. Until that exists, JID-107's 24 passed, 0 failed, 0 skipped local evidence remains the RLS baseline. No cloud Supabase project was contacted.

## Security and repository settings

The workflow reports forbidden tracked paths without reading or printing file contents. It deliberately does not use a homemade general-purpose secret regex. GitHub repository secret scanning and push protection should be enabled separately in repository settings when available.

Secrets required by this CI workflow: none.

## Branch protection recommendations

For `agent/nonprod-signup-fix`, `main`, and a future staging branch, require pull requests, require `CI / Quality Gate`, require branches to be up to date before merge, block unresolved conversations, force pushes, and deletions. Block direct pushes to `main`. Keep production deployment and production database migration approval founder-gated, with backup, rollback, and verification evidence.

Do not configure branch protection automatically as part of JID-110.

## Staging and production design

Future release flow (design only):

`PR -> CI quality gate -> merge to non-production/staging -> preview deployment and smoke tests -> explicit founder approval -> production deployment -> production migration gate with backup, rollback, and verification evidence`

JID-110 implements none of the deployment stages.

## Local validation

- `git diff --check`: PASS.
- `corepack pnpm --version`: PASS, `9.15.4` from `jid-platform/` with checkout-local `COREPACK_HOME`.
- `corepack pnpm install --frozen-lockfile`: the initial 180-second sandboxed attempt timed out while recreating `node_modules`; the one allowed repair used `--force --frozen-lockfile` and passed in 42.3 seconds with 942 lockfile-resolved packages, 941 reused, and 0 downloaded.
- Post-install `git diff --exit-code -- package.json pnpm-lock.yaml`: PASS; neither file changed.
- `corepack pnpm lint`: PASS, 0 warnings and 0 errors in 7.0 seconds.
- `corepack pnpm type-check`: PASS in 13.5 seconds.
- `corepack pnpm test`: PASS in 13.9 seconds; 13 files total, 9 passed and 4 RLS files skipped; 66 tests total, 42 passed, 0 failed, and 24 RLS tests skipped.
- `corepack pnpm build`: PASS in 124.5 seconds; compilation, lint/type validation, and 265/265 static pages succeeded.
- YAML syntax and structure: PASS using the installed `yaml` 2.9.0 parser; all four trigger classes, `quality-gate`, and `jid-platform` working directory were asserted.
- Tracked forbidden-file inspection: PASS; no forbidden cache, build, local database/runtime, Docker data, or non-example environment path is tracked.

## GitHub Actions validation

Pending first branch push. The run ID/URL and every job/step conclusion will be recorded here after the required workflow completes.

## Remaining risks

- The production build depends on outbound access to repository-configured Google Fonts.
- RLS remains outside ordinary CI until the disposable harness described above is committed and reviewable.
- Branch protection, secret scanning, and push protection remain repository-setting actions for an authorized administrator.

## Files changed

- `.github/workflows/ci.yml`
- `.gitignore`
- `jid-platform/docs/command-center/JID-110_GITHUB_ACTIONS_CI_REPORT.md`
- `jid-platform/docs/command-center/TASK_BOARD.md`
- `jid-platform/docs/command-center/ENVIRONMENT_MAP.md`

No application component, function, route, dependency, migration, dynamic content, or data source changed. No production or non-production service was contacted.
