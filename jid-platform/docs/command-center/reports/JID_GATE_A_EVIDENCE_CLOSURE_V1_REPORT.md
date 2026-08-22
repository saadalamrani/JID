# JID Gate A Security / Privacy / Evidence Closure V1

Date: 2026-08-22 (Asia/Riyadh)
Mode: direct engineering and verification; nonproduction only

## 1. Reality Lock

- Canonical: `origin/agent/nonprod-signup-fix` at `e876060706abd6c8fbb12d6a5f05df679d49632e`.
- Gate A source: `origin/codex/jid-security-privacy-gate-a-expand-contract` at `bc507aaa7e94ca4dd9668e76ce9900c56ac2c9ed`.
- Work branch: `codex/jid-gate-a-evidence-closure-v1`, created from exactly `bc507aaa7e94ca4dd9668e76ce9900c56ac2c9ed`.
- Merge-base: `e876060706abd6c8fbb12d6a5f05df679d49632e`; canonical is an ancestor. Gate A adds exactly `29ac5fc` and `bc507aa`.
- Later descendant design branches contain no changes to the inspected Gate A security files or migrations.
- Requested baseline/final-readiness files were absent on fetched remote refs; current repository, raw evidence, migrations, tests, GitHub, and database metadata were used as truth.

## 2. Known Evidence Contradiction

- Historical `FOCUSED_UNIT.txt`: 1 failed / 8 passed across 3 started files, 2 worker-start errors, duration 131.14s.
- Historical report: 5 files / 22 tests passed, without a matching clean raw focused artifact.
- Assertion root cause: an uncommitted intermediate test incorrectly required `src/lib/profile/queries.ts` to contain `mentor_public_projection`. The committed test correctly requires Individual and mentor-review projections there and Mentor projection only in actual public Mentor consumers. Classification: `TEST_DEFECT` in the intermediate assertion.
- Worker errors did not recur in current repeated runs. Classification: historical `TEST_RUNNER_INSTABILITY` / resource-bound environment.
- The old artifact remains in history; this report transparently supersedes its pass/fail interpretation.

## 3. Code Changes

- Removed only UTF-8 BOM bytes from pending migration `20260805190100_catalog_review_auth_wrappers.sql`. PostgreSQL rejected statement 0 before Gate A. Corrected blob exactly matches reviewed blob `dedc0022555433cc5637435cf07c5f182999fc31`; SQL semantics are unchanged.
- Removed two CI-failing trailing-space pairs from `CONTRACT_ROLLBACK_POLICY_ARCHIVE.md`; content is unchanged.
- Added this report. No application component, query, policy, Gate A EXPAND/CONTRACT SQL, assertion, timeout, dependency, design, or copy changed.
- Existing projection/query/test contracts were reused; no runtime function/component or dynamic user-facing data source was added.

## 4. Focused Gate A Tests

- Exact command: `pnpm exec vitest run tests/unit/security/gate-a-rollout-states.test.ts tests/unit/security/privacy-gate-a-contract.test.ts tests/unit/security/mentor-profiles-callsite-audit.test.ts tests/unit/mentorship/submit-mentorship-request-availability.test.ts tests/unit/timeline/mentor-public-projection.test.ts`.
- Authoritative result: 5 files, 22 passed, 0 failed, 0 skipped.
- Live database command: `pnpm exec vitest run tests/rls/security-privacy-gate-a.rls.test.ts`.
- Live result: 1 file, 15 passed, 0 failed, 0 skipped.

## 5. Stability Check

- Focused unit: 22/22 passed four times (44.80s cold, 4.26s, 4.04s, 35.53s under concurrent local workload).
- Focused live RLS: 15/15 passed, then 15/15 passed again after the final fix.
- No current worker-start error, timeout, assertion drift, skip, or retry-dependent outcome.

## 6. Full Quality Gates

