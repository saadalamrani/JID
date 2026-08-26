# JID — Wave 1 / Front 2 — Codex Execution Packet

**Front:** Canonical Contracts / Shared Engineering Foundations  
**Execution owner:** Codex  
**Branch:** `nebres/wave1-front2-codex-contracts`  
**Parent Front 1 closeout SHA:** `e02bd69c62baba3fbc8d71f44aa6a9dab77f2aef`  
**Status:** READY FOR CODEX

## 0. Operating instruction

This is a **small precision engineering front**, not a Mega Prompt.

`DO NOT SPAWN SUBAGENTS.`

Do not rescan the full repository. Read only the authority files and exact touchpoints below, then implement the smallest coherent shared-contract foundation that later waves can reuse.

No production action is authorized.

---

## 1. Mandatory authority

Read in this order:

1. `docs/command-center/FOUNDER_DECISIONS_2026-08-26.md`
2. `docs/command-center/WAVE_1_SHARED_PRODUCT_CONTRACTS_AND_DESIGN_FOUNDATIONS.md`
3. `docs/command-center/wave-1/WAVE_1_FRONT_1_CLOSEOUT.md`
4. `docs/command-center/wave-1/WAVE_1_CURRENT_REALITY_MAP.md`
5. `docs/command-center/wave-1/WAVE_1_ARCHITECTURE_AND_REUSE_PACKET.md`
6. `docs/command-center/wave-1/WAVE_1_CONTRACT_SPEC.md`
7. `docs/command-center/wave-1/WAVE_1_RISK_AND_DECISION_LOG.md`

Repository/runtime truth wins over historical assumptions. If current evidence materially differs, stop and report the exact mismatch.

---

## 2. Front 2 objective

Implement the **non-feature shared engineering contracts** required by Wave 1 so later waves do not invent competing actor, evidence, opportunity, event, disclosure, university, assessment, AI, market, or metric semantics.

Front 2 is successful when JID has one reusable typed contract layer plus compatibility guards/adapters and tests.

Front 2 does **not** build Career Record, Lammah expansion, Radar, Abhathli, Social, Hiring Workspace, University dashboards, Government products, pricing, or final assessment workflows.

---

## 3. Execution sequence

### Packet 2A — Pure contract types first

Implement a dedicated shared contract module under a coherent existing source convention, preferably:

`src/types/contracts/`

or an equally bounded location if repository conventions clearly require another path.

Create minimal versioned TypeScript contracts for:

- C1 Actor / Authority
- C2 Career Evidence
- C3 Opportunity Core
- C4 Journey Event
- C5 Disclosure Authorization / Access Audit reference
- C6 University Affiliation / Cohort Link
- C7 Assessment Evidence / Decision Use
- C8 Automation Authority
- C9 Market / Jurisdiction Context
- C10 Metric Definition

Requirements:

- use stable machine values, not UI copy;
- use explicit enums/unions for frozen semantic states;
- separate public actor from internal role and organization authority;
- `Opportunity` must not be structurally restricted to Job;
- `JourneyEvent` must distinguish declared / observed / employer-confirmed / institution-confirmed / third-party / correction origins;
- University affiliation must support `DECLARED / VERIFIED / NEEDS_REVIEW`;
- C5 must not reduce every lawful basis to `consent`;
- C7 must not include a universal candidate/employability/culture-fit score;
- C8 must expose human-review and external-confirmation boundaries;
- C10 must include coverage/missingness/privacy metadata.

Do not add a new runtime dependency for these types.

### Packet 2B — Compatibility adapters / guards

Add the smallest adapters needed so current code can reference the new semantics without converting current legacy tables into target truth.

Likely exact touchpoints to inspect only as needed:

- `src/lib/auth/rbac.ts`
- `src/types/cv.ts`
- `src/types/job.ts`
- `src/types/application.ts`
- `src/types/catalog.ts`
- `src/types/lammah.ts`

Rules:

- no new code may treat `companies.claimed_by` as target organization authority;
- generic legacy `entity` remains compatibility-only;
- existing CV/Profile data remains legacy source/projection data until Wave 2 migration;
- existing `jobs` remains a Job implementation/subtype, not the shared Opportunity interface;
- legacy paid boost fields must not appear in the shared organic relevance contract;
- legacy SSIS `composite_score` / `advance|review|decline_recommend` must not become the shared assessment-decision contract.

If an adapter would require product behavior decisions, stop rather than invent them.

