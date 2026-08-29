# WAVE 3 FRONT A CLOSEOUT

**FRONT:** A — Opportunity Core / Data / Source Governance  
**OWNER:** Cursor  
**BASE_SHA:** `6510fcfadfb59c4bed4c0761501d6332c67655f5`  
**BRANCH:** `agent/cursor-wave3-opportunity-core-lammah`

## CHANGED_AREAS

- Frozen Wave 3 domain contract + current truth + reuse gate
- Canonical Opportunity discovery read model (`src/lib/opportunity/**`)
- Wave 2 authenticated runtime evidence harness + closeout
- Nonprod inventory script (read-only)

## DB_CHANGES

None. Existing Lammah/jobs schema, RLS, ingest, native precedence preserved.

## MIGRATIONS

None (forward-only not required for read-model wrap).

## NONPROD_CHANGES

Read-only inventory query only. Career Record create/revise during Wave 2 runtime evidence used seed actor on nonprod (documented in Wave 2 runtime closeout).

## TESTS

```text
pnpm exec vitest run tests/unit/opportunity/discovery-contract.test.ts --pool=threads --maxWorkers=1
→ 7 passed
```

Inherited Lammah RLS/native-precedence/ingest-denial suites remain authoritative for DB security (not re-run this Front; no schema change).

## TYPECHECK / LINT / BUILD

Focused unit tests PASS. Full type-check/lint/build deferred to integration with Front B.

## RUNTIME

Wave 2 runtime evidence PASS (prerequisite). Opportunity Graph UI runtime = Front B.

## SECURITY / PRIVACY

- Entitlement boundary remains server-side in `fetchLammahPageState` (unentitled → no inventory query)
- Discovery mappers never expose boost/match scores
- Source rights helpers encode approved/candidate/prohibited without UI fake scores

## P0 / P1

NONE

## P2 / P3 / DEFERRED

- P2: persist distinct `source_url` on published `lammah_opportunities` (today join/candidate or equal apply)
- P2: native `opportunity_type` column if Business posts non-job families
- P3: full type-check/lint/build evidence on Front A alone

## PRODUCTION_TOUCHED

NO

## PREVIEW_DEPLOYMENT

NO (not yet pushed at closeout write time)

## COMPLETION_TOKEN

`WAVE_3_FRONT_A_COMPLETE` — record exact SHA after commit.
