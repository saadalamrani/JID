# JID — Wave 1 / Front 1 — Claude Execution Contract

**Front:** Current Reality + Contract Architecture
**Owner:** Claude Code
**Status:** OPEN
**Base branch:** `strategy/jid-wave1-prep-2026-08-26`
**Base SHA:** `bb34d41fd3527fd28912338db865a61ab170ca24`
**Execution branch:** `claude/wave1-front1-contract-architecture`

## TRUTH

Wave 0 is closed. Wave 1 has not implemented product behavior yet. The adopted Constitution, Founder Decisions, Wave Operating Model, Master Plan, and Wave 1 packet are the governing source set. Current repository/runtime evidence outranks historical reports.

## MISSION

Prove current implementation reality for Wave 1 shared contracts C1-C10, classify each `KEEP / ADAPT / REPLACE / MISSING`, perform bounded reuse/standards research where it materially changes a contract, and freeze one coherent architecture handoff for Codex and Cursor.

## SCOPE

- C1 Actor and authority
- C2 Canonical truth/projection
- C3 Purpose/disclosure/consent-authority
- C4 Audit/event/provenance
- C5 University affiliation/cohort linkage
- C6 Opportunity shared contract
- C7 Hiring/assessment evidence boundary
- C8 AI authority/explanation
- C9 Market portability / future market-adapter boundary
- C10 Design/frontend state foundation handoff

## NO-TOUCH

- No product feature implementation
- No database writes or migrations
- No production changes or deployments
- No Wave 2+ capability build
- No broad refactor
- No social/employer/university product implementation
- No invented pricing or metrics

## DEPENDENCIES

Read first:
1. `jid-platform/docs/JID_Agent_Operating_Constitution.md`
2. `jid-platform/docs/command-center/FOUNDER_DECISIONS_2026-08-26.md`
3. `jid-platform/docs/command-center/WAVE_OPERATING_MODEL.md`
4. `jid-platform/docs/command-center/MASTER_PLAN.md`
5. `jid-platform/docs/command-center/WAVE_1_SHARED_PRODUCT_CONTRACTS_AND_DESIGN_FOUNDATIONS.md`
6. `jid-platform/docs/command-center/WAVE_0_CLOSEOUT_REPORT.md`

Do not reread the full Strategy Office corpus unless one named unresolved contract requires one named source file.

## IMPLEMENTATION METHOD

For each C1-C10:
1. Inspect exact current files/types/tables/components/policies involved.
2. Record current behavior and source of truth.
3. Classify `KEEP / ADAPT / REPLACE / MISSING`.
4. Identify dependencies and conflict risk.
5. Run reuse/standards diligence only where relevant.
6. Recommend one minimal target contract.
7. Record migration/backward-compatibility risk without executing it.
8. Produce exact Codex and Cursor handoff boundaries.

## SECURITY / DATA

- Treat current RLS/read-path/privacy evidence as constraints to verify, not assumptions.
- No access expansion.
- No production data use.
- No claim of compliance/validity without evidence.

## TESTS / EVIDENCE

This front is architecture/research only. Evidence must be repository-grounded:
- exact paths
- exact tables/types/contracts
- current conflicts
- standards/OSS decisions and rejection reasons
- dependencies
- unknowns/blockers

Every claim must be classified as `VERIFIED`, `UNVERIFIED`, or `CONTRADICTED` where material.

## REQUIRED OUTPUTS

Create only:
- `jid-platform/docs/command-center/wave-1/WAVE_1_CURRENT_REALITY_MAP.md`
- `jid-platform/docs/command-center/wave-1/WAVE_1_ARCHITECTURE_AND_REUSE_PACKET.md`
- `jid-platform/docs/command-center/wave-1/WAVE_1_CONTRACT_SPEC.md`
- `jid-platform/docs/command-center/wave-1/WAVE_1_DESIGN_FOUNDATION_HANDOFF.md`
- `jid-platform/docs/command-center/wave-1/WAVE_1_RISK_AND_DECISION_LOG.md`

## GIT

Work only on `claude/wave1-front1-contract-architecture`.
Commit coherent documentation changes only.
Do not merge.

## ROLLBACK

Documentation-only front. Rollback is branch abandonment or revert of the front commit(s). No runtime rollback should be necessary because runtime must not change.

## STOP CONDITIONS

Stop and report if:
- branch/SHA does not match expected baseline lineage;
- current repository truth contradicts an adopted founder decision in a way that requires founder choice;
- a contract cannot be frozen without touching Wave 2+ implementation;
- source/license/security facts cannot be verified sufficiently for a reuse decision.

## DEFINITION OF DONE

Front 1 is DONE only when:
- C1-C10 all have current-reality evidence;
- each has `KEEP / ADAPT / REPLACE / MISSING` classification;
- one coherent target contract set is frozen;
- reuse/standards decisions are recorded where relevant;
- unresolved conflicts are zero or explicitly founder-blocked;
- Codex handoff is exact and non-overlapping;
- Cursor handoff is exact and non-overlapping;
- no runtime/database/production behavior changed.

Return:
- branch
- final SHA
- files created/changed
- C1-C10 summary
- reuse/standards decisions
- conflicts/blockers
- exact Codex handoff
- exact Cursor handoff

End exactly with either:

`WAVE_1_FRONT_1_COMPLETE`

or

`BLOCKED_WITH_EXACT_CAUSE`
