# WAVE 10 — CLOSEOUT REPORT

**Status:** `WAVE_10_COMPLETE` (FINAL_SHA recorded after closeout commit / push)
**Timezone:** Asia/Riyadh · **Closed:** 2026-08-31
**Integration branch:** `integration/wave10-final-closure`
**Base:** `ROUND_1_COMPLETE` `57ad532073556e23110ab8bead8ef2b1598c9e79`
**Wave 9 lineage (reconciled once):** `fcc5a51ea2c2c68652a993d762a79b010b5f418b` (`feat(network): implement governed professional layer`)

Wave 10 establishes the truthful University data foundation: Staff-only identity
reconciliation between `universities_catalog.id` and owned `companies.id`,
DECLARED / VERIFIED / NEEDS_REVIEW affiliation, cohort membership with provenance,
and outcome evidence that keeps unknown as unknown.

Identity spaces are not collapsed. Mapping is never inferred from names.

---

## 1. SHAs

| Key | Value |
| --- | --- |
| `ROUND_1_COMPLETE` | `57ad532073556e23110ab8bead8ef2b1598c9e79` |
| Wave 9 git SHA (reconcile-once) | `fcc5a51ea2c2c68652a993d762a79b010b5f418b` |
| `WAVE_9_COMPLETE` marker | **not present in git**; Wave 9 migrations `20260831130000` / `20260831130100` are applied on jid-nonprod |
| `FINAL_SHA` | branch tip after this closeout commit (terminal handoff) |

Reconciliation was **once**, onto the Wave 9 professional-layer SHA. No second rebase.

---

## 2. Reuse gate

| Surface | Decision |
| --- | --- |
| `universities_catalog` / `profiles.university_id` | REUSE as catalog identity |
| `university_profiles.directory_id` → `companies.id` | REUSE as owned identity |
| Gate A fail-closed owner view | PRESERVE; new foundation snapshot replaces unsafe KPI restore |
| Affiliation contract in `src/types/contracts/university.ts` | IMPLEMENT |
| Employment rate / ranking / success score | DEFER (CONTRACT_ONLY, not displayed as a rate) |
| Wave 11 employability intelligence | DEFER |
| Wave 12 reporting / accreditation | DEFER |

Older University dashboard snapshot KPIs remain fail-closed. Wave 10 does not
restore unconsented student-level aggregates as institutional intelligence.

---

## 3. Database (jid-nonprod `hmjuijmaefajdjrjdsxu`)

Forward-only. Production `znfhladafpajyjwcfzvv` untouched. `DATA_LOSS=0`.

| Version | File |
| --- | --- |
| `20260831140000` | identity mapping, affiliation, cohorts, outcomes, metric contracts, RPCs, RLS |
| `20260831140100` | revoke direct table writes (RPC-only) |

Apply script: `scripts/wave10-nonprod-apply.cjs` (refuses production host).

Apply evidence:

```text
APPLIED 20260831140000 to jid-nonprod
APPLIED 20260831140100 to jid-nonprod
```

First apply of `20260831140000` failed (`functions in index expression must be marked IMMUTABLE`
because the unique index used `degree_level::text` / `btrim`). Corrected in-file to
coalesce of `major_id::text` / `program_text` only, then applied. No history repair,
no `--include-all`, no production write.

RPC writes only. `authenticated` SELECT. `anon` has no table privilege.

---

## 4. Privacy review

One independent University privacy/RLS review: `WAVE_10_PRIVACY_REVIEW.md`.
P0/P1: none recorded at close. P2: none. P3: two recorded and closed (W10-R7, W10-R8).

---

## 5. Product surfaces

Individual:

- `/[locale]/profile/university-affiliation` — declare / request review / revoke own affiliation
- no mandatory university-email verification
- nav + quick actions + account menu

Staff:

- `/[locale]/staff/universities` — create/revoke mapping; NEEDS_REVIEW queue

University owner:

- `/[locale]/university/dashboard` — `university_owner_foundation_snapshot()` JSON
- unmapped → fail-closed empty state, no invented match from names
- mapped → verified affiliation count, cohorts, provenance-bound outcome counts, metric contracts
- `employment_rate` remains CONTRACT_ONLY (`Not computable yet` / `غير قابل للحساب حالياً`)

Arabic-first via `next-intl`. English key parity. Latin digits (`numberingSystem: 'latn'`).
Responsive `sm:grid-cols-2` and `min-h-11` touch targets.

---

## 6. Nonprod RLS actor matrix (rollback-only)

Command: `node scripts/wave10-rls-matrix.cjs`

```text
WAVE10_RLS_ACTOR_MATRIX_PASS
WAVE10_RLS_MATRIX PASS
```

Fixtures roll back. Actors: graduate Individual, unrelated Individual, mapped University
owner, unmapped/pending University owner, Business, Staff, anon.

Proven:

- Staff-only mapping create/revoke
- one-to-one active mapping
- unmapped owner fail-closed snapshot, no named rows
- owner cannot SELECT named affiliations / outcomes
- cross-university cohort isolation
- anon: `insufficient_privilege` (no GRANT), not an empty-count disguise
- `university_%` audit trail present

---

## 7. Validation

```text
Migrations ............... APPLIED_NONPROD 20260831140000 + 20260831140100
Generated types .......... RPC + enum signatures patched in src/lib/supabase/types.ts
                           (no local supabase stack; table reads use fail-closed untyped helpers)
RLS actor matrix ........ WAVE10_RLS_MATRIX PASS
Focused tests ........... pnpm exec vitest run tests/unit/university
                          tests/unit/entity/university-dashboard-honesty.test.tsx
                          tests/unit/shell/organization-shell-separation.test.ts
                          tests/unit/navigation/individual-quick-actions.test.ts
                          tests/unit/professional-network
                          6 files — PASS
type-check .............. pnpm type-check — PASS
lint .................... pnpm lint — PASS (no warnings)
build ................... pnpm build — PASS; routes registered:
                          /[locale]/profile/university-affiliation
                          /[locale]/staff/universities
                          /[locale]/university/dashboard
Runtime ................. PASS at DB/API/compile boundary (matrix + fail-closed queries + routes)
AR / EN ................. PASS (next-intl + key-parity unit test)
Mobile .................. PASS (responsive grids + 44px-class controls; live viewport not available here)
P0 / P1 ................. NONE
DATA_LOSS ............... 0
PRODUCTION_TOUCHED ...... NO
```

Live authenticated browser/Preview click-through was not available in this environment
(no browser automation). Honesty of empty/unmapped/CONTRACT_ONLY states is covered by
`university-dashboard-honesty.test.tsx` and the nonprod actor matrix.

---

## 8. Out of scope (recorded, not built)

- Wave 11 employability intelligence
- Wave 12 reporting / accreditation / benchmarking
- employment rate, median time-to-employment, program ranking, graduate success score as displayed metrics
- collapsing catalog id with directory id
- restoring Claim Existing Profile or Commitment Score