- Frozen install: pass; lockfile unchanged. `git diff --check`: pass.
- `pnpm lint`: pass, no warnings/errors. `pnpm type-check`: pass.
- Full unit: 61 files / 506 tests passed.
- `pnpm build`: pass; 304 static pages.
- Full RLS: 10 files passed, 2 failed; 100 passed, 1 failed, 15 skipped. Known baseline mismatches reproduced: `ownership-law` expects empty data instead of stricter `42501`; Lammah fixture setup expects permission current grants deny with `42501`. Grants were not weakened.
- `pnpm format:check`: baseline failure on 1,668 files, including two pre-existing `.ts` files containing JSX that Prettier cannot parse. Out of Gate A scope; changed diff passes `git diff --check`.
- Full migration replay first proved the BOM defect; after the BOM-only fix, the complete zero-seed chain replayed successfully from zero in EXPAND then CONTRACT order.

## 7. Supabase Nonprod Reality

- Exact project ref: `hmjuijmaefajdjrjdsxu`; current display name `jid-nonprod`; status `ACTIVE_HEALTHY`; PostgreSQL 17.6.
- Read-only history ends at `20260805120000`. `20260805190100`, `20260809065512`, and `20260809065513` are pending.
- Remote metadata is pre-Gate-A: safe Individual/Mentor projections and private audience helpers are absent; legacy base-table grants/policies remain.
- Classification: `GATE_A_NOT_PROMOTED_TO_NONPROD`.

## 8. RLS / Projection Verification

- Public: eligible safe projections allowed; base/private rows denied after CONTRACT.
- Individual owner: own skills/base owner path allowed. Authenticated non-owner: private rows denied.
- Business owner: discoverable access only through safe projection for an active verified matching owned Business Profile.
- University owner: no Individual rows and no dashboard row. Internal authorized role: separately authorized aggregate view.
- Applications: applicant/owning Business allowed; unrelated/anonymous denied; no anonymous application grant after CONTRACT.

## 9. University Fail-Closed Verification

- Distinct constraints remain: `profiles.university_id -> universities_catalog.id`; `university_profiles.directory_id -> companies.id`; `verification_requests.directory_id -> companies.id`.
- No approved bridge exists. EXPAND owner view uses `WHERE false`; live RLS returned no University owner rows.
- No name/slug/code/domain/fuzzy inference or named graduate visibility was added.

## 10. Mentor Projection Verification

- Mentor remains an Individual capability. Public discovery, availability, timeline, sitemap, and non-owner contexts use `mentor_public_projection`.
- Public reviews use `mentor_review_public_projection` without internal meeting/reviewer identifiers.
- CONTRACT removes public base-table Mentor reads while owner/staff access remains. Live positive/negative meeting-binding tests passed.

## 11. CI Evidence

- Source SHA `bc507aaa7e94ca4dd9668e76ce9900c56ac2c9ed`: Actions run `31358937446`, job `93363793578`, failed at two trailing-space pairs; later steps skipped.
- Vercel source-SHA statuses succeeded but are deployment evidence, not CI quality evidence.
- Exact-SHA closure CI is recorded after push; until then: `NO_CLEAN_CI_EVIDENCE`.

## 12. Security Findings

- P0: none.
- P1: pending migration chain blocked by BOM before Gate A; fixed and proved by full replay plus live RLS.
- P2: two baseline full-RLS harness assumptions, broad Prettier baseline/parser debt, historical worker instability.
- P3: contradictory focused artifact/report and rollback-archive whitespace; transparently superseded/fixed.
- No known Gate A P0/P1 remains locally.

## 13. Remote Changes

`NO PRODUCTION CHANGES`

`NO REMOTE DB MIGRATIONS APPLIED`

Remote DB actions were read-only against `hmjuijmaefajdjrjdsxu`. Production ref `znfhladafpajyjwcfzvv` was not inspected or used.

## 14. Promotion Readiness

- Pending nonproduction order: `20260805190100`, `20260809065512`, `20260809065513` against `hmjuijmaefajdjrjdsxu`.
- Local prerequisites: frozen install, clean diff, lint, typecheck, 506/506 unit, build, zero-seed full replay, focused stability, 15/15 live Gate A RLS.
- Promotion must preserve EXPAND -> Gate A app -> smoke -> CONTRACT. Remote application remains unauthorized. Forward-fix is the recovery model; the policy archive is evidence, not a downgrade migration.
- After exact-SHA CI passes: `READY_FOR_NONPROD_PROMOTION <FINAL_SHA>`.

## 15. Final SHA

The immutable final SHA is the pushed commit containing this report and is recorded in the final handoff. A self-referential placeholder is not treated as evidence.
