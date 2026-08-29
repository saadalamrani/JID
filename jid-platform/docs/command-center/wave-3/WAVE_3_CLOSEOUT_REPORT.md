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
| `FRONT_A_SHA` | `f09ebcb52584da9a4bff07d5ae787d8a004eaa7b` (docs tip `e6edb33`) |
| `FRONT_B_SHA` | `08d1ed66efa4158457c8dc5d9668b8db37229a06` (docs tip `307cab3`) |
| `PREVIEW_LINT_FIX_SHA` | `774032845b19919cf76c2710ca7f667742664937` |
| `FINAL_SHA` | `774032845b19919cf76c2710ca7f667742664937` |

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
| AR | VERIFIED | Opportunity copy + Wave 2 runtime AR evidence |
| EN | VERIFIED | Opportunity copy + Wave 2 runtime EN evidence |
| RTL | VERIFIED | Wave 2 runtime `dir=rtl` |
| LTR | VERIFIED | Wave 2 runtime `dir=ltr` |
| MOBILE | VERIFIED (Wave 2) / PARTIAL (discovery board) | Wave 2 375px PASS; discovery board browser smoke not re-run on FINAL |
| ACCESSIBILITY | PARTIAL | Landmarks/legend/tabs; full a11y audit not re-executed on discovery board |
| TESTS | PASS | Opportunity unit 9 passed; Wave 2 runtime e2e 3 passed; Lammah RLS inherited |
| TYPECHECK | PASS | `pnpm type-check` on `7740328` |
| LINT | PASS | `pnpm lint` — No ESLint warnings or errors on `7740328` |
| BUILD | PASS | `pnpm build` — compiled, 313 static pages on `7740328` |
| RUNTIME | PASS (Wave 2) / PARTIAL (Wave 3 board) | Authenticated Career Record/CV PASS; discovery board browser smoke not re-run on FINAL |
| RLS | PASS (inherited) | No Wave 3 migration; prior Lammah RLS/ingest denial evidence stands |
| SECURITY | PASS | Ingest remains non-anon; entitlement fail-closed; production untouched |
| PRIVACY | PASS | No Career Record sent to external sources; Lammah ≠ applications/comms |
| DATA_LOSS | 0 | No destructive migration |
| P0 | NONE | |
| P1 | NONE | |
| PRODUCTION_TOUCHED | NO | |

---

## Preview lint fix (this closeout amendment)

Preview failed on `@typescript-eslint/consistent-type-imports` for inline
`import('@/types/job').JobsListResult` / `import('@/types/lammah').LammahPageState`.

Fix in `src/lib/opportunity/discovery-types.ts`:

- top-level `import type { JobsListResult } from '@/types/job'`
- top-level `import type { LammahPageState } from '@/types/lammah'`
- field types use those imported names

No ESLint rule disable. Opportunity contract semantics unchanged.

Verification on lint-fix SHA `7740328` (included in FINAL):

```text
pnpm lint        → ✔ No ESLint warnings or errors
pnpm type-check  → PASS
pnpm build       → PASS (313 pages)
```

---

## Deferred (P2/P3)

- Persist distinct `source_url` on published Lammah rows when ≠ apply
- Native `opportunity_type` column for non-job employer posts
- Rename JobBoard* internals → Opportunity*
- Full browser smoke of `/opportunities` AR/EN/375 after preview deploy
- Dedicated OpportunityCard unifying native/external chrome

---

## Production / preview

`PRODUCTION_TOUCHED=NO`  
`PRODUCTION_DEPLOYMENT=NO`  
`PREVIEW_DEPLOYMENT_TRIGGERED=YES` (git push of agent/experience and integration branches may trigger Vercel preview; not production)

---

## Wave 2 entry gate

`WAVE_2_RUNTIME_EVIDENCE_CLOSED` — see `../wave-2/WAVE_2_RUNTIME_EVIDENCE_CLOSEOUT.md`

---

## Front tokens

`WAVE_3_FRONT_A_COMPLETE f09ebcb52584da9a4bff07d5ae787d8a004eaa7b`  
`WAVE_3_FRONT_B_COMPLETE 08d1ed66efa4158457c8dc5d9668b8db37229a06`

---

## Terminal token

`WAVE_3_COMPLETE 774032845b19919cf76c2710ca7f667742664937`

Documentation tip after this closeout (if present) is docs-only and does not change product behavior.
