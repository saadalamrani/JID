# WAVE 3 — REUSE GATE (embedded in Front A)

**Question:** Source/portal adapters, normalization, deduplication, provenance, freshness for Opportunity Graph + Lammah.

## Internal first

Existing JID assets already cover the governed pipeline stages:

`SOURCE → RETRIEVE → RAW EVIDENCE → NORMALIZE → VALIDATE → DEDUP → ORG RESOLUTION → REVIEW → PUBLISH → REFRESH → SUPERSEDE`

Evidence: `lammah_*` migrations (095, 20260726, 20260803*), `src/lib/lammah/real-opportunities/*`, staff Lammah routes, RLS/ingest tests.

**Decision for internal stack:** **INTEGRATE** (reconcile + expose canonical read contract; do not rebuild).

## External seed: MadsLorentzen/ai-job-search

| Criterion | Assessment |
| --- | --- |
| License / dependency fit | Not adopted as a dependency; patterns only |
| Security | Scraping/auth bypass patterns rejected |
| Maintenance | Avoid new foreign product surface |
| Saudi source relevance | Low direct fit; connector ideas only |
| Stars | Irrelevant |

**Decision:** **EXTRACT_PATTERN**

Adopt only conceptual patterns already mirrored in JID:

- source adapters / connectors  
- normalization  
- deterministic dedup keys  
- provenance / freshness / source health  

**REJECT** product import: personalized ranking, CV tailoring, auto-apply, application orchestration, interview prep, user-specific search mandates (Wave 4 / out of scope).

## Outcome summary

| Candidate | Decision |
| --- | --- |
| Current JID Lammah + jobs | INTEGRATE |
| MadsLorentzen/ai-job-search | EXTRACT_PATTERN |
| Abhathli | REJECT for Wave 3 (Wave 4) |
| Greenfield Opportunity Graph DB rewrite | REJECT — wrap native + Lammah |