### Packet 2C — Contract invariant tests

Add focused unit tests under the current unit-test convention, preferably a bounded folder such as:

`tests/unit/contracts/`

Minimum invariants to test:

1. public actor values are exactly Individual / Business / University;
2. mentor and government are not public actor enum values;
3. organization authority is distinct from Directory identity;
4. Career Evidence can represent declared, verified, disputed, corrected/revoked lineage without UI copy;
5. Opportunity accepts non-job categories and preserves source/apply authority;
6. Journey Event missing state is not an outcome;
7. DisclosureAuthorization requires explicit purpose, recipient/object scope, basis and retention reference;
8. University affiliation supports `DECLARED / VERIFIED / NEEDS_REVIEW` and cohort link is separate;
9. assessment shared contracts contain no universal candidate score or automated final-decision state;
10. AutomationAuthority requires human approval/confirmation for consequential external actions;
11. Market context supports Saudi default usage without hard-coding Saudi as universal schema truth;
12. MetricDefinition requires source/window/population plus coverage/missingness/privacy semantics.

Add tests proving current Job/CV/SSIS compatibility types are not being silently re-exported as canonical shared contracts.

### Packet 2D — Database impact analysis only

After 2A–2C, inspect whether any **Wave 1 shared primitive truly requires persistent storage now**.

Do not create or apply a migration automatically.

If persistence is required, produce:

`docs/command-center/wave-1/WAVE_1_FRONT_2_MIGRATION_SUBPACKET.md`

with:

- exact proposed tables/columns/functions;
- current non-prod schema evidence;
- PRE_COUNTS queries;
- expand/contract strategy;
- RLS design;
- audit/retention behavior;
- rollback plan;
- tests;
- explicit confirmation that no production action is included.

Then stop at:

`AWAITING_EXPLICIT_NONPROD_MIGRATION_AUTHORIZATION`

Do not execute DDL from this packet.

If persistence is not needed for Wave 1 closure, document why and continue without DDL.

---

## 4. Forbidden changes

Do not:

- edit historical applied migrations;
- deploy or modify Edge Functions;
- touch production;
- create a second auth/identity plane;
- add a graph database, message bus, workflow engine, external search engine, ATS foundation, or new repository;
- implement Career Record storage or migrate CV data in this front;
- change opportunity ranking;
- build Radar/Abhathli/Lammah product journeys;
- build Social/feed;
- build Employer Hiring Workspace;
- implement assessment vendor/product logic;
- build University KPIs or dashboards;
- implement Government capability;
- implement GCC country adapters;
- change pricing or subscription behavior;
- reactivate paid organic priority visibility;
- use legacy SSIS AI recommendation as hiring authority;
- weaken RLS/privacy/audit controls;
- introduce fake metrics or inferred outcomes.

---

## 5. Validation

At minimum run the focused contract/unit tests you add.

If application TypeScript is touched, also run:

- `pnpm type-check`
- `pnpm lint`

Run broader tests/build only if the changed scope requires it or current repository policy makes it mandatory. Do not burn compute on unrelated suites without reason.

Record exact commands/results, including skipped or pre-existing failures.

---

## 6. Required closeout artifact

Create:

`docs/command-center/wave-1/WAVE_1_FRONT_2_CLOSEOUT.md`

It must contain:

- start branch/SHA;
- final branch/SHA;
- changed files;
- exact contracts implemented;
- compatibility adapters added;
- test commands/results;
- whether a migration sub-packet was required;
- unresolved risks;
- explicit confirmation of no Wave 2+ feature implementation;
- explicit confirmation of no production action;
- exact handoff requirements for Cursor Front 3.

Terminal state must be exactly one of:

`WAVE_1_CODEX_CONTRACTS_COMPLETE`

or

`AWAITING_EXPLICIT_NONPROD_MIGRATION_AUTHORIZATION`

or

`BLOCKED_WITH_EXACT_CAUSE`

---

## 7. Stop conditions

Stop immediately if:

- current branch/SHA is not based on `e02bd69c62baba3fbc8d71f44aa6a9dab77f2aef`;
- current schema materially contradicts Front 1 evidence;
- implementation requires destructive migration;
- a new dependency is required without a reuse/license/security decision;
- a contract would broaden University/Government/employer private-data access;
- a product behavior choice from Wave 2+ is required;
- safe compatibility with current RLS/audit cannot be preserved.

Do not solve a stop condition by widening scope.
