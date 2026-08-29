# WAVE 3 CLOSEOUT REPORT

**Status:** WAVE_3_CLOSED  
**Timezone:** Asia/Riyadh  
**Generated:** 2026-08-29  
**Branch:** `integration/wave3-final-closure`

Opportunity Graph + Lammah governed source layer — final integration closeout.

---

## SHAs

| Key | Value |
| --- | --- |
| `BASE_SHA` | `6510fcfadfb59c4bed4c0761501d6332c67655f5` |
| `WAVE_2_IMPLEMENTATION_SHA` | `509c2bbdb74cea6d16d3d33b6c3508ef2b0ba8b8` |
| `FRONT_A_SHA` | `f09ebcb52584da9a4bff07d5ae787d8a004eaa7b` (tip docs `e6edb33`) |
| `FRONT_B_SHA` | `08d1ed66efa4158457c8dc5d9668b8db37229a06` |
| `FINAL_SHA` | *(set after integration commit)* |

---

## Binary outcomes

| Outcome | Status | Evidence |
| --- | --- | --- |
| OPPORTUNITY_GRAPH | IMPLEMENTED | `src/lib/opportunity/**` discovery contract + loaders |
| LAMMAH_GOVERNED_SOURCE_LAYER | IMPLEMENTED | Existing Lammah registry/ingest/RLS preserved; rights helpers; staff surfaces retained |
| NATIVE_EXTERNAL_BOUNDARY | VERIFIED | Distinct `source_class`; UI legend; no employer-posting implication for Lammah |
| SOURCE_PROVENANCE | VERIFIED | `source_ref` / `source_record_ref` / source name on discovery items |
| SOURCE_RIGHTS | VERIFIED | `approved` / `candidate` / `prohibited` helpers; candidate ≠ auto-publish |
| FRESHNESS_LIFECYCLE | VERIFIED | Native published+deadline; Lammah active+expires+last_confirmed gate in `fetchLammahPageState` |
| DEDUPLICATION | VERIFIED | Existing DB native-precedence + ingest dedup suites retained (no schema rewrite) |
| NATIVE_PRECEDENCE | VERIFIED | `supersede_lammah_on_native_post` + RLS suite; discovery reads only `active` external |
| ORGANIZATION_RESOLUTION | VERIFIED | Raw name preserved; optional `company_id`; no Directory/Profile creation in Wave 3 |
| ENTITLEMENT | VERIFIED | Server-side `lammah_feed` before query; unentitled → empty, no inventory fetch |
| DISCOVERY_UI | IMPLEMENTED | Page via `listOpportunityDiscovery`; Opportunity-first AR/EN; provenance legend |
| AR / EN / RTL / LTR | VERIFIED | Copy tests + Wave 2 runtime evidence (Career Record); discovery copy parity |
| MOBILE | VERIFIED (Wave 2) / PARTIAL (discovery) | Wave 2 375px PASS; discovery board browser smoke not re-run this closeout |
| ACCESSIBILITY | PARTIAL | Landmarks/legend/tabs; full a11y audit not re-executed |
| TESTS | PASS | Opportunity unit 9 passed; Wave 2 runtime e2e 3 passed; Lammah RLS inherited |
| TYPECHECK | PASS | `tsc --noEmit` this session |
| LINT | SEE INTEGRATION LOG | |
| BUILD | SEE INTEGRATION LOG | |
| RUNTIME | PASS (Wave 2) / PARTIAL (Wave 3 board) | Authenticated Career Record/CV PASS; discovery board not browser-smoked on FINAL |
| RLS | PASS (inherited) | No Wave 3 migration; prior Lammah RLS/ingest denial evidence stands |
| SECURITY | PASS | Ingest remains non-anon; entitlement fail-closed; production untouched |
| PRIVACY | PASS | No Career Record sent to external sources; Lammah ≠ applications/comms |
| DATA_LOSS | 0 | No destructive migration |
| P0 | NONE | |
| P1 | NONE | |
| P2 | See deferred | |
| P3 | See deferred | |
| PRODUCTION_TOUCHED | NO | |

---

## Deferred

- Persist distinct `source_url` on published Lammah rows when ≠ apply
- Native `opportunity_type` column for non-job employer posts
- Rename JobBoard* internals → Opportunity*
- Full browser smoke of `/opportunities` AR/EN/375 after preview deploy
- Dedicated OpportunityCard unifying native/external chrome

---

## Production / preview

`PRODUCTION_TOUCHED=NO`  
`PRODUCTION_DEPLOYMENT=NO`  
`PREVIEW_DEPLOYMENT_TRIGGERED` — set from git push evidence below.

---

## Wave 2 entry gate

`WAVE_2_RUNTIME_EVIDENCE_CLOSED` — see `../wave-2/WAVE_2_RUNTIME_EVIDENCE_CLOSEOUT.md`

---

## Terminal token

`WAVE_3_COMPLETE <FINAL_SHA>`
