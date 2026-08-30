# WAVE 8 — CLOSEOUT REPORT

**Status:** `WAVE_8_COMPLETE`
**Timezone:** Asia/Riyadh · **Closed:** 2026-08-30
**Integration branch:** `integration/wave8-final-closure`
**Base:** `WAVE_6_COMPLETE` `b7f6eae7ac14a1b26d0ea6d17f45cab0c6c5af13`

Wave 8 extends the Employer loop from applicants-only to governed Professional Discovery: explicit Individual opt-in, verified Business access, published-evidence search, explainable comparison (no match %), candidate-controlled invitation (never an Application), and provenance-bound operational intelligence.

---

## Reuse gate

| Surface | Decision |
| --- | --- |
| Wave 5 hiring roles / criteria / workspace | REUSE |
| Wave 6 `buildEvidenceComparisonGrid` / `assertNoAggregate` | REUSE |
| `profiles.visibility` + `show_profile_to_companies` (default private/false) | ADAPT as explicit discovery opt-in |
| Fail-closed Individual profile SELECT | REUSE; discovery is RPC-only |
| Career Operations / Abhathli / social | DEFER |

---

## Database (jid-nonprod `hmjuijmaefajdjrjdsxu`)

Forward-only. Production `znfhladafpajyjwcfzvv` untouched. No repair. No `--include-all`.

| Version | File |
| --- | --- |
| `20260830220000` | talent sourcing tables, RPCs, RLS |
| `20260830220100` | revoke direct writes (P1 self-repair) |

Remote also contains Wave 7 versions `20260830190000` / `20260830190100` with no GitHub `WAVE_7_COMPLETE` SHA at close. Wave 8 versions are later and additive.

---

## Validation

```
Focused tests ........ vitest tests/unit/talent-sourcing tests/unit/hiring-evidence tests/unit/hiring tests/unit/i18n/wave8-talent-sourcing-parity.test.ts — 9 files, 45 tests PASS
type-check ........... pnpm type-check PASS (pre-types); regenerated from nonprod
lint ................. next lint — No ESLint warnings or errors
build ................ next build PASS; sourcing page + 6 API routes registered
RLS matrix ........... scripts/wave8-rls-matrix.cjs against nonprod — WAVE8_RLS_MATRIX PASS (rollback)
RUNTIME .............. RPC search/invite/respond proven on nonprod with seed JWTs
AR/EN ................ message parity test PASS
MOBILE ............... 375px-critical layout: stacked sections, min-h-11 controls
```

---

## Outcomes

```
TALENT_SOURCING=IMPLEMENTED
PROFESSIONAL_DISCOVERY=GOVERNED
DISCOVERABILITY_CONTROL=PASS
VERIFIED_EMPLOYER_BOUNDARY=PASS
PRIVATE_DATA_BOUNDARY=PASS
EVIDENCE_SEARCH=IMPLEMENTED
EXPLAINABLE_RELEVANCE=PASS
NO_MATCH_PERCENTAGE=PASS
EVIDENCE_COMPARISON=PASS
NO_UNIVERSAL_SCORE=PASS
INVITATION_FLOW=IMPLEMENTED
APPLICATION_AGENCY=PASS
HIRING_INTELLIGENCE=TRUTHFUL
RLS=PASS
CROSS_ORG_ISOLATION=PASS
PRIVACY=PASS
AUDITABILITY=PASS
MIGRATIONS=APPLIED_NONPROD
GENERATED_TYPES=PASS
TESTS=PASS
TYPECHECK=PASS
LINT=PASS
BUILD=PASS
RUNTIME=PASS
AR=PASS
EN=PASS
MOBILE=PASS
P0=NONE
P1=NONE
DATA_LOSS=0
PRODUCTION_TOUCHED=NO
```
