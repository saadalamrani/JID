# WAVE 3 — CURRENT TRUTH

**Timezone:** Asia/Riyadh  
**Generated:** 2026-08-29

## Git / environment

| Key | Value |
| --- | --- |
| `BASE_BRANCH` | `integration/wave2-final-closure` |
| `BASE_SHA` | `6510fcfadfb59c4bed4c0761501d6332c67655f5` (docs-only after implementation `509c2bb`) |
| `WORK_BRANCH` | `agent/cursor-wave3-opportunity-core-lammah` |
| `NONPROD_REF` | `hmjuijmaefajdjrjdsxu` |
| `PRODUCTION_REF` | `znfhladafpajyjwcfzvv` |
| `PRODUCTION_TOUCHED` | `NO` |
| `WAVE_2_RUNTIME_EVIDENCE` | `CLOSED` — see `../wave-2/WAVE_2_RUNTIME_EVIDENCE_CLOSEOUT.md` |

## Nonprod inventory (proven)

Script: `pnpm exec tsx scripts/wave3-nonprod-inventory.ts`

| Surface | Count |
| --- | --- |
| Native jobs total / published / draft | 2 / 1 / 1 |
| Lammah opportunities total / active | 13 / 13 |
| Lammah types | job 11, internship 2 |
| Lammah sources total / approved / candidate | 7 / 6 / 1 |
| Mapped org on Lammah / unresolved | 13 / 0 |
| Lammah radar items | 0 |

## Front budget

**2 FRONTS**

| Front | Owner | Scope |
| --- | --- | --- |
| A | Cursor (this session) | Opportunity Graph core, Lammah source governance reconciliation, services, backend tests |
| B | Cursor (after A SHA) | Discovery product experience on frozen read contract |

No Front 3 — reuse gate embeds in Front A.

## Reality drift (ADAPT / PRESERVE)

| Finding | Class |
| --- | --- |
| C3 `Opportunity` TypeScript contract exists | PRESERVE |
| Public board still Jobs-shaped (`JobBoardPageClient`, `fetchJobs`) | ADAPT |
| Native `jobs` has no `opportunity_type` (all native = JOB honestly) | PRESERVE + map |
| Lammah types / lifecycle / entitlement / native supersede exist | PRESERVE |
| Source registry with `approval_state` exists | PRESERVE |
| Published Lammah row stores `external_url`; candidate keeps source/apply split | ADAPT in read model |
| Boost columns on jobs; public sort ignores boost | PRESERVE (no paid organic) |
| Abhathli / match % | DEPRECATE-LATER / absent from discovery |
| Wave 4 Abhathli consumption | OUT OF SCOPE |

## REALITY_DRIFT

`MODERATE` — Lammah governed layer largely shipped; Opportunity Graph read model and discovery terminology not yet canonical.
