# WAVE 10 — University privacy / RLS review

**Mode:** one independent review, no loop.
**Date:** 2026-08-31 (Asia/Riyadh)
**Scope:** identity mapping, affiliation, cohorts, outcome evidence, owner snapshot.

## Findings

| ID | Severity | Finding | Disposition |
| --- | --- | --- | --- |
| W10-R1 | — | Staff-only mapping RPCs; University owner / Business / Individual cannot create mapping | PASS |
| W10-R2 | — | Active mapping is one-to-one on catalog id and directory id | PASS |
| W10-R3 | — | Unmapped University owner snapshot returns fail-closed JSON, no named rows | PASS |
| W10-R4 | — | Named affiliation / membership / outcome rows are Individual-self or Staff only | PASS |
| W10-R5 | — | Affiliation does not grant Career Record, CV, applications, or contact access | PASS |
| W10-R6 | — | Outcome missingness cannot become unemployed; UNKNOWN is explicit | PASS |
| W10-R7 | P3 | Owner snapshot is SECURITY DEFINER aggregate JSON; future Wave 11 must not add named fields without a purpose + authorization table | Record and close |
| W10-R8 | P3 | Metric definitions are readable by any authenticated user (no PII). Acceptable for contract catalog | Record and close |

P0=NONE
P1=NONE

## Actor matrix (intended)

- Individual graduate: declare/manage own affiliation; cannot map identities
- Unrelated Individual: no named affiliation rows
- Mapped University owner: aggregate foundation only
- Unmapped University owner: fail closed
- Different University: no cross-catalog cohort/affiliation named or aggregate leak
- Business: no mapping, no named graduate rows
- Staff: create/revoke mapping; review NEEDS_REVIEW
- Anon: no table SELECT, no RPC execute
