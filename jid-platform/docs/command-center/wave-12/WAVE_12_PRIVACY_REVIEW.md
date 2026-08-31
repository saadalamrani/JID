# WAVE 12 — Privacy / reporting-truth review

**Scope:** one review, no loop.  
**Surfaces:** University report preview, snapshot, CSV export, print, RLS.

## Findings

| ID | Severity | Finding | Resolution |
| --- | --- | --- | --- |
| W12-R1 | P0 candidate, not reproduced | CSV export of suppressed cells | Closed: export payload is the snapshot JSON; CSV blanks `value` when `suppressed`, `insufficient`, or `contract_only`. RLS matrix asserts suppressed cells remain null. |
| W12-R2 | P0 candidate, not reproduced | Cross-university snapshot read | Closed: `university_report_get` fail-closes unless mapped catalog matches or Staff. Table RLS is catalog-scoped. |
| W12-R3 | P1 candidate, not reproduced | Unmapped owner generation | Closed: compose returns `fail_closed_reason=unmapped` / `no_owned_profile`. No snapshot insert. |
| W12-R4 | P2 | Live Wave 11 overlay key copy | Closed: overlay copies only `intelligence_available`, alignment/readiness flags, coverage, and `privacy_safe_aggregates`. Named keys are not selected. |
| W12-R5 | P3 | Stale snapshot interpretation | Closed: snapshots freeze `data_as_of`, methodology version, coverage, and aggregates. UI shows data-as-of on every surface. |
| W12-R6 | P3 | Fake benchmark risk | Closed: reference-set table check-constrains `status = 'UNAVAILABLE'`. Payload ranking/percentile/national_average are always null. |

## Required proofs

- Suppressed group leakage: PASS (value null in payload and CSV)
- CSV leakage of named fields: PASS (payload CHECK + CSV builder deny-list)
- Cross-University isolation: PASS (get + table RLS)
- Methodology mismatch: PASS (methodology_version frozen on snapshot)
- Stale snapshot interpretation: PASS (data_as_of visible)
- Fake benchmark: PASS (UNAVAILABLE foundation only)

P0=NONE  
P1=NONE  
Review loop: none.
