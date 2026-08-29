# WAVE 3 FRONT B CLOSEOUT

**FRONT:** B — Opportunity Discovery Product Experience  
**OWNER:** Cursor  
**BASE_SHA:** `e6edb33d5433b3c61ee64074918854230bc6a344` (Front A tip)  
**FINAL_SHA:** `08d1ed66efa4158457c8dc5d9668b8db37229a06`  
**BRANCH:** `agent/cursor-wave3-opportunity-experience`

## CHANGED_AREAS

- Opportunities page loads via `listOpportunityDiscovery` (frozen Front A contract)
- Opportunity-first AR/EN copy (`opportunities.board|tabs|meta|legend`)
- Native vs external provenance legend (no match % / recommendation claims)
- Results landmark uses Opportunity wording

## DB_CHANGES

None

## MIGRATIONS

None

## NONPROD_CHANGES

None

## TESTS

```text
pnpm exec vitest run tests/unit/opportunity --pool=threads --maxWorkers=1
→ 9 passed
```

## TYPECHECK

`pnpm exec tsc --noEmit` — PASS (this session)

## LINT / BUILD / RUNTIME

Deferred to integration closeout for full `next lint` / `next build` / browser smoke.

## SECURITY / PRIVACY

Page uses server-side discovery loader; Lammah entitlement boundary unchanged (no client-side hide of protected inventory).

## P0 / P1

NONE

## P2 / P3 / DEFERRED

- P2: replace JobBoard* internal component names with Opportunity* (behavior already Opportunity-first)
- P2: dedicated OpportunityCard unifying native/external presentation
- P3: browser smoke of discovery board on this branch

## PRODUCTION_TOUCHED

NO

## COMPLETION_TOKEN

`WAVE_3_FRONT_B_COMPLETE 08d1ed66efa4158457c8dc5d9668b8db37229a06`
