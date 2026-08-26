# JID — Wave 1 / Front 2 — Codex Execution Contract

**Front:** Canonical Shared Contract Integration  
**Owner:** Codex  
**Status:** OPEN  
**Base branch:** `strategy/jid-wave1-prep-2026-08-26`  
**Base SHA:** `c58e567c71ab1d1cb01e6670cf02326d2f6909e1`  
**Execution branch:** `codex/wave1-front2-shared-contracts`

## TRUTH

Wave 1 Front 1 is closed at `c58e567c71ab1d1cb01e6670cf02326d2f6909e1` with current-reality evidence from the repository and read-only `jid-nonprod` metadata.

The frozen contract authority is:

1. `docs/JID_Agent_Operating_Constitution.md`
2. `docs/command-center/FOUNDER_DECISIONS_2026-08-26.md`
3. `docs/command-center/WAVE_OPERATING_MODEL.md`
4. `docs/command-center/WAVE_1_SHARED_PRODUCT_CONTRACTS_AND_DESIGN_FOUNDATIONS.md`
5. `docs/command-center/wave-1/WAVE_1_CURRENT_REALITY_MAP.md`
6. `docs/command-center/wave-1/WAVE_1_ARCHITECTURE_AND_REUSE_PACKET.md`
7. `docs/command-center/wave-1/WAVE_1_CONTRACT_SPEC.md`
8. `docs/command-center/wave-1/WAVE_1_RISK_AND_DECISION_LOG.md`

Canonical C1–C10 numbering is the Wave 1 packet/Contract Spec numbering. Do not use the stale numbering in the historical Claude execution handoff.

## MISSION

Implement the **minimum shared TypeScript/runtime contract foundation** needed to make C1–C10 explicit and reusable without changing current product behavior.

This first Front 2 packet is deliberately **code-only contract infrastructure**. It does not authorize database DDL. If the contract layer proves a database primitive is necessary, return a separate proposed non-production migration sub-packet instead of applying it.

## SCOPE

Create one coherent versioned contract module, using existing dependencies only (prefer existing Zod + inferred TypeScript types), covering:

- C1 public actor / authority semantic values;
- C2 Career Evidence semantic values and contract shape;
- C3 Opportunity neutral core and opportunity-type/source/apply semantics;
- C4 Journey event origin/correction semantics;
- C5 disclosure authorization / purpose / retention-reference semantics;
- C6 University affiliation + cohort-link states;
- C7 assessment evidence / attempt / decision-use semantics;
- C8 AI/automation authority and human-confirmation semantics;
- C9 market/location/jurisdiction identifier semantics;
- C10 metric-definition metadata semantics.

Also add focused contract-invariant tests.

## IMPLEMENTATION BOUNDARY

Prefer a compact structure such as:

`src/contracts/v1/`

with a small number of coherent files and a single public barrel export. Do not create a directory/file per trivial enum if a smaller grouping is clearer.

Use runtime schemas only where they give real boundary value. Avoid speculative abstraction.

### Required invariants to encode/test

1. Public actor type admits only `INDIVIDUAL`, `BUSINESS`, `UNIVERSITY`.
2. Government and Mentor are not public actor values.
3. Organization reference identity is separate from organization authority.
4. Career evidence carries provenance/source state and cannot silently call self-declared data verified.
5. `Opportunity` is not structurally restricted to `JOB`.
6. paid boost/priority visibility does not exist in the shared Opportunity relevance contract.
7. Journey events carry origin class and corrections reference a prior event rather than overwrite history.
8. Disclosure authorization is purpose/recipient/object-or-category scoped and may reference consent or another reviewed authority basis; do not hard-code consent as the only basis.
9. University affiliation states include `DECLARED`, `VERIFIED`, `NEEDS_REVIEW`; cohort link is separate and carries no Career Record visibility grant.
10. Assessment contracts contain no global JID Candidate/Employability/Culture-Fit score and no generic autonomous recommendation field.
11. Consequential/external AI actions require an explicit human authorization/confirmation state in the authority envelope.
12. Market context supports stable country/subdivision identifiers without building foreign-market behavior.
13. Metric definition is separate from metric value and supports denominator/coverage/missingness metadata.
14. All shared timestamps are timezone-aware string/date contracts; no Saudi-local wall-clock value is stored as global truth.

## NO-TOUCH

- no Supabase migration;
- no database write;
- no production or deployment;
- no modifications to existing application feature behavior;
- no replacement/deletion of `profiles`, CV, jobs, applications, Lammah, SSIS or University tables;
- no role-enum migration;
- no new external dependency;
- no pricing/billing implementation;
- no Career Record/CV feature build;
- no Opportunity/Radar/Abhathli feature build;
- no Hiring Workspace/assessment workflow build;
- no Professional/Social feature build;
- no University dashboard/KPI build;
- no GCC market implementation;
- no broad refactor.

## SECURITY / DATA

This packet must not broaden any read/write permission. New contract types/schemas are semantic boundaries only.

Do not fetch real personal records for tests. Use synthetic fixtures only.

## TESTS

Required minimum:

- focused unit tests for the contract schemas/invariants;
- `pnpm type-check`;
- `pnpm lint` for touched scope or repository command if practical;
- existing relevant unit suite if contract exports are consumed by current code.

If a repository-wide test/build fails for a pre-existing unrelated reason, classify it `VERIFIED PRE-EXISTING` with evidence; do not repair unrelated scope.

## EVIDENCE

Return:

- exact changed files;
- final branch SHA;
- tests/commands and results;
- C1–C10 implementation map;
- invariants encoded;
- anything intentionally deferred;
- any proposed DB migration need, with reason and exact affected current tables—but **do not execute it**.

## GIT

Work only on `codex/wave1-front2-shared-contracts`.

`DO NOT SPAWN SUBAGENTS.`

Commit coherent changes. Do not merge and do not touch `main`.

## ROLLBACK

Code-only packet. Rollback is revert/abandonment of this front branch. No runtime rollback should exist because runtime behavior/database must remain unchanged.

## STOP CONDITIONS

Stop and report `BLOCKED_WITH_EXACT_CAUSE` if:

- branch/base lineage differs;
- implementation requires database DDL to make the contract meaningful;
- a frozen contract is internally inconsistent;
- a new dependency is required;
- implementing a shared type would force Wave 2+ feature behavior;
- an invariant cannot be represented without changing current permissions/data behavior;
- current repository truth materially contradicts Front 1 evidence.

## DEFINITION OF DONE

Front 2 code-only contract packet is DONE when:

- a single versioned shared contract layer covers C1–C10;
- focused invariants are tested;
- no new parallel domain truth store exists;
- no runtime/database/permission/product behavior changes;
- type-check/lint/relevant tests pass or any unrelated pre-existing failure is separately evidenced;
- exact follow-up need for a DB contract sub-packet is either `NONE` or explicitly documented;
- Cursor can import/reference contract state names later without inventing backend semantics.

End exactly with either:

`WAVE_1_FRONT_2_CODE_CONTRACTS_COMPLETE`

or

`BLOCKED_WITH_EXACT_CAUSE`
